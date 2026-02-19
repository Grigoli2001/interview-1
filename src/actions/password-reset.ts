"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/auth";
import { AUTH_ROUTES } from "@/lib/auth-routes";
import { env } from "@/env";

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 1;

function getBaseUrl(): string {
  return env.NEXTAUTH_URL;
}

export type RequestPasswordResetResult =
  | { success: true }
  | { success: false; error: string };

export async function requestPasswordReset(
  data: ForgotPasswordFormData
): Promise<RequestPasswordResetResult> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors.email?.[0];
    return { success: false, error: firstError ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return { success: true };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${getBaseUrl()}${AUTH_ROUTES.resetPassword}?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    logger.info("Password reset requested", { email });
    return { success: true };
  } catch (err) {
    logger.error("Password reset request failed", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function resetPassword(
  token: string,
  data: ResetPasswordFormData
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    const firstError =
      parsed.error.flatten().fieldErrors.password?.[0] ??
      parsed.error.flatten().fieldErrors.confirmPassword?.[0] ??
      "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    logger.info("Password reset completed", { email: resetToken.user.email });
  } catch (err) {
    logger.error("Password reset failed", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }

  redirect(`${AUTH_ROUTES.signIn}?reset=success`);
}
