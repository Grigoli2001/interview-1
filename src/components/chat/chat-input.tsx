"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DEFAULT_MAX_LENGTH = 4000;

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  maxLength?: number;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  maxLength = DEFAULT_MAX_LENGTH,
}: ChatInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (next.length <= maxLength) {
      onChange(next);
    }
  };

  return (
    <div className="border-t p-4">
      <form
        className="mx-auto flex max-w-2xl flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <div className="flex gap-2">
          <Textarea
            value={value}
            onChange={handleChange}
            placeholder="Type your message..."
            className={cn("min-h-[44px] max-h-[200px] resize-none overflow-y-auto")}
            rows={1}
            maxLength={maxLength}
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
        </div>
        <p className="text-muted-foreground text-right text-xs">
          {value.length} / {maxLength}
        </p>
      </form>
    </div>
  );
}
