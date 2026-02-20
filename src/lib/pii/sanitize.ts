/**
 * PII Sanitizer - Redacts PII from user input before sending to the LLM.
 * Uses redact-pii for detection and our custom code pattern for alphanumeric IDs.
 */

import { SyncRedactor } from "redact-pii";

const redactor = new SyncRedactor({
  globalReplaceWith: "[REDACTED]",
  builtInRedactors: {
    emailAddress: { enabled: true },
    creditCardNumber: { enabled: true },
    phoneNumber: { enabled: true },
    usSocialSecurityNumber: { enabled: true },
    streetAddress: { enabled: true },
    names: { enabled: false },
    zipcode: { enabled: false },
    ipAddress: { enabled: false },
    username: { enabled: false },
    password: { enabled: false },
    credentials: { enabled: false },
    digits: { enabled: false },
    url: { enabled: false },
  },
  customRedactors: {
    before: [
      {
        regexpPattern: /\b(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9]{6,}\b/g,
        replaceWith: "[REDACTED]",
      },
    ],
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
 * assistant messages are left as-is (model output).
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
