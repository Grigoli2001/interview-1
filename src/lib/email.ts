import { logger } from "./logger";

/**
 * Sends a password reset email. For now, only logs the reset URL to the console.
 * Replace with actual email sending (e.g. Resend, SendGrid) when ready.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  logger.info("Password reset email (dev mode - not actually sent)", {
    to,
    resetUrl,
  });
}
