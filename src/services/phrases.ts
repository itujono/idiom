import { appLogger as logger } from "./logger";
import { OpenAIService } from "./openai";
import type { Phrase } from "../types";

export class PhrasesService {
  constructor(
    private openAIService: OpenAIService,
    private fallbackPhrases: Phrase[] = []
  ) {}

  async getPhrases(count: number = 3): Promise<Phrase[]> {
    const phrases: Phrase[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const phrase = await this.openAIService.generatePhrase();
        phrases.push(phrase);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (phrases.length === count) {
      return phrases;
    }

    logger.warn(
      { errors },
      "Failed to generate some phrases, falling back to predefined phrases"
    );

    if (this.fallbackPhrases.length === 0) {
      throw new Error("No fallback phrases available");
    }

    // Fill remaining slots with random fallback phrases
    while (phrases.length < count) {
      const availablePhrases = this.fallbackPhrases.filter(
        (fallback) => !phrases.some((p) => p.indonesian === fallback.indonesian)
      );

      if (availablePhrases.length === 0) {
        break; // No more unique phrases available
      }

      const randomIndex = Math.floor(Math.random() * availablePhrases.length);
      phrases.push(availablePhrases[randomIndex]);
    }

    return phrases;
  }
}
