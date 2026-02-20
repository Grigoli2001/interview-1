"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
}: ChatInputProps) {
  return (
    <div className="border-t p-4">
      <form
        className="mx-auto flex max-w-2xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[44px] resize-none"
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
