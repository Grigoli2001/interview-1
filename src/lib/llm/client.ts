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

/** Max input tokens for context window (200K total, leave room for response). */
export const CONTEXT_WINDOW_MAX_INPUT_TOKENS = 180_000;

/** System prompt for the chat route. Defines assistant role and behavior. */
export const CHAT_SYSTEM_PROMPT = `You are a helpful, concise assistant. Be clear and direct in your responses.`;

/** System prompt for the extract route. Defines extraction task and output format. */
export const EXTRACT_SYSTEM_PROMPT = `You are an extraction assistant. Your task is to extract structured data from user-provided text. Return only valid JSON matching the requested schema. Do not include explanations or markdown.`;
