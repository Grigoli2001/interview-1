import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/env";

/**
 * Shared Anthropic client for LLM routes.
 * Model: Claude Sonnet 4.5 - recommended for interview (GPT-4 / Claude Sonnet equivalent).
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
export const DEFAULT_MAX_TOKENS = 1024;

/** Model for PII detection — fast, low-cost. */
export const PII_MODEL = "claude-haiku-4-5-20251001";

/** Max input tokens for context window (200K total, leave room for response). */
export const CONTEXT_WINDOW_MAX_INPUT_TOKENS = 180_000;

/** System prompt for the chat route. Defines assistant role and behavior. */
export const CHAT_SYSTEM_PROMPT = `You are a helpful, concise assistant. Be clear and direct in your responses.

When you see "[REDACTED]" in the user's message, it means sensitive information (e.g. email, phone, credit card) was intentionally removed for privacy before reaching you. Do not ask the user to share or type out that information. Work with the redacted text and respond naturally as if the placeholder represents the actual data in context.`;

/** System prompt for the extract route. Defines extraction task and output format. */
export const EXTRACT_SYSTEM_PROMPT = `You are an extraction assistant. Your task is to extract structured data from user-provided text. Return only valid JSON matching the requested schema. Do not include explanations or markdown.`;

/** System prompt for PII detection. Returns character indices only, no text content. */
export const PII_SYSTEM_PROMPT = `You are a PII (personally identifiable information) detection assistant. Your task is to identify all PII spans in the given text and return their character indices (0-based, inclusive start, exclusive end).

PII types to detect: email, phone, ssn, credit_card, address, person_name, ip_address, date_of_birth, passport, iban, zip_code, and similar sensitive data.

Return a JSON object with a "spans" array. Each span must have:
- start: number (0-based character index, inclusive)
- end: number (0-based character index, exclusive)
- type: string (e.g. "email", "phone", "ssn", "credit_card", "address", "person_name", "ip_address", "date_of_birth", "passport", "iban", "zip_code")

Do not include the actual PII text in the response — only indices and type. Ensure spans do not overlap.`;
