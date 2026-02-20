"use client";

import { useCallback, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PiiSpan } from "@/lib/pii/types";
import { MarkdownRenderer } from "@/lib/markdown";

function spanId(span: PiiSpan): string {
  return `${span.start}-${span.end}`;
}

type PiiMaskedTextProps = {
  content: string;
  spans: PiiSpan[];
  className?: string;
  /** When true, render text segments as markdown. Default: true for assistant-style content */
  markdown?: boolean;
};

export function PiiMaskedText({
  content,
  spans,
  className,
  markdown = true,
}: PiiMaskedTextProps) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const toggleReveal = useCallback((id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (spans.length === 0) {
    if (markdown) {
      return (
        <MarkdownRenderer
          content={content}
          className={cn(className)}
          compact
        />
      );
    }
    return (
      <p className={cn("whitespace-pre-wrap text-sm", className)}>{content}</p>
    );
  }

  const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
  const segments: Array<
    | { type: "text"; start: number; end: number }
    | { type: "pii"; start: number; end: number; span: PiiSpan }
  > = [];

  let lastEnd = 0;
  for (const span of sortedSpans) {
    if (span.start > lastEnd) {
      segments.push({ type: "text", start: lastEnd, end: span.start });
    }
    segments.push({ type: "pii", start: span.start, end: span.end, span });
    lastEnd = Math.max(lastEnd, span.end);
  }
  if (lastEnd < content.length) {
    segments.push({ type: "text", start: lastEnd, end: content.length });
  }

  return (
    <TooltipProvider delayDuration={300}>
      <span className={cn("whitespace-pre-wrap text-sm", className)}>
        {segments.map((seg, i) => {
          const text = content.slice(seg.start, seg.end);
          if (seg.type === "text") {
            if (markdown && text) {
              return (
                <MarkdownRenderer
                  key={i}
                  content={text}
                  compact
                  inline
                />
              );
            }
            return <span key={i}>{text}</span>;
          }
          const id = spanId(seg.span);
          const isRevealed = revealed.has(id);

          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleReveal(id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleReveal(id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer select-none rounded px-0.5 transition-[filter]",
                    !isRevealed && "blur-xs hover:blur-[2px]",
                  )}
                  aria-label={isRevealed ? "Click to mask" : "Click to reveal"}
                >
                  {text}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isRevealed ? "Click to mask" : "Click to reveal"}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}
