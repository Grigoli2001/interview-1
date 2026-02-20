import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PiiMaskedText } from "./pii-masked-text";
import type { PiiSpan } from "@/lib/pii/types";

type ChatStreamingMessageProps = {
  content: string;
  piiSpans?: PiiSpan[];
};

export function ChatStreamingMessage({
  content,
  piiSpans = [],
}: ChatStreamingMessageProps) {
  return (
    <div className="mr-auto max-w-[80%]">
      <Card>
        <CardContent className="py-3">
          {content ? (
            <PiiMaskedText content={content} spans={piiSpans} />
          ) : (
            <div className="flex w-48 flex-col gap-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
