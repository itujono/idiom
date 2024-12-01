import { Context, Next } from 'hono';
import { appLogger as logger } from '../services/logger';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    logger.error({ error }, 'Request failed');
    if (error instanceof Error) {
      return c.json({ error: error.message, details: error.stack }, 500);
    }
    return c.json({ error: 'Internal server error', details: String(error) }, 500);
  }
};
