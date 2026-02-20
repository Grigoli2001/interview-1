import { Card, CardContent } from "@/components/ui/card";

export function ChatError() {
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
