import { appLogger as logger } from "./logger";
import type { Phrase } from "../types";
import { getRandomExpression } from "../lib/notion/fetchers";

export class PhrasesService {
  private recentPhrases: Set<string> = new Set();
  private readonly CACHE_SIZE = 20; // Remember last 20 phrases

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
    logger.info({ count }, "Starting phrase fetching");

    const phrases: Phrase[] = [];
    const errors: Error[] = [];
    const maxRetries = 5;

    for (let i = 0; i < count; i++) {
      let success = false;
      let retries = 0;

      logger.info({ phraseIndex: i, maxRetries }, "Starting fetch for phrase");

      while (!success && retries < maxRetries) {
        try {
          logger.info(
            { phraseIndex: i, attempt: retries + 1, maxRetries },
            "Attempting to fetch phrase"
          );

          const expression = await getRandomExpression();

          if (!expression) {
            logger.warn("No unused expressions found in Notion");
            break;
          }

          logger.info({ expression }, "Received expression from Notion");

          const phrase: Phrase = {
            indonesian: expression.sentence,
            english: expression.in_english,
            examples: expression.examples,
            alt_phrases: expression.alt_phrases,
          };

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
                ? "Fetched phrase was duplicate"
                : "Fetched phrase was too recent"
            );
            retries++;
          }
        } catch (error) {
          logger.warn(
            { error, phraseIndex: i, attempt: retries + 1 },
            "Failed to fetch phrase"
          );
          if (error instanceof Error) {
            errors.push(error);
            logger.error(
              {
                error: error.message,
                stack: error.stack,
                phraseIndex: i,
                attempt: retries + 1,
              },
              "Detailed phrase fetch error"
            );
          } else {
            errors.push(new Error(`Unknown error: ${String(error)}`));
            logger.error(
              {
                error: String(error),
                phraseIndex: i,
                attempt: retries + 1,
              },
              "Unknown phrase fetch error"
            );
          }
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
          { phraseIndex: i, maxRetries, errors },
          "Failed all attempts for this phrase"
        );
        throw new Error(
          `Failed to fetch phrase after ${maxRetries} attempts: ${errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }
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
