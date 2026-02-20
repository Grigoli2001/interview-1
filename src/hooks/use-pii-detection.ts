"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { PiiSpan } from "@/lib/pii/types";

const DEBOUNCE_MS = 450;
const MIN_CONTENT_LENGTH = 10;

export function usePiiDetection(
  content: string,
  enabled: boolean,
): { spans: PiiSpan[] } {
  const [spans, setSpans] = useState<PiiSpan[]>([]);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || content.length < MIN_CONTENT_LENGTH) {
      setSpans([]);
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const { data } = await api.post<{ spans: PiiSpan[] }>(
          "/api/pii/detect",
          { text: content },
          { signal: abortControllerRef.current.signal },
        );

        if (currentRequestId === requestIdRef.current) {
          const clampedSpans = (data.spans ?? []).filter(
            (s) => s.end <= content.length && s.start >= 0,
          );
          setSpans(clampedSpans);
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.name !== "AbortError" &&
          err.name !== "CanceledError"
        ) {
          setSpans([]);
        }
      } finally {
        abortControllerRef.current = null;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [content, enabled]);

  return { spans };
}
