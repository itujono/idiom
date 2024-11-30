import { WebhookClient } from "discord.js";
import { discordLogger as logger, metrics } from "../logger";

export abstract class BaseDiscordService {
  protected webhook: WebhookClient;

  constructor(webhookUrl: string, protected serviceName: string) {
    this.webhook = new WebhookClient({ url: webhookUrl });
    logger.info(`${serviceName} Discord service initialized`);
  }

  protected async sendMessage(
    content: string,
    username: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(
        { contentLength: content.length },
        `Sending ${this.serviceName.toLowerCase()} message`
      );

      await this.webhook.send({
        content,
        username,
        allowedMentions: { parse: [] }, // Disable all mentions
      });

      metrics.incrementMessagesSent();

      const duration = Date.now() - startTime;
      logger.info(
        { duration: `${duration}ms` },
        `Successfully sent ${this.serviceName.toLowerCase()} message`
      );
      metrics.recordDeliveryTime();
    } catch (error) {
      metrics.incrementErrors();

      // Log the full error details
      logger.error(
        {
          error,
          contentLength: content.length,
          content: content.slice(0, 100) + "...", // Log just the start of the content
          errorName: (error as Error).name,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
        },
        `Failed to send ${this.serviceName.toLowerCase()} message to Discord`
      );

      throw error;
    }
  }

  protected getFormattedDate(): string {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  protected getRandomTitle(titles: string[]): string {
    const randomIndex = Math.floor(Math.random() * titles.length);
    return `**${titles[randomIndex]} ${this.getFormattedDate()}**\n\n`;
  }
}
