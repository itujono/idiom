import { Context, Next } from 'hono';
import { appLogger as logger } from '../services/logger';

export const authMiddleware = async (c: Context, next: Next) => {
  const apiKey = c.req.header('x-api-key');

  if (apiKey !== process.env.API_KEY) {
    logger.warn({ ip: c.req.header('x-forwarded-for') }, 'Unauthorized access attempt');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
};
