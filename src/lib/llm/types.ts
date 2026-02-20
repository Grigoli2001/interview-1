import { z } from "zod";

/**
 * Anthropic message content block (text).
 */
const textBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * Anthropic message - supports string or block content.
 */
const messageContentSchema = z.union([
  z.string(),
  z.array(z.union([textBlockSchema, z.record(z.string(), z.unknown())])),
]);

export const messageParamSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: messageContentSchema,
});

export const chatRequestSchema = z.object({
  messages: z.array(messageParamSchema).min(1, "At least one message required"),
  conversationId: z.string().cuid().optional(),
});

export const extractRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
