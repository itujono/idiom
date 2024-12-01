import type { Idiom } from '../types';
import { appLogger as logger } from './logger';
import { getRandomIdiom } from '../lib/notion/fetchers';

export class IdiomsService {
  async getRandomIdioms(count = 3): Promise<Idiom[]> {
    const idioms: Idiom[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < count; i++) {
      try {
        logger.info('Fetching random idiom from Notion');
        const idiom = await getRandomIdiom();

        if (!idiom) {
          logger.warn('No unused idioms found in Notion');
          continue;
        }

        logger.info({ idiom }, 'Fetched random idiom');

        idioms.push({ phrase: idiom.idiom, meaning: idiom.meaning, examples: idiom.examples });
      } catch (error) {
        logger.warn({ error }, 'Failed to fetch idiom from Notion');
        if (error instanceof Error) {
          errors.push(error);
          logger.error(
            {
              error: error.message,
              stack: error.stack,
              index: i,
            },
            'Detailed idiom fetch error'
          );
        } else {
          errors.push(new Error(`Unknown error: ${String(error)}`));
          logger.error({ error: String(error), index: i }, 'Unknown idiom fetch error');
        }
      }
    }

    if (idioms.length < count) {
      const errorMessage = `Failed to fetch enough idioms: got ${idioms.length}/${count}. Errors: ${errors.map(e => e.message).join(', ')}`;
      logger.warn({ errors, fetchedCount: idioms.length, requestedCount: count }, errorMessage);
      throw new Error(errorMessage);
    }

    return idioms;
  }
}
