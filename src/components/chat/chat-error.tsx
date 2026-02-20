"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ChatErrorProps = {
  isNotFound?: boolean;
};

export function ChatError({ isNotFound = false }: ChatErrorProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <p className="text-muted-foreground text-center">
            {isNotFound
              ? "This conversation does not exist or you don't have access to it."
              : "Failed to load conversation"}
          </p>
          {isNotFound && (
            <Button asChild>
              <Link href="/chat">Start a new conversation</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
