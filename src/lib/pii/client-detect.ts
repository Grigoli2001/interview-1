/**
 * Client-side PII span detection using regex patterns.
 * Runs in the browser for instant masking without an API call.
 * Detects: emails, credit card numbers, and alphanumeric codes (e.g. AV18HJDSAG).
 */

import type { PiiSpan } from "./types";

const PATTERNS: Array<{ type: string; regex: RegExp }> = [
  { type: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  {
    type: "credit_card",
    regex: /\b(?:\d{4}[-.\s]?){3}\d{4}\b|\b\d{13,19}\b/g,
  },
  {
    type: "code",
    regex: /\b(?=.*[0-9])(?=.*[A-Za-z])[A-Za-z0-9]{6,}\b/g,
  },
];

/**
 * Detects PII spans in text using regex. Returns character indices.
 * Detects: emails, credit card numbers, alphanumeric codes (e.g. order IDs, reference numbers).
 */
export function detectPiiClient(text: string): PiiSpan[] {
  if (typeof text !== "string" || text.length === 0) return [];

  const spans: PiiSpan[] = [];
  const seen = new Set<string>();

  for (const { type, regex } of PATTERNS) {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const key = `${match.index}-${match.index + match[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      spans.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
      });
    }
  }

  return spans.sort((a, b) => a.start - b.start);
}
