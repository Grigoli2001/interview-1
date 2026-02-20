import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import {
  anthropic,
  CONTEXT_WINDOW_MAX_INPUT_TOKENS,
  DEFAULT_MODEL,
} from "@/lib/llm/client";

export function extractTextFromContent(
  content: string | Array<{ type?: string; text?: string }>,
): string {
  if (typeof content === "string") return content;
  return (content as Array<{ type?: string; text?: string }>)
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((b) => b.text as string)
    .join("");
}

export function dbMessagesToParams(
  messages: Array<{ role: string; content: string }>,
): MessageParam[] {
  return messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

export async function trimToContextWindow(
  messages: MessageParam[],
  system: string,
): Promise<MessageParam[]> {
  let trimmed = [...messages];
  while (trimmed.length > 0) {
    const { input_tokens } = await anthropic.messages.countTokens({
      model: DEFAULT_MODEL,
      messages: trimmed,
      system,
    });
    if (input_tokens <= CONTEXT_WINDOW_MAX_INPUT_TOKENS) {
      return trimmed;
    }
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

export function extractTextFromAssistantContent(
  content: Array<{ type?: string; text?: string }>,
): string {
  return content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
}
