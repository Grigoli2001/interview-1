"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { resetPassword } from "@/actions/password-reset";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { logger } from "@/lib/logger";
import {
  type ResetPasswordFormData,
  resetPasswordSchema,
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

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setError(null);
    try {
      const result = await resetPassword(token, data);

      if (!result.success) {
        setError(result.error);
        return;
      }
      // Success: redirect() is called from the server action
    } catch (err) {
      logger.error("Password reset failed", err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Enter your new password below
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
              name="password"
              label="New password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              id="reset-password-password"
            />
            <FormInputField
              control={control}
              name="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              id="reset-password-confirmPassword"
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset password"}
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
