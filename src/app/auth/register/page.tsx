import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { AUTH_ROUTES } from "@/lib/auth";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Meeting Notes Extractor</h1>
          <p className="text-muted-foreground text-sm">
            Create an account to extract action items from your meeting notes
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
          }
        >
          <RegisterForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={AUTH_ROUTES.signIn}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
