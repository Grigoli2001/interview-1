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
  messages: z.array(messageParamSchema).optional(),
  conversationId: z.string().cuid().optional(),
  /** When true, use last user message from conversation instead of creating new one. Requires conversationId. */
  retry: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.retry) return !!data.conversationId;
    return (data.messages?.length ?? 0) >= 1;
  },
  { message: "Either messages (min 1) or retry with conversationId required" },
);

export const extractRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;
