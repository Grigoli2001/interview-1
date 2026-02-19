"use client";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const session = useSession();
  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Extract Action Items</h1>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>

        <Link href="/test" className="text-sm text-muted-foreground">Test</Link>

        {/* display user info */}
        <div className="text-sm text-muted-foreground">
          <p>Name: {JSON.stringify(session.data)}</p>
        </div>
      </div>
    </>
  );
}
