// Validate required environment variables
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "IDIOMS_WEBHOOK_URL",
  "PHRASES_WEBHOOK_URL",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  discord: {
    idiomsWebhookUrl: process.env.IDIOMS_WEBHOOK_URL!,
    phrasesWebhookUrl: process.env.PHRASES_WEBHOOK_URL!,
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  },
} as const;
