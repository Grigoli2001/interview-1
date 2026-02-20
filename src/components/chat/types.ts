import type { PiiSpan } from "@/lib/pii/types";

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  piiSpans?: PiiSpan[] | null;
};
