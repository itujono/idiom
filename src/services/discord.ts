import { WebhookClient } from "discord.js";
import type { Idiom } from "../types";

export class DiscordService {
  private webhook: WebhookClient;
  private readonly MAX_MESSAGE_LENGTH = 1900; // Leave some room for safety

  constructor(webhookUrl: string) {
    this.webhook = new WebhookClient({ url: webhookUrl });
  }

  async sendIdioms(idioms: Idiom[]): Promise<void> {
    const messages = this.formatIdiomsMessages(idioms);

    try {
      for (const message of messages) {
        await this.webhook.send({
          content: message,
          username: "Daily Idioms Bot",
        });
      }
    } catch (error) {
      console.error("Failed to send idioms to Discord:", error);
      throw error;
    }
  }

  private formatIdiomsMessages(idioms: Idiom[]): string[] {
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const messages: string[] = [];
    let currentMessage = `📚 **Daily Idioms for ${date}**\n\n`;

    idioms.forEach((idiom, index) => {
      const idiomMessage = this.formatSingleIdiom(idiom, index + 1);

      // If adding this idiom would exceed the limit, start a new message
      if (
        currentMessage.length + idiomMessage.length >
        this.MAX_MESSAGE_LENGTH
      ) {
        messages.push(currentMessage);
        currentMessage = idiomMessage;
      } else {
        currentMessage += idiomMessage;
      }
    });

    // Add any remaining content
    if (currentMessage) {
      messages.push(currentMessage);
    }

    return messages;
  }

  private formatSingleIdiom(idiom: Idiom, index: number): string {
    let message = `${index}. **${idiom.phrase}**\n`;
    message += `💡 ${idiom.meaning}\n\n`;

    idiom.examples.forEach((example, exIndex) => {
      message += `📝 Example ${exIndex + 1}:\n`;
      message += `🇬🇧 ${example.english}\n`;
      message += `🇮🇩 ${example.indonesian}\n\n`;
    });

    return message;
  }
}
