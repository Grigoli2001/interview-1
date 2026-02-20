/**
 * PII Sanitizer - Redacts emails, phone numbers, and names from user input
 * before sending data to the LLM. Required for interview compliance.
 *
 * Uses redact-pii for reliable detection (well-known names list, robust regex
 * patterns) instead of custom heuristics.
 */

import { SyncRedactor } from "redact-pii";

const redactor = new SyncRedactor({
  globalReplaceWith: "[REDACTED]",
  builtInRedactors: {
    creditCardNumber: { enabled: true },
    streetAddress: { enabled: true },
    zipcode: { enabled: false },
    ipAddress: { enabled: false },
    usSocialSecurityNumber: { enabled: false },
    username: { enabled: false },
    password: { enabled: false },
    credentials: { enabled: false },
    digits: { enabled: false },
    url: { enabled: false },
  },
});

/**
 * Redacts PII from text before sending to the LLM.
 */
export function sanitize(text: string): string {
  if (typeof text !== "string" || text.length === 0) {
    return text;
  }
  return redactor.redact(text);
}

/**
 * Sanitizes user messages in a conversation. Only user messages are sanitized;
 * assistant and system messages are left as-is (assistant is model output,
 * system is typically controlled).
 *
 * @param messages - Array of messages (Anthropic MessageParam format)
 * @returns New array with user message content sanitized
 */
export function sanitizeMessages<T extends { role: string; content: unknown }>(
  messages: T[]
): T[] {
  return messages.map((msg) => {
    if (msg.role !== "user") return msg;

    if (typeof msg.content === "string") {
      return { ...msg, content: sanitize(msg.content) } as T;
    }

    if (Array.isArray(msg.content)) {
      const sanitizedContent = msg.content.map((block) => {
        const blockObj = block as { type?: string; text?: string };
        if (blockObj.type === "text" && typeof blockObj.text === "string") {
          return { ...block, text: sanitize(blockObj.text) };
        }
        return block;
      });
      return { ...msg, content: sanitizedContent } as T;
    }

    return msg;
  });
}
