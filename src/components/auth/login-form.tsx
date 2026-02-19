"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSafeCallbackUrl, AUTH_ROUTES } from "@/lib/auth-routes";
import { logger } from "@/lib/logger";
import {
  type LoginFormData,
  loginSchema,
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const registered = searchParams.get("registered") === "true";
  const passwordReset = searchParams.get("reset") === "success";
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        logger.warn("Login failed", { error: result.error });
        setError(result.error);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      logger.error("Login failed", err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {registered && (
            <Alert>
              <AlertDescription>
                Account created successfully. Please sign in.
              </AlertDescription>
            </Alert>
          )}
          {passwordReset && (
            <Alert>
              <AlertDescription>
                Password reset successfully. Please sign in with your new
                password.
              </AlertDescription>
            </Alert>
          )}
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
              id="login-email"
            />
            <FormInputField
              control={control}
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              id="login-password"
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <div className="space-y-2 text-center text-sm">
            <Link
              href={AUTH_ROUTES.forgotPassword}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
