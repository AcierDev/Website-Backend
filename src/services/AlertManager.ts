import nodemailer from "nodemailer";
import { config } from "../config/config";
import { LoggerService } from "./LoggerService";

export class AlertManager {
  private static logger = LoggerService.getInstance();

  private static transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: true,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });

  private static readonly carriers = {
    verizon: "vtext.com",
    att: "txt.att.net",
    tmobile: "tmomail.net",
    sprint: "messaging.sprintpcs.com",
  } as const;

  private static readonly recipientMap = {
    Ben: ["9172005099"],
    "Ben & Akiva": ["9172005099", "9293277420"],
    "Ben & Akiva & Dovi": ["9172005099", "9293277420", "2038195430"],
    "Ben & Akiva & Alex": ["9172005099", "9293277420", "7755137691"],
    Everyone: ["9172005099", "9293277420", "7755137691", "7023244384"],
  };

  static async sendText(
    to: keyof typeof AlertManager.recipientMap,
    type: "New Message" | "Error",
    message: string
  ): Promise<void> {
    const recipients = this.getRecipients(to);
    const RECIPIENT_CARRIER = "tmobile";

    this.logger.info("Sending text to:", recipients);

    try {
      await Promise.all(
        recipients.map((recipient) =>
          this.sendSingleText(recipient, type, message, RECIPIENT_CARRIER)
        )
      );
    } catch (error) {
      this.logger.error("Failed to send texts:", error as Error);
      throw error;
    }
  }

  private static async sendSingleText(
    recipient: string,
    type: string,
    message: string,
    carrier: keyof typeof AlertManager.carriers
  ): Promise<void> {
    const mailOptions = {
      from: config.email.user,
      to: `${recipient}@${this.carriers[carrier]}`,
      subject: "Everwood Backend Server " + type,
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.info(`Text message sent to ${recipient}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send text to ${recipient}:`, error as Error);
      throw error;
    }
  }

  private static getRecipients(
    to: keyof typeof AlertManager.recipientMap
  ): string[] {
    return this.recipientMap[to] || [];
  }
}
