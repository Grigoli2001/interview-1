import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ChatStreamingMessageProps = {
  content: string;
};

export function ChatStreamingMessage({ content }: ChatStreamingMessageProps) {
  return (
    <div className="mr-auto max-w-[80%]">
      <Card>
        <CardContent className="py-3">
          {content ? (
            <p className="whitespace-pre-wrap text-sm">{content}</p>
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
