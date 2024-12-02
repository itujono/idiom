import { appLogger as logger } from './logger';
import type { Phrase } from '../types';
import { getRandomExpressions, updateLastSentDates } from '../lib/notion/fetchers';

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
    logger.info({ count }, 'Starting phrase fetching');

    try {
      // Fetch more expressions than needed to account for filtering
      const expressions = await getRandomExpressions(count * 2);
      logger.info({ fetchedCount: expressions.length }, 'Fetched expressions from Notion');

      const phrases: Phrase[] = [];
      const idsToUpdate: string[] = [];

      for (const expression of expressions) {
        const phrase: Phrase = {
          id: expression.id,
          indonesian: expression.sentence,
          english: expression.in_english,
          examples: expression.examples,
          alt_phrases: expression.alt_phrases,
        };

        // Check if it's a recent phrase or duplicate in current batch
        const isDuplicate = phrases.some(p => this.areSimilarPhrases(p, phrase));
        const isRecent = this.isRecentPhrase(phrase.indonesian.toLowerCase());

        if (!isDuplicate && !isRecent) {
          phrases.push(phrase);
          idsToUpdate.push(phrase.id);
          this.addToRecentPhrases(phrase.indonesian.toLowerCase());

          // Break if we have enough phrases
          if (phrases.length >= count) break;
        }
      }

      if (phrases.length < count) {
        logger.warn({ requestedCount: count, actualCount: phrases.length }, 'Could not fetch enough unique phrases');
      }

      // Update last_sent dates for selected phrases
      await updateLastSentDates(idsToUpdate);
      logger.info({ updatedCount: idsToUpdate.length }, 'Updated last_sent dates');

      return phrases;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch phrases');
      throw error;
    }
  }

  private areSimilarPhrases(a: Phrase, b: Phrase): boolean {
    if (a.indonesian === b.indonesian || a.english === b.english) {
      return true;
    }

    // Check for similar template patterns
    const stripTemplate = (str: string) => str.replace(/\s*::\w+::\s*/g, ' x ').trim();
    const normalizeStr = (str: string) => stripTemplate(str.toLowerCase());

    const normalizedA = {
      indonesian: normalizeStr(a.indonesian),
      english: normalizeStr(a.english),
    };

    const normalizedB = {
      indonesian: normalizeStr(b.indonesian),
      english: normalizeStr(b.english),
    };

    return normalizedA.indonesian === normalizedB.indonesian || normalizedA.english === normalizedB.english;
  }
}
