/**
 * Password reset email template.
 * Returns both HTML and plain text versions.
 */
export function getPasswordResetEmailContent(resetUrl: string): {
  subject: string;
  htmlContent: string;
  textContent: string;
} {
  const subject = "Reset your password";
  const textContent = `You requested a password reset. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Reset your password</h1>
  <p>You requested a password reset. Click the button below to set a new password:</p>
  <p style="margin: 1.5rem 0;">
    <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset password</a>
  </p>
  <p style="color: #666; font-size: 0.875rem;">Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; font-size: 0.875rem;">${resetUrl}</p>
  <p style="color: #666; font-size: 0.875rem; margin-top: 1.5rem;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
</body>
</html>
`.trim();

  return { subject, htmlContent, textContent };
}
