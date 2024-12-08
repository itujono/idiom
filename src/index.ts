import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { appLogger as logger, metrics } from './services/logger';
import { rateLimiter } from './middleware/rate-limiter';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { ServicesContainer } from './services/container';

const app = new Hono();
const port = Number(process.env.PORT) || 3000;
const services = new ServicesContainer();

const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});

const metricsRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
});

// Initialize services
await services.initialize();

// Global middleware
app.use('*', errorHandler);
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  });
});

// Health check endpoint (no rate limit)
app.get('/', c => {
  const uptime = process.uptime();
  return c.json({
    status: 'ok',
    message: 'Daily Idioms service is running',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    services: services.getStatus(),
  });
});

// Protected endpoints
app.get('/metrics', metricsRateLimit, authMiddleware, async c => {
  return c.json({
    status: 'ok',
    metrics: metrics.getMetrics(),
  });
});

app.post('/idiom', apiRateLimit, authMiddleware, async c => {
  const idiomsService = services.getIdiomsService();
  const idiomsDiscordService = services.getIdiomsDiscordService();

  if (!idiomsService || !idiomsDiscordService) {
    return c.json({ error: 'Idioms service is not available' }, 503);
  }

  logger.info('Manual idiom trigger initiated');
  const dailyIdioms = await idiomsService.getIdioms(3);
  logger.info({ dailyIdioms }, 'Generated idioms');

  await idiomsDiscordService.sendIdioms(dailyIdioms);
  return c.json({ status: 'success', message: 'Idioms sent successfully' });
});

app.post('/how-to-say-this', apiRateLimit, authMiddleware, async c => {
  const phrasesService = services.getPhrasesService();
  const phrasesDiscordService = services.getPhrasesDiscordService();

  if (!phrasesService || !phrasesDiscordService) {
    return c.json({ error: 'Phrases service is not available' }, 503);
  }

  logger.info('Manual phrase trigger initiated');
  const phrases = await phrasesService.getPhrases(3);
  await phrasesDiscordService.sendPhrases(phrases);
  return c.json({ status: 'success', message: 'Phrases sent successfully' });
});

app.post('/test-webhook', apiRateLimit, authMiddleware, async c => {
  const idiomsDiscordService = services.getIdiomsDiscordService();

  if (!idiomsDiscordService) {
    return c.json({ error: 'Discord service is not available' }, 503);
  }

  logger.info('Testing webhook');
  await idiomsDiscordService.testWebhook();
  return c.json({
    status: 'success',
    message: 'Test message sent successfully',
  });
});

logger.info({ port }, 'Starting server');
serve({
  fetch: app.fetch,
  port,
});
