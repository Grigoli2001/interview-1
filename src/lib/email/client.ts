import { createBrevoSender } from "./services/brevo.service";

const sender = createBrevoSender();

/**
 * Sends an email using Brevo.
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
) {
  return sender.send({
    to,
    subject,
    htmlContent,
    textContent,
  });
}
