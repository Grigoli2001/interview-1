import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, PII_MODEL, PII_SYSTEM_PROMPT } from "@/lib/llm/client";
import { piiDetectOutputSchema, type PiiSpan } from "./types";

/**
 * Detects PII spans in text using Claude Haiku.
 * Returns character indices (start, end) and type for each PII span.
 * Does not return the actual PII content.
 */
export async function detectPii(text: string): Promise<PiiSpan[]> {
  if (typeof text !== "string" || text.length === 0) {
    return [];
  }

  const message = await anthropic.messages.parse({
    model: PII_MODEL,
    max_tokens: 1024,
    system: PII_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyze the following text and identify all PII (personally identifiable information). Return the character indices (0-based) for each span.\n\nText:\n${text}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(piiDetectOutputSchema),
    },
  });

  const parsed = message.parsed_output;
  if (parsed === null) {
    return [];
  }

  return parsed.spans;
}
