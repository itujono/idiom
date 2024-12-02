import type { Phrase } from '../../types';
import { BaseDiscordService } from './base';

export class PhrasesDiscordService extends BaseDiscordService {
  private readonly TITLES = [
    '💭 Your daily Indonesian expression for',
    "🗣️ Today's phrase from Indonesia for",
    '🌟 Learn to speak like a local! Phrase for',
    '💫 Fresh Indonesian expression coming up for',
    "🎯 Today's must-know Indonesian phrase for",
    '✨ Level up your Indonesian! Daily phrase for',
    '🌈 Colorful Indonesian expressions for',
    '📝 Your Indonesian language moment for',
    '🎭 Express yourself in Indonesian for',
    '🌺 Beautiful Indonesian phrase of the day for',
    '💡 Spark your Indonesian vocabulary for',
    '🎪 Roll up! Indonesian phrase showcase for',
    '🚀 Boost your Indonesian skills for',
    '🎨 Paint your thoughts in Indonesian for',
    '🌟 Star Indonesian phrase of the day for',
  ];

  constructor(webhookUrl: string) {
    super(webhookUrl, 'Phrases');
  }

  async sendPhrases(phrases: Phrase[]): Promise<void> {
    const message = this.formatPhrasesMessage(phrases);
    await this.sendMessage(message, 'How to Say This?');
  }

  private formatPhrasesMessage(phrases: Phrase[]): string {
    let message = this.getRandomTitle(this.TITLES);

    phrases.forEach((phrase, index) => {
      message += `${index + 1}. **${phrase.indonesian}**: ${phrase.english}\n\n`;

      if (phrase.examples) {
        message += `   📝 Examples:\n`;
        message += `   ${phrase.examples}\n`;
      }

      if (phrase.alt_phrases) {
        message += `\n   💫 Alternative phrases:\n`;
        message += `   🇮🇩 ${phrase.alt_phrases}\n`;
      }
      message += '\n';
    });

    return message;
  }
}
