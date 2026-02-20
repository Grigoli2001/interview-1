"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type ChatSendErrorProps = {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  isRetrying?: boolean;
};

export function ChatSendError({
  message,
  onRetry,
  onDismiss,
  isRetrying = false,
}: ChatSendErrorProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Failed to send message
            </p>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            disabled={isRetrying}
          >
            Dismiss
          </Button>
          <Button size="sm" onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? "Retrying…" : "Retry"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
