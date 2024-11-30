import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { CronJob } from "cron";
import { idioms } from "./data/idioms";
import { DiscordService } from "./services/discord";
import { IdiomsService } from "./services/idioms";

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

// Ensure Discord webhook URL is provided
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
if (!DISCORD_WEBHOOK_URL) {
  throw new Error("DISCORD_WEBHOOK_URL environment variable is required");
}

const discordService = new DiscordService(DISCORD_WEBHOOK_URL);
const idiomsService = new IdiomsService(idioms);

// Schedule daily idioms delivery (8:00 AM GMT+7)
// Note: In cron, we use GMT+0, so 1:00 AM GMT = 8:00 AM GMT+7
new CronJob(
  "0 1 * * *",
  async () => {
    try {
      const dailyIdioms = await idiomsService.getRandomIdioms();
      await discordService.sendIdioms(dailyIdioms);
      console.log("Daily idioms sent successfully");
    } catch (error) {
      console.error("Failed to send daily idioms:", error);
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

// Manual trigger endpoint (protected by a simple API key)
app.post("/trigger", async (c) => {
  const apiKey = c.req.header("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const dailyIdioms = await idiomsService.getRandomIdioms();
    await discordService.sendIdioms(dailyIdioms);
    return c.json({ status: "success", message: "Idioms sent successfully" });
  } catch (error) {
    return c.json({ error: "Failed to send idioms" }, 500);
  }
});

console.log(`Server is running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
