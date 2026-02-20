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
import { sanitizeMessages } from "@/lib/pii/sanitize";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dbMessagesToParams,
  extractTextFromAssistantContent,
  extractTextFromContent,
  trimToContextWindow,
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

    const { messages: newMessages, conversationId } = parsed.data;

    let conversation: { id: string };
    let historyMessages: MessageParam[] = [];

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
    } else {
      const created = await prisma.conversation.create({
        data: { userId },
      });
      conversation = { id: created.id };
    }

    const allMessages: MessageParam[] = [
      ...historyMessages,
      ...(newMessages as MessageParam[]),
    ];
    const sanitized = sanitizeMessages(allMessages) as MessageParam[];
    const withinContext = await trimToContextWindow(
      sanitized,
      CHAT_SYSTEM_PROMPT,
    );

    const lastUserMessage = newMessages[newMessages.length - 1];
    const userContent = extractTextFromContent(lastUserMessage.content);

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: userContent,
      },
    });

    const stream = anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: CHAT_SYSTEM_PROMPT,
      messages: withinContext,
    });

    stream.finalMessage().then(
      (msg) => {
        const textContent = extractTextFromAssistantContent(msg.content);
        return prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: textContent,
          },
        });
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
