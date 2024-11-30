import { WebhookClient } from "discord.js";
import type { Idiom } from "../types";
import { discordLogger as logger, metrics } from "./logger";

export class DiscordService {
  private webhook: WebhookClient;
  private readonly MAX_MESSAGE_LENGTH = 1900; // Leave some room for safety
  private readonly TITLES = [
    "🎯 Yo yo! Here's your idiom dose for",
    "🌟 Hot off the press! New set of idioms for",
    "📚 Time to level up your English! Daily idioms for",
    "💫 Fresh batch of idioms coming through for",
    "🎨 Spice up your English with these idioms for",
    "🚀 Your daily idioms adventure begins for",
    "✨ Ready for some cool idioms? Here's today's pick for",
    "🌈 New day, new idioms! Here's your set for",
    "🎪 Step right up! Get your daily idioms for",
    "🎭 Today's featured idioms performance for",
    "🌺 Freshly picked idioms just for you on",
    "🎪 Roll up, roll up! Today's idiom show for",
    "🎨 Painting your day with idioms for",
    "🎯 Bulls-eye! Your targeted idioms for",
    "🌟 Stellar idioms coming your way for",
  ];

  constructor(webhookUrl: string) {
    this.webhook = new WebhookClient({ url: webhookUrl });
    logger.info("Discord service initialized");
  }

  async sendIdioms(idioms: Idiom[]): Promise<void> {
    const startTime = Date.now();
    logger.info({ count: idioms.length }, "Preparing to send idioms");

    const messages = this.formatIdiomsMessages(idioms);

    try {
      for (const message of messages) {
        await this.webhook.send({
          content: message,
          username: "Daily Idioms Bot",
        });
        metrics.incrementMessagesSent();
      }

      metrics.incrementIdiomsSent(idioms.length);
      const duration = Date.now() - startTime;
      logger.info(
        { duration: `${duration}ms`, count: idioms.length },
        "Successfully sent idioms"
      );
      metrics.recordDeliveryTime();
    } catch (error) {
      metrics.incrementErrors();
      logger.error({ error }, "Failed to send idioms to Discord");
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

    const randomTitle =
      this.TITLES[Math.floor(Math.random() * this.TITLES.length)];
    const messages: string[] = [];
    let currentMessage = `**${randomTitle} ${date}**\n\n`;

    idioms.forEach((idiom, index) => {
      const idiomMessage = this.formatSingleIdiom(idiom, index + 1);

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

    if (currentMessage) {
      messages.push(currentMessage);
    }

    logger.debug(
      { messageCount: messages.length },
      "Formatted messages for delivery"
    );
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
