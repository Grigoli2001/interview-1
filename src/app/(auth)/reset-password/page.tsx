import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { Button } from "@/components/ui/button";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Invalid reset link</h1>
            <p className="text-muted-foreground text-sm">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>
          <Button asChild>
            <Link href={AUTH_ROUTES.forgotPassword}>Request new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Meeting Notes Extractor</h1>
          <p className="text-muted-foreground text-sm">
            Set your new password
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
          }
        >
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    </div>
  );
}
