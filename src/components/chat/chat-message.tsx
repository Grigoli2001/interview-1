"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { detectPiiClient } from "@/lib/pii/client-detect";
import { PiiMaskedText } from "./pii-masked-text";
import type { Message } from "./types";

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasStoredSpans = message.piiSpans != null && message.piiSpans.length > 0;
  const clientSpans = useMemo(
    () => detectPiiClient(message.content),
    [message.content],
  );
  const { effectiveSpans, source } = useMemo(() => {
    if (hasStoredSpans && message.piiSpans) {
      const len = message.content.length;
      const valid = message.piiSpans.filter(
        (s) => s.start >= 0 && s.end <= len && s.start < s.end,
      );
      return {
        effectiveSpans: valid.length > 0 ? valid : clientSpans,
        source: valid.length > 0 ? "DB" as const : "client" as const,
      };
    }
    return { effectiveSpans: clientSpans, source: "client" as const };
  }, [hasStoredSpans, message.piiSpans, message.content.length, clientSpans]);

  const effectiveSpansTypes = effectiveSpans.map((s) => s.type).join(",");
  useEffect(() => {
    if (effectiveSpans.length === 0) return;
    const types = [...new Set(effectiveSpans.map((s) => s.type))].join(", ");
    console.log(
      `[PII] Message (${message.role}): blurring`,
      effectiveSpans.length,
      "span(s) from",
      source,
      "—",
      types,
    );
  }, [effectiveSpans, source, message.role, effectiveSpansTypes]);

  return (
    <div
      className={isUser ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}
    >
      <Card
        className={isUser ? "bg-primary text-primary-foreground" : ""}
      >
        <CardContent className="py-3">
          <PiiMaskedText content={message.content} spans={effectiveSpans} />
        </CardContent>
      </Card>
    </div>
  );
}
