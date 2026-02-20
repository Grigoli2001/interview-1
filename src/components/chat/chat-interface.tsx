"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation, useInvalidateConversations } from "@/hooks/use-conversations";
import { parseStreamLine, readStreamLines } from "./utils";
import type { Message } from "./types";
import { ChatMessage } from "./chat-message";
import { ChatStreamingMessage } from "./chat-streaming-message";
import { ChatInput } from "./chat-input";
import { ChatEmpty } from "./chat-empty";
import { ChatError } from "./chat-error";
import { ChatLoadingSkeleton } from "./chat-loading-skeleton";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.messages) {
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      );
    } else if (!effectiveConversationId) {
      setMessages([]);
      setInternalConversationId(null);
    }
  }, [data?.messages, effectiveConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setStreamingContent("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          conversationId: effectiveConversationId ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send message");
      }

      const conversationIdFromHeader = res.headers.get("X-Conversation-Id");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      let fullText = "";

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

      setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
      setStreamingContent("");
      invalidateConversations();

      if (conversationIdFromHeader && !effectiveConversationId) {
        setInternalConversationId(conversationIdFromHeader);
        window.history.replaceState(null, "", `/chat/${conversationIdFromHeader}`);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [
    input,
    isStreaming,
    effectiveConversationId,
    invalidateConversations,
  ]);

  if (effectiveConversationId && isPending && messages.length === 0) {
    return <ChatLoadingSkeleton />;
  }

  if (effectiveConversationId && error) {
    return <ChatError />;
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
              <ChatStreamingMessage content={streamingContent} />
            )}
            <div ref={messagesEndRef} />
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
