/** Payload for sending an email */
export interface SendEmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/** Result of sending an email */
export type SendEmailResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

/** Email sender service interface - implement for different providers */
export interface EmailSender {
  send(payload: SendEmailPayload): Promise<SendEmailResult>;
}
