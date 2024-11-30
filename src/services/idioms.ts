import type { Idiom } from "../types";
import { appLogger as logger } from "./logger";
import { OpenAIService } from "./openai";

export class IdiomsService {
  constructor(
    private fallbackIdioms: Idiom[],
    private openAIService: OpenAIService
  ) {}

  async getRandomIdioms(count: number = 2): Promise<Idiom[]> {
    const idioms: Idiom[] = [];
    const errors: Error[] = [];

    // Generate random idioms
    for (let i = 0; i < count; i++) {
      try {
        // Generate a random idiom
        logger.info("Generating random idiom");
        const idiom = await this.openAIService.generateRandomIdiom();
        logger.info({ idiom }, "Generated random idiom");

        // Generate examples for the idiom
        logger.info({ idiom: idiom.phrase }, "Generating examples");
        const examples = await this.openAIService.generateIdiomExamples(
          idiom.phrase,
          idiom.meaning
        );
        logger.info({ idiom: idiom.phrase, examples }, "Generated examples");

        idioms.push({
          ...idiom,
          examples,
        });
      } catch (error) {
        logger.warn({ error }, "Failed to generate idiom");
        errors.push(error as Error);
      }
    }

    // If we couldn't get enough idioms, use fallbacks
    if (idioms.length < count) {
      logger.warn(
        { errors, generatedCount: idioms.length, requestedCount: count },
        "Failed to generate some idioms, falling back to predefined ones"
      );

      const remainingCount = count - idioms.length;
      const shuffledFallbacks = [...this.fallbackIdioms].sort(
        () => 0.5 - Math.random()
      );

      // Ensure we don't duplicate any idioms
      const fallbackIdioms = shuffledFallbacks
        .filter((fallback) => !idioms.some((i) => i.phrase === fallback.phrase))
        .slice(0, remainingCount);

      logger.info(
        { fallbackCount: fallbackIdioms.length },
        "Adding fallback idioms"
      );

      idioms.push(...fallbackIdioms);
    }

    return idioms;
  }
}
