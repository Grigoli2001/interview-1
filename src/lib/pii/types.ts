import { z } from "zod";

export const piiSpanSchema = z.object({
  start: z.number(),
  end: z.number(),
  type: z.string(),
});

export const piiDetectOutputSchema = z.object({
  spans: z.array(piiSpanSchema),
});

export const piiDetectRequestSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export type PiiSpan = z.infer<typeof piiSpanSchema>;
export type PiiDetectOutput = z.infer<typeof piiDetectOutputSchema>;
export type PiiDetectRequest = z.infer<typeof piiDetectRequestSchema>;

/** Parse piiSpans from DB (Prisma Json). Returns empty array if invalid. */
export function parsePiiSpansFromDb(value: unknown): PiiSpan[] {
  const input =
    Array.isArray(value) ? { spans: value } : { spans: [] };
  const parsed = piiDetectOutputSchema.safeParse(input);
  return parsed.success ? parsed.data.spans : [];
}
