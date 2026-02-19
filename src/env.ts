import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
    NEXTAUTH_URL: z
      .string()
      .url()
      .optional()
      .default("http://localhost:3000"),

    // Brevo (transactional email)
    BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
    EMAIL_FROM_NAME: z.string().optional(),
    EMAIL_FROM_EMAIL: z.string().email().min(1, "EMAIL_FROM_EMAIL is required"),
    CONTACT_EMAIL: z.string().email().min(1, "CONTACT_EMAIL is required"),

    // Anthropic (if used elsewhere)
    ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  },
  client: {
    NEXT_PUBLIC_LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error", "none"])
      .optional()
      .default("info"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_FROM_EMAIL: process.env.EMAIL_FROM_EMAIL,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  },
});
