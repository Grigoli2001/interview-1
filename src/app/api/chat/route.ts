import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { NextResponse } from "next/server";
import {
  anthropic,
  CHAT_SYSTEM_PROMPT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
} from "@/lib/llm/client";
import { chatRequestSchema } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import { detectPii } from "@/lib/pii/detect";
import { detectPiiClient } from "@/lib/pii/client-detect";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dbMessagesToParams,
  extractTextFromAssistantContent,
  extractTextFromContent,
  trimToContextWindow,
  truncateForTitle,
} from "./utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  if (!userId) {
    logger.warn("Chat request: session missing user.id");
    return NextResponse.json(
      { error: "Session invalid" },
      { status: 401 },
    );
  }

  logger.info("Chat request received");

  try {
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.flatten().fieldErrors.messages?.[0] ??
        parsed.error.message;
      logger.warn("Chat validation failed", { error: firstError });
      return NextResponse.json(
        { error: firstError ?? "Invalid request" },
        { status: 400 },
      );
    }

    const { messages: newMessages, conversationId, retry } = parsed.data;

    let conversation: { id: string };
    let historyMessages: MessageParam[] = [];
    let userContent: string;

    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
      conversation = { id: existing.id };
      historyMessages = dbMessagesToParams(existing.messages);

      if (retry) {
        const lastUser = existing.messages
          .filter((m) => m.role === "user")
          .pop();
        if (!lastUser) {
          return NextResponse.json(
            { error: "No user message to retry" },
            { status: 400 },
          );
        }
        userContent = lastUser.content;
      } else {
        const lastUserMessage = newMessages![newMessages!.length - 1];
        userContent = extractTextFromContent(lastUserMessage.content);
      }
    } else {
      const lastUserMessage = newMessages![newMessages!.length - 1];
      userContent = extractTextFromContent(lastUserMessage.content);
      const title = truncateForTitle(userContent);
      const created = await prisma.conversation.create({
        data: { userId, title },
      });
      conversation = { id: created.id };
    }

    const allMessages: MessageParam[] = retry
      ? historyMessages
      : [
          ...historyMessages,
          ...(newMessages as MessageParam[]),
        ];
    const withinContext = await trimToContextWindow(
      allMessages as MessageParam[],
      CHAT_SYSTEM_PROMPT,
    );

    let userMsg: { id: string } | null = null;
    if (!retry) {
      userMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userContent,
        },
      });

      const userPiiSpans = detectPiiClient(userContent);
      if (userPiiSpans.length > 0) {
        prisma.message
          .update({
            where: { id: userMsg.id },
            data: { piiSpans: userPiiSpans as object },
          })
          .catch((err) =>
            logger.error("Failed to persist user message PII spans", {
              error: err,
            }),
          );
      }
    }

    const stream = anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: CHAT_SYSTEM_PROMPT,
      messages: withinContext,
    });

    stream.finalMessage().then(
      async (msg) => {
        const textContent = extractTextFromAssistantContent(msg.content);
        const regexSpans = detectPiiClient(textContent);
        const created = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: textContent,
            ...(regexSpans.length > 0 && { piiSpans: regexSpans as object }),
          },
        });

        // PII model is the final source of truth. Always overwrite regex spans.
        try {
          const llmSpans = await detectPii(textContent);
          await prisma.message.update({
            where: { id: created.id },
            data: { piiSpans: (llmSpans.length > 0 ? llmSpans : []) as object },
          });
          const types = [...new Set(llmSpans.map((s) => s.type))].join(", ");
          logger.info("PII model updated message spans in DB", {
            messageId: created.id,
            conversationId: conversation.id,
            spanCount: llmSpans.length,
            types: types || "(none)",
          });
        } catch (piiErr) {
          logger.warn("PII model detection failed, keeping regex spans", {
            error: piiErr,
          });
        }

        return created;
      },
      (err) => {
        logger.error("Failed to persist assistant message", { error: err });
      },
    );

    const readableStream = stream.toReadableStream();

    const headers: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Conversation-Id": conversation.id,
    };

    return new Response(readableStream, { headers });
  } catch (error) {
    logger.error("Chat request failed", { error });
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  } finally {
    logger.info("Chat request completed");
  }
}
