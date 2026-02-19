/**
 * Email module - public API for sending transactional emails.
 *
 * Structure:
 * - config.ts       - Environment-based configuration
 * - types.ts        - Shared types and interfaces
 * - client.ts       - sendEmail helper
 * - services/       - Provider implementations (Brevo)
 * - templates/      - Email content templates
 */

import { sendEmail } from "./client";
import { getPasswordResetEmailContent } from "./templates/password-reset";

export { emailConfig } from "./config";
export type { EmailSender, SendEmailPayload, SendEmailResult } from "./types";

/**
 * Sends a password reset email to the given address via Brevo.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const { subject, htmlContent, textContent } =
    getPasswordResetEmailContent(resetUrl);

  const result = await sendEmail(to, subject, htmlContent, textContent);

  if (!result.success) {
    throw new Error(result.error);
  }
}
