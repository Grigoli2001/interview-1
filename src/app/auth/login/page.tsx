import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Meeting Notes Extractor</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to extract action items from your meeting notes
          </p>
        </div>
        <Suspense fallback={<div className="h-[300px] animate-pulse rounded-lg bg-muted" />}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
