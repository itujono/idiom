import type { Idiom } from "../../types";
import { BaseDiscordService } from "./base";
import { appLogger as logger } from "../logger";

export class IdiomsDiscordService extends BaseDiscordService {
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

  private readonly MAX_MESSAGE_LENGTH = 1800;

  constructor(webhookUrl: string) {
    super(webhookUrl, "Idioms");
  }

  async sendIdioms(idioms: Idiom[]): Promise<void> {
    const messages = this.formatIdiomsMessages(idioms);
    logger.info({ messageCount: messages.length }, "Sending idioms messages");

    for (const [index, message] of messages.entries()) {
      const prefix =
        messages.length > 1 ? `Part ${index + 1}/${messages.length}\n\n` : "";
      await this.sendMessage(prefix + message, "Daily Idioms");
    }
  }

  private formatIdiomsMessages(idioms: Idiom[]): string[] {
    const messages: string[] = [];
    let currentMessage = this.getRandomTitle(this.TITLES);
    let currentIdiomIndex = 0;

    while (currentIdiomIndex < idioms.length) {
      const idiom = idioms[currentIdiomIndex];
      const idiomContent = this.formatSingleIdiom(idiom, currentIdiomIndex + 1);
      const isExceedingLimit =
        currentMessage.length + idiomContent.length > this.MAX_MESSAGE_LENGTH;

      if (isExceedingLimit) {
        messages.push(currentMessage);
        currentMessage = "";
      }

      currentMessage += idiomContent;
      currentIdiomIndex++;
    }

    // Add the last message if it's not empty
    if (currentMessage) {
      messages.push(currentMessage);
    }

    return messages;
  }

  private formatSingleIdiom(idiom: Idiom, index: number): string {
    let content = `${index}. **${idiom.phrase}**\n`;
    content += `💡 ${idiom.meaning}\n\n`;

    if (idiom.examples) {
      content += `📝 Example:\n${idiom.examples}\n\n`;
    }

    return content;
  }

  async testWebhook(): Promise<void> {
    await this.sendMessage(
      "Test message from Daily Idioms",
      "Daily Idioms Test"
    );
  }
}
