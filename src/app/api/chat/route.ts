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

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const sanitized = sanitizeMessages(parsed.data.messages) as MessageParam[];

    const stream = anthropic.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: CHAT_SYSTEM_PROMPT,
      messages: sanitized,
    });

    const readableStream = stream.toReadableStream();

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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
