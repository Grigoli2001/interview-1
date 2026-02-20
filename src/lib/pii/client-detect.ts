/**
 * Client-side PII span detection using regex patterns.
 * Runs in the browser for instant masking without an API call.
 * Aligns with redact-pii and PII model types. LLM overwrites after generation.
 */

import type { PiiSpan } from "./types";

const PATTERNS: Array<{ type: string; regex: RegExp }> = [
  { type: "email", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  {
    type: "phone",
    regex:
      /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|(?:\+?[0-9]{1,3}[-.\s]?)?[0-9]{2,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{2,4}(?:[-.\s]?[0-9]{2,4})?|(?:\+44\s?)?0?\d{4}\s?\d{6}/g,
  },
  {
    type: "ssn",
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b|\b\d{9}\b/g,
  },
  {
    type: "credit_card",
    regex: /\b(?:\d{4}[-.\s]?){3}\d{4}\b|\b\d{13,19}\b/g,
  },
  {
    type: "street_address",
    regex:
      /\b\d{1,5}\s+[\w\s]{3,50}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl|circle|cir|terrace|ter|highway|hwy|parkway|pkwy)\b\.?/gi,
  },
  {
    type: "person_name",
    regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
  },
  {
    type: "ip_address",
    regex:
      /\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  },
  {
    type: "date_of_birth",
    regex:
      /\b(?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[\/\-](?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])\b/g,
  },
  {
    type: "passport",
    regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
  },
  {
    type: "iban",
    regex: /\b[A-Z]{2}\d{2}\s?(?:\d{4}\s?){2,}\d{0,4}\b/g,
  },
  {
    type: "zip_code",
    regex: /\b\d{5}(?:-\d{4})?\b|\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/g,
  },
];

/**
 * Detects PII spans in text using regex. Returns character indices.
 * Use for user messages to avoid an API call.
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
