"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { registerUser } from "@/actions/auth";
import { AUTH_ROUTES, getSafeCallbackUrl } from "@/lib/auth-routes";
import { logger } from "@/lib/logger";
import {
  type RegisterFormData,
  registerSchema,
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
import { PasswordStrengthIndicator } from "../ui/password-strength-indicator";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setError(null);
    try {
      const result = await registerUser(data);

      if (!result.success) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        logger.warn("Auto sign-in after registration failed", {
          error: signInResult.error,
        });
        setError("Account created but sign-in failed. Please sign in manually.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      logger.error("Registration failed", err);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details to create your account
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
              name="name"
              label="Name (optional)"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              disabled={isSubmitting}
              id="register-name"
            />
            <FormInputField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="demo@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              id="register-email"
            />
            <FormInputField
              control={control}
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              id="register-password"
              renderAfterInput={(value) => (
                <PasswordStrengthIndicator password={value} />
              )}
            />
            <FormInputField
              control={control}
              name="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              id="register-confirmPassword"
            />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={AUTH_ROUTES.signIn}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
