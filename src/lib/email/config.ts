import { env } from "@/env";

/**
 * Email configuration from validated environment variables.
 * All email-related env vars are centralized here.
 */
export const emailConfig = {
  /** Brevo API key (required) */
  brevoApiKey: env.BREVO_API_KEY,

  /** Sender display name (e.g. "Meeting Notes Extractor") */
  fromName: env.EMAIL_FROM_NAME ?? "Meeting Notes Extractor",

  /**
   * Sender email address. Must be a verified sender in Brevo.
   * Falls back to CONTACT_EMAIL when EMAIL_FROM_EMAIL is not set.
   */
  fromEmail:
    env.EMAIL_FROM_EMAIL ?? env.CONTACT_EMAIL ?? "noreply@example.com",
} as const;
