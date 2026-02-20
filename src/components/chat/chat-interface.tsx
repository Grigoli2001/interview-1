"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation, useInvalidateConversations } from "@/hooks/use-conversations";
import { detectPiiClient } from "@/lib/pii/client-detect";
import { parseStreamLine, readStreamLines } from "./utils";
import type { Message } from "./types";
import { ChatMessage } from "./chat-message";
import { ChatStreamingMessage } from "./chat-streaming-message";
import { ChatInput } from "./chat-input";
import { ChatEmpty } from "./chat-empty";
import { ChatError } from "./chat-error";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";
import { ChatSendError } from "./chat-send-error";

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function ChatInterface({
  conversationId: conversationIdProp,
}: {
  conversationId?: string;
}) {
  const invalidateConversations = useInvalidateConversations();
  const [internalConversationId, setInternalConversationId] = useState<string | null>(null);
  const effectiveConversationId = conversationIdProp ?? internalConversationId;
  const { data, isPending, error } = useConversation(effectiveConversationId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sendError, setSendError] = useState<{
    message: string;
    userContent: string;
    conversationId: string | null;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingPiiSpans = useMemo(
    () => detectPiiClient(streamingContent),
    [streamingContent],
  );

  useEffect(() => {
    if (streamingPiiSpans.length > 0) {
      const types = [...new Set(streamingPiiSpans.map((s) => s.type))].join(", ");
      console.log(
        "[PII] Streaming: blurring",
        streamingPiiSpans.length,
        "span(s) —",
        types,
      );
    }
  }, [streamingPiiSpans]);

  useEffect(() => {
    if (data?.messages) {
      setMessages((prev) => {
        const fromApi: Message[] = data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          piiSpans: m.piiSpans,
        }));
        const merged: Message[] = [...fromApi];
        for (const m of prev) {
          if (!m.id && m.role === "assistant") {
            const inApi = fromApi.some(
              (d) =>
                d.role === "assistant" &&
                d.content === m.content &&
                d.content.length > 0,
            );
            if (!inApi) merged.push(m);
          }
        }
        return merged;
      });
    } else if (!effectiveConversationId) {
      setMessages([]);
      setInternalConversationId(null);
    }
  }, [data?.messages, effectiveConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const performSend = useCallback(
    async (
      payload: {
        messages?: Array<{ role: "user"; content: string }>;
        conversationId?: string;
        retry?: boolean;
      },
      options: { isRetry?: boolean } = {},
    ): Promise<string | null> => {
      const { isRetry = false } = options;
      if (isRetry) setIsRetrying(true);
      setSendError(null);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const conversationIdFromHeader = res.headers.get("X-Conversation-Id");

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const errMsg =
          errBody.error ?? (res.status >= 500 ? "Server error. Please try again." : "Failed to send message");
        const err = new Error(errMsg) as Error & { conversationId?: string | null };
        err.conversationId = conversationIdFromHeader;
        throw err;
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullText = "";
      try {
        for await (const line of readStreamLines(reader)) {
          const parsed = parseStreamLine(line);
          if (
            parsed?.type === "content_block_delta" &&
            parsed.delta?.type === "text_delta" &&
            parsed.delta.text
          ) {
            fullText += parsed.delta.text;
            setStreamingContent(fullText);
          }
        }
      } catch (streamErr) {
        const msg =
          streamErr instanceof Error ? streamErr.message : "Stream failed";
        const isOverloaded = /overloaded|rate.?limit/i.test(msg);
        const err = new Error(
          isOverloaded
            ? "Service is busy. Please try again in a moment."
            : msg,
        ) as Error & { conversationId?: string | null };
        err.conversationId = conversationIdFromHeader;
        throw err;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      setStreamingContent("");
      invalidateConversations();

      // PII model runs async after stream; refetch after delay to pick up model spans
      setTimeout(() => invalidateConversations(), 2500);

      if (conversationIdFromHeader && !effectiveConversationId) {
        setInternalConversationId(conversationIdFromHeader);
        window.history.replaceState(null, "", `/chat/${conversationIdFromHeader}`);
      }

      return conversationIdFromHeader ?? effectiveConversationId;
    },
    [effectiveConversationId, invalidateConversations],
  );

  const sendMessage = useCallback(
    async (opts?: {
      userContent?: string;
      autoRetryCount?: number;
      conversationIdForRetry?: string | null;
    }) => {
      const text = (opts?.userContent ?? input.trim()).trim();
      if (!text || isStreaming) return;

      const autoRetryCount = opts?.autoRetryCount ?? 0;
      const isRetry =
        autoRetryCount > 0 || (opts?.userContent != null && opts?.conversationIdForRetry != null);
      const conversationId =
        opts?.conversationIdForRetry ?? effectiveConversationId ?? null;

      if (!isRetry) {
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: text }]);
      }
      setStreamingContent("");
      setIsStreaming(true);
      setSendError(null);

      try {
        const payload: {
          messages?: Array<{ role: "user"; content: string }>;
          conversationId?: string;
          retry?: boolean;
        } =
          isRetry && conversationId
            ? { conversationId, retry: true }
            : {
                messages: [{ role: "user" as const, content: text }],
                conversationId: conversationId ?? undefined,
              };

        await performSend(payload, { isRetry });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        const errWithMeta = err as Error & { conversationId?: string | null };
        const conversationIdFromError = errWithMeta.conversationId ?? conversationId;
        const isRetryable =
          /overloaded|rate.?limit|server error|network|failed to fetch|try again/i.test(
            message,
          );

        if (isRetryable && autoRetryCount < MAX_AUTO_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          if (conversationIdFromError) {
            setInternalConversationId(conversationIdFromError);
          }
          return sendMessage({
            userContent: text,
            autoRetryCount: autoRetryCount + 1,
            conversationIdForRetry: conversationIdFromError,
          });
        }

        setSendError({
          message,
          userContent: text,
          conversationId: conversationIdFromError,
        });
      } finally {
        setIsStreaming(false);
        setIsRetrying(false);
      }
    },
    [input, isStreaming, effectiveConversationId, performSend],
  );

  const handleRetry = useCallback(() => {
    if (!sendError) return;
    const { userContent, conversationId } = sendError;
    setSendError(null);
    if (conversationId) {
      setInternalConversationId(conversationId);
    }
    sendMessage({
      userContent,
      conversationIdForRetry: conversationId,
    });
  }, [sendError, sendMessage]);

  const handleDismissError = useCallback(() => setSendError(null), []);

  if (effectiveConversationId && isPending && messages.length === 0) {
    return <ChatLoadingSkeleton />;
  }

  if (effectiveConversationId && error) {
    const isNotFound =
      (error as { response?: { status?: number } })?.response?.status === 404;
    return <ChatError isNotFound={isNotFound} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingContent ? (
          <ChatEmpty />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <ChatMessage
                key={m.id ?? m.content.slice(0, 20)}
                message={m}
              />
            ))}
            {(isStreaming || streamingContent) && (
              <ChatStreamingMessage
                content={streamingContent}
                piiSpans={streamingPiiSpans}
              />
            )}
            <div ref={messagesEndRef} />
            {sendError && (
              <ChatSendError
                message={sendError.message}
                onRetry={handleRetry}
                onDismiss={handleDismissError}
                isRetrying={isRetrying}
              />
            )}
          </div>
        )}
      </div>
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </div>
  );
}
