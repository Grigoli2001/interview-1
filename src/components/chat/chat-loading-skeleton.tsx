import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-3/4" />
    </div>
  );
}
