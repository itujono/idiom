import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { CronJob } from "cron";
import { fallbackIdioms } from "./data/idioms";
import { phrases } from "./data/phrases";
import {
  IdiomsDiscordService,
  PhrasesDiscordService,
} from "./services/discord/index";
import { IdiomsService } from "./services/idioms";
import { OpenAIService } from "./services/openai";
import { PhrasesService } from "./services/phrases";
import { appLogger as logger, metrics } from "./services/logger";
import { rateLimiter } from "./middleware/rate-limiter";

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

// Rate limiting configuration
const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});

const metricsRateLimit = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per 5 minutes
});

// Ensure required environment variables are provided
const IDIOMS_WEBHOOK_URL = process.env.IDIOMS_WEBHOOK_URL;
const PHRASES_WEBHOOK_URL = process.env.PHRASES_WEBHOOK_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!IDIOMS_WEBHOOK_URL) {
  logger.error("IDIOMS_WEBHOOK_URL environment variable is required");
  throw new Error("IDIOMS_WEBHOOK_URL environment variable is required");
}

if (!PHRASES_WEBHOOK_URL) {
  logger.error("PHRASES_WEBHOOK_URL environment variable is required");
  throw new Error("PHRASES_WEBHOOK_URL environment variable is required");
}

if (!OPENAI_API_KEY) {
  logger.error("OPENAI_API_KEY environment variable is required");
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openAIService = new OpenAIService(OPENAI_API_KEY);
const idiomsDiscordService = new IdiomsDiscordService(IDIOMS_WEBHOOK_URL);
const phrasesDiscordService = new PhrasesDiscordService(PHRASES_WEBHOOK_URL);
const idiomsService = new IdiomsService(fallbackIdioms, openAIService);
const phrasesService = new PhrasesService(openAIService, phrases);

app.use("*", async (c, next) => {
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

// Schedule daily idioms delivery (8:00 AM GMT+7)
// Note: In cron, we use GMT+0, so 1:00 AM GMT = 8:00 AM GMT+7
new CronJob(
  "0 1 * * *",
  async () => {
    try {
      logger.info("Starting scheduled idioms delivery");
      const dailyIdioms = await idiomsService.getRandomIdioms();
      await idiomsDiscordService.sendIdioms(dailyIdioms);
      logger.info("Daily idioms sent successfully");
    } catch (error) {
      logger.error({ error }, "Failed to send daily idioms");
    }
  },
  null,
  true,
  "UTC"
);

// Schedule daily phrases delivery (2:00 PM GMT+7)
// Note: In cron, we use GMT+0, so 7:00 AM GMT = 2:00 PM GMT+7
new CronJob(
  "0 7 * * *",
  async () => {
    try {
      logger.info("Starting scheduled phrases delivery");
      const dailyPhrases = await phrasesService.getPhrases(3);
      await phrasesDiscordService.sendPhrases(dailyPhrases);
      logger.info("Daily phrases sent successfully");
    } catch (error) {
      logger.error({ error }, "Failed to send daily phrases");
    }
  },
  null,
  true,
  "UTC"
);

// Health check endpoint (no rate limit)
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Daily Idioms service is running" });
});

// Rate limited endpoints
app.get("/metrics", metricsRateLimit, async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    logger.warn(
      { ip: c.req.header("x-forwarded-for") },
      "Unauthorized metrics access attempt"
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({
    status: "ok",
    metrics: metrics.getMetrics(),
  });
});

app.post("/idiom", apiRateLimit, async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    logger.warn(
      { ip: c.req.header("x-forwarded-for") },
      "Unauthorized idiom trigger attempt"
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    logger.info("Manual idiom trigger initiated");
    const dailyIdioms = await idiomsService.getRandomIdioms();
    logger.info({ dailyIdioms }, "Generated idioms");

    await idiomsDiscordService.sendIdioms(dailyIdioms);
    return c.json({ status: "success", message: "Idioms sent successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to send idioms");
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Failed to send idioms" }, 500);
  }
});

app.post("/how-to-say-this", apiRateLimit, async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    logger.warn(
      { ip: c.req.header("x-forwarded-for") },
      "Unauthorized phrase trigger attempt"
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    logger.info("Manual phrase trigger initiated");
    const phrases = await phrasesService.getPhrases(3);
    await phrasesDiscordService.sendPhrases(phrases);
    return c.json({ status: "success", message: "Phrases sent successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to send phrases");
    return c.json({ error: "Failed to send phrases" }, 500);
  }
});

app.post("/test-webhook", apiRateLimit, async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    logger.warn(
      { ip: c.req.header("x-forwarded-for") },
      "Unauthorized test webhook attempt"
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    logger.info("Testing webhook");
    await idiomsDiscordService.testWebhook();
    return c.json({
      status: "success",
      message: "Test message sent successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to send test message");
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Failed to send test message" }, 500);
  }
});

logger.info({ port }, "Starting server");
serve({
  fetch: app.fetch,
  port,
});
