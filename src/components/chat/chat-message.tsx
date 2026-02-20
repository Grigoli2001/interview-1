import { Card, CardContent } from "@/components/ui/card";
import type { Message } from "./types";

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={isUser ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}
    >
      <Card
        className={isUser ? "bg-primary text-primary-foreground" : ""}
      >
        <CardContent className="py-3">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </CardContent>
      </Card>
    </div>
  );
}
