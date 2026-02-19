"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { requestPasswordReset } from "@/actions/password-reset";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { logger } from "@/lib/logger";
import {
  type ForgotPasswordFormData,
  forgotPasswordSchema,
} from "@/lib/validations/auth";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { FieldGroup } from "../ui/field";
import { FormInputField } from "../ui/form-input-field";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null);
    try {
      const result = await requestPasswordReset(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      logger.error("Password reset request failed", err);
      setError("Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for that email, you will find a password reset
            link in your inbox. For development, the link has been logged to the
            server console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href={AUTH_ROUTES.signIn}>Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup className="gap-4">
            <FormInputField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="demo@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              id="forgot-password-email"
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={AUTH_ROUTES.signIn}
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
