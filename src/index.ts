import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { CronJob } from "cron";
import { idioms } from "./data/idioms";
import { DiscordService } from "./services/discord";
import { IdiomsService } from "./services/idioms";
import { appLogger as logger, metrics } from "./services/logger";

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

// Ensure Discord webhook URL is provided
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
if (!DISCORD_WEBHOOK_URL) {
  logger.error("DISCORD_WEBHOOK_URL environment variable is required");
  throw new Error("DISCORD_WEBHOOK_URL environment variable is required");
}

const discordService = new DiscordService(DISCORD_WEBHOOK_URL);
const idiomsService = new IdiomsService(idioms);

// Add request logging middleware
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
      await discordService.sendIdioms(dailyIdioms);
      logger.info("Daily idioms sent successfully");
    } catch (error) {
      logger.error({ error }, "Failed to send daily idioms");
    }
  },
  null,
  true,
  "UTC"
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Daily Idioms service is running" });
});

// Metrics endpoint (protected by API key)
app.get("/metrics", async (c) => {
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

// Manual trigger endpoint (protected by API key)
app.post("/trigger", async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    logger.warn(
      { ip: c.req.header("x-forwarded-for") },
      "Unauthorized trigger attempt"
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    logger.info("Manual trigger initiated");
    const dailyIdioms = await idiomsService.getRandomIdioms();
    await discordService.sendIdioms(dailyIdioms);
    return c.json({ status: "success", message: "Idioms sent successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to send idioms");
    return c.json({ error: "Failed to send idioms" }, 500);
  }
});

logger.info({ port }, "Starting server");
serve({
  fetch: app.fetch,
  port,
});
