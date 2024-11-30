import { appLogger as logger } from "./logger";
import { OpenAIService } from "./openai";
import type { Phrase } from "../types";
import { phrases as defaultPhrases } from "../data/phrases";

export class PhrasesService {
  private recentPhrases: Set<string> = new Set();
  private readonly CACHE_SIZE = 20; // Remember last 20 phrases

  constructor(
    private openAIService: OpenAIService,
    private fallbackPhrases: Phrase[] = []
  ) {}

  private addToRecentPhrases(phrase: string) {
    this.recentPhrases.add(phrase);
    if (this.recentPhrases.size > this.CACHE_SIZE) {
      // Remove the oldest phrase (first item in set)
      this.recentPhrases.delete(this.recentPhrases.values().next().value);
    }
  }

  private isRecentPhrase(phrase: string): boolean {
    return this.recentPhrases.has(phrase);
  }

  async getPhrases(count: number = 3): Promise<Phrase[]> {
    logger.info({ count }, "Starting phrase generation");

    const phrases: Phrase[] = [];
    const errors: Error[] = [];
    const maxRetries = 5; // Increased retries since we're being more selective

    for (let i = 0; i < count; i++) {
      let success = false;
      let retries = 0;

      logger.info(
        { phraseIndex: i, maxRetries },
        "Starting generation for phrase"
      );

      while (!success && retries < maxRetries) {
        try {
          logger.info(
            { phraseIndex: i, attempt: retries + 1, maxRetries },
            "Attempting to generate phrase"
          );

          const phrase = await this.openAIService.generatePhrase();
          logger.info({ phrase }, "Received phrase from OpenAI");

          // Check for duplicates in current batch
          const isDuplicate = phrases.some((p) =>
            this.areSimilarPhrases(p, phrase)
          );

          // Check if it's a recent phrase
          const isRecent = this.isRecentPhrase(phrase.indonesian.toLowerCase());

          logger.info(
            { isDuplicate, isRecent },
            "Checked for duplicates and recency"
          );

          if (!isDuplicate && !isRecent) {
            phrases.push(phrase);
            this.addToRecentPhrases(phrase.indonesian.toLowerCase());
            success = true;
            logger.info(
              { phraseIndex: i, phrase },
              "Successfully added unique phrase"
            );
          } else {
            logger.info(
              { phraseIndex: i, attempt: retries + 1, isDuplicate, isRecent },
              isDuplicate
                ? "Generated phrase was duplicate"
                : "Generated phrase was too recent"
            );
            retries++;
          }
        } catch (error) {
          logger.warn(
            { error, phraseIndex: i, attempt: retries + 1 },
            "Failed to generate phrase"
          );
          errors.push(error as Error);
          retries++;
        }

        if (!success && retries < maxRetries) {
          logger.info(
            { phraseIndex: i, nextAttempt: retries + 1 },
            "Adding delay before next attempt"
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!success) {
        logger.warn(
          { phraseIndex: i, maxRetries },
          "Failed all attempts for this phrase"
        );
      }
    }

    logger.info(
      { generatedCount: phrases.length, requestedCount: count },
      "Completed initial generation attempts"
    );

    // Only fall back if we couldn't generate enough phrases
    if (phrases.length < count) {
      logger.warn(
        { errors, generatedCount: phrases.length, requestedCount: count },
        "Failed to generate some phrases after all retries"
      );

      // Try user-provided fallbacks first
      let availableFallbacks = [...this.fallbackPhrases];
      logger.info(
        { userFallbackCount: availableFallbacks.length },
        "Checking user-provided fallbacks"
      );

      // If no user fallbacks or not enough, use default fallbacks
      if (availableFallbacks.length === 0) {
        logger.info(
          { defaultFallbackCount: defaultPhrases.length },
          "Using default fallbacks"
        );
        availableFallbacks = defaultPhrases;
      }

      if (availableFallbacks.length === 0) {
        logger.error("No fallback phrases available");
        throw new Error("No fallback phrases available");
      }

      // Filter out recent phrases from fallbacks
      availableFallbacks = availableFallbacks.filter(
        (f) => !this.isRecentPhrase(f.indonesian.toLowerCase())
      );

      // Fill remaining slots with random fallback phrases
      const remainingCount = count - phrases.length;
      const shuffledFallbacks = availableFallbacks.sort(
        () => 0.5 - Math.random()
      );

      let fallbacksAdded = 0;
      let fallbackIndex = 0;

      logger.info(
        { remainingCount, availableFallbacks: shuffledFallbacks.length },
        "Starting fallback selection"
      );

      while (
        fallbacksAdded < remainingCount &&
        fallbackIndex < shuffledFallbacks.length
      ) {
        const fallback = shuffledFallbacks[fallbackIndex];
        const isDuplicate = phrases.some((p) =>
          this.areSimilarPhrases(p, fallback)
        );

        logger.info(
          { fallbackIndex, isDuplicate, fallbacksAdded },
          "Checking fallback phrase"
        );

        if (!isDuplicate) {
          phrases.push(fallback);
          this.addToRecentPhrases(fallback.indonesian.toLowerCase());
          fallbacksAdded++;
          logger.info({ fallbacksAdded, fallback }, "Added fallback phrase");
        }

        fallbackIndex++;
      }

      logger.info(
        { finalCount: phrases.length, fallbacksAdded },
        "Completed fallback addition"
      );
    }

    return phrases;
  }

  private areSimilarPhrases(a: Phrase, b: Phrase): boolean {
    // Check for exact matches
    if (a.indonesian === b.indonesian || a.english === b.english) {
      return true;
    }

    // Check for similar template patterns
    const stripTemplate = (str: string) =>
      str.replace(/\s*::\w+::\s*/g, " x ").trim();
    const normalizeStr = (str: string) => stripTemplate(str.toLowerCase());

    const normalizedA = {
      indonesian: normalizeStr(a.indonesian),
      english: normalizeStr(a.english),
    };

    const normalizedB = {
      indonesian: normalizeStr(b.indonesian),
      english: normalizeStr(b.english),
    };

    return (
      normalizedA.indonesian === normalizedB.indonesian ||
      normalizedA.english === normalizedB.english
    );
  }
}
