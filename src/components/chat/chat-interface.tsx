"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation, useInvalidateConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Message = { id?: string; role: "user" | "assistant"; content: string };

/**
 * Anthropic SDK's toReadableStream() produces newline-separated JSON (NDJSON),
 * not SSE. Each line is a full event object.
 */
function parseStreamLine(line: string): { type?: string; delta?: { type?: string; text?: string } } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as { type?: string; delta?: { type?: string; text?: string } };
    return parsed;
  } catch {
    return null;
  }
}

async function* readStreamLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      yield line;
    }
  }
  if (buffer) yield buffer;
}

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
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-3/4" />
      </div>
    );
  }

  if (effectiveConversationId && error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Failed to load conversation
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground">
              Start a new conversation by typing a message below.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id ?? m.content.slice(0, 20)}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[80%]"
                    : "mr-auto max-w-[80%]"
                }
              >
                <Card
                  className={
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  <CardContent className="py-3">
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {streamingContent && (
              <div className="mr-auto max-w-[80%]">
                <Card>
                  <CardContent className="py-3">
                    <p className="whitespace-pre-wrap text-sm">
                      {streamingContent}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <form
          className="mx-auto flex max-w-2xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[44px] resize-none"
            rows={1}
            disabled={isStreaming}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
