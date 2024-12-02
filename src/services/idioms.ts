import { appLogger as logger } from './logger';
import type { Idiom } from '../types';
import { getRandomIdioms, updateLastSentDates } from '../lib/notion/fetchers';

export class IdiomsService {
  private recentIdioms: Set<string> = new Set();
  private readonly CACHE_SIZE = 20;

  private addToRecentIdioms(idiom: string) {
    this.recentIdioms.add(idiom);
    if (this.recentIdioms.size > this.CACHE_SIZE) {
      this.recentIdioms.delete(this.recentIdioms.values().next().value);
    }
  }

  private isRecentIdiom(idiom: string): boolean {
    return this.recentIdioms.has(idiom);
  }

  async getIdioms(count: number = 3): Promise<Idiom[]> {
    logger.info({ count }, 'Starting idiom fetching');

    try {
      const notionIdioms = await getRandomIdioms(count * 2);
      logger.info({ fetchedCount: notionIdioms.length }, 'Fetched idioms from Notion');

      const idioms: Idiom[] = [];
      const idsToUpdate: string[] = [];

      for (const item of notionIdioms) {
        const idiom: Idiom = {
          id: item.id,
          phrase: item.idiom,
          meaning: item.meaning,
          examples: item.examples,
        };

        const isDuplicate = idioms.some(i => i.phrase === idiom.phrase);
        const isRecent = this.isRecentIdiom(idiom.phrase.toLowerCase());

        if (!isDuplicate && !isRecent) {
          idioms.push(idiom);
          idsToUpdate.push(idiom.id);
          this.addToRecentIdioms(idiom.phrase.toLowerCase());

          if (idioms.length >= count) break;
        }
      }

      if (idioms.length < count) {
        logger.warn({ requestedCount: count, actualCount: idioms.length }, 'Could not fetch enough unique idioms');
      }

      // Update last_sent dates for selected idioms
      await updateLastSentDates(idsToUpdate);
      logger.info({ updatedCount: idsToUpdate.length }, 'Updated last_sent dates');

      return idioms;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch idioms');
      throw error;
    }
  }
}
