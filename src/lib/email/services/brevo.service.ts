import { BrevoClient } from "@getbrevo/brevo";
import type { EmailSender, SendEmailPayload, SendEmailResult } from "../types";
import { emailConfig } from "../config";

export function createBrevoSender(): EmailSender {
  const apiKey = emailConfig.brevoApiKey;
  if (!apiKey?.trim()) {
    throw new Error("BREVO_API_KEY is required for Brevo email service");
  }

  const client = new BrevoClient({ apiKey });

  return {
    async send(payload: SendEmailPayload): Promise<SendEmailResult> {
      try {
        await client.transactionalEmails.sendTransacEmail({
          subject: payload.subject,
          htmlContent: payload.htmlContent,
          textContent: payload.textContent ?? stripHtml(payload.htmlContent),
          sender: {
            name: emailConfig.fromName,
            email: emailConfig.fromEmail,
          },
          to: [{ email: payload.to }],
        });

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send email";
        return { success: false, error: message };
      }
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
