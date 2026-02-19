"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";

const BCRYPT_ROUNDS = 12;

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function register(data: RegisterFormData): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.flatten().fieldErrors;
    const message =
      firstError.email?.[0] ??
      firstError.password?.[0] ??
      firstError.confirmPassword?.[0] ??
      firstError.name?.[0] ??
      "Invalid input";
    return { success: false, error: message };
  }

  const { email, password, name } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const trimmedName = name?.trim() || null;

    await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: trimmedName,
      },
    });

    logger.info("User registered", { email: email.toLowerCase() });
    return { success: true };
  } catch (err) {
    logger.error("Registration failed", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
