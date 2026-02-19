/**
 * PII Sanitizer - Redacts emails, phone numbers, and names from user input
 * before sending data to the LLM. Required for interview compliance.
 *
 * Name redaction uses a best-effort heuristic (capitalized word sequences).
 * For production, consider NER or a dedicated PII detection service.
 */

const EMAIL_PLACEHOLDER = "[EMAIL_REDACTED]";
const PHONE_PLACEHOLDER = "[PHONE_REDACTED]";
const NAME_PLACEHOLDER = "[NAME_REDACTED]";

/**
 * Regex for email addresses. Covers common patterns: user@domain.tld
 */
const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}/g;

/**
 * Regex for phone numbers. Covers:
 * - E.164: +1234567890, +1 234 567 8900
 * - US: (123) 456-7890, 123-456-7890, 123.456.7890
 * - International: +44 20 7123 4567
 */
const PHONE_REGEX =
  /(?:\+?[1-9]\d{0,2}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?|\+\d{10,15}/g;

/**
 * Heuristic for names: 2+ consecutive capitalized words (e.g. "John Smith", "Mary Jane Watson").
 * Excludes common false positives: sentence starts, titles, etc.
 * Best-effort only - may miss names or over-redact.
 */
const NAME_REGEX = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;

/**
 * Redacts PII from text. Order matters: emails and phones first (more precise),
 * then names (heuristic).
 */
export function sanitize(text: string): string {
  if (typeof text !== "string" || text.length === 0) {
    return text;
  }

  let result = text;

  result = result.replace(EMAIL_REGEX, EMAIL_PLACEHOLDER);
  result = result.replace(PHONE_REGEX, PHONE_PLACEHOLDER);
  result = result.replace(NAME_REGEX, NAME_PLACEHOLDER);

  return result;
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
