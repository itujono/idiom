# Daily Idioms Bot

A TypeScript application built with Bun.js and Hono that sends daily English idioms to a Discord channel, complete with meanings and examples in both English and Indonesian.

## Features

- Sends 4 random English idioms daily at 8:00 AM (GMT+7)
- Each idiom includes:
  - Clear meaning
  - Two practical examples in English and Indonesian
- Discord webhook integration
- Manual trigger endpoint (protected by API key)
- Built with TypeScript for type safety
- Uses Bun.js for fast execution

## Local Development

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file with the following variables:

   ```
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   API_KEY=your_secret_api_key
   PORT=3000
   ```

3. Run the application:
   ```bash
   bun run dev  # for development with watch mode
   # or
   bun run start  # for production
   ```

## Deployment to Railway

1. Create a new project on [Railway](https://railway.app)

2. Connect your GitHub repository to Railway

3. Set up the following environment variables in Railway's dashboard:

   - `DISCORD_WEBHOOK_URL`: Your Discord webhook URL
   - `API_KEY`: A secure random string for API authentication
   - `PORT`: Will be set automatically by Railway

4. Deploy! Railway will automatically:
   - Detect Bun.js
   - Install dependencies
   - Start the application

## API Endpoints

- `GET /`: Health check endpoint
- `POST /trigger`: Manually trigger idiom delivery (requires `x-api-key` header)

## Testing the API

Test the manual trigger:

```bash
curl -X POST -H "x-api-key: your_api_key" https://your-railway-url/trigger
```

## Monitoring

- Railway provides built-in logs and metrics
- The application logs successful deliveries and any errors
- Health endpoint (`/`) can be used for uptime monitoring

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
