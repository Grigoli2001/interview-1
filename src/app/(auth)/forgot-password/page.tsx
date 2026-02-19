import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Meeting Notes Extractor</h1>
          <p className="text-muted-foreground text-sm">
            Reset your password
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
          }
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
