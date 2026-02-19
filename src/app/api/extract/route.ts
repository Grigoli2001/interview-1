import { NextResponse } from "next/server";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  anthropic,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  EXTRACT_SYSTEM_PROMPT,
} from "@/lib/llm/client";
import { extractRequestSchema } from "@/lib/llm/types";
import { logger } from "@/lib/logger";
import { sanitize } from "@/lib/pii/sanitize";
import { auth } from "@/lib/auth";

const actionItemSchema = z.object({
  task: z.string(),
  assignee: z.string().optional(),
});

const extractOutputSchema = z.object({
  actionItems: z.array(actionItemSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Extract request received");

  try {
    const body = await request.json();
    const parsed = extractRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError =
        parsed.error.flatten().fieldErrors.text?.[0] ?? parsed.error.message;
      logger.warn("Extract validation failed", { error: firstError });
      return NextResponse.json(
        { error: firstError ?? "Invalid request" },
        { status: 400 },
      );
    }

    const sanitizedText = sanitize(parsed.data.text);

    const message = await anthropic.messages.parse({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: EXTRACT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract action items from the following text.\n\nText:\n${sanitizedText}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(extractOutputSchema),
      },
    });

    const parsedOutput = message.parsed_output;

    if (parsedOutput === null) {
      logger.warn("Extract returned null parsed_output");
      return NextResponse.json(
        { error: "Failed to parse extraction result" },
        { status: 500 },
      );
    }

    return NextResponse.json({ parsed_output: parsedOutput });
  } catch (error) {
    logger.error("Extract request failed", { error });
    return NextResponse.json(
      { error: "Failed to extract action items" },
      { status: 500 },
    );
  } finally {
    logger.info("Extract request completed");
  }
}
