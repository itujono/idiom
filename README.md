# Daily Idioms & Indonesian Phrases Bot

A TypeScript application built with Bun.js and Hono that sends daily English idioms and Indonesian phrases to Discord channels, complete with translations and examples.

## Features

### English Idioms

- Sends 4 random English idioms daily at 8:00 AM (GMT+7)
- Each idiom includes:
  - Clear meaning
  - Two practical examples in English and Indonesian

### "How to Say This" - Indonesian Phrases

- Sends 3 Indonesian phrases daily at 2:00 PM (GMT+7)
- Each phrase includes:
  - English equivalent
  - Practical example in both languages
  - Alternative phrasing (when applicable)
- Uses OpenAI to generate natural, colloquial phrases
- Falls back to predefined phrases if needed

### Technical Features

- Built with TypeScript for type safety
- Uses Bun.js for fast execution
- Rate limiting for API endpoints
- Separate Discord webhooks for idioms and phrases
- Manual trigger endpoints (protected by API key)
- Metrics tracking and monitoring

## Local Development

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file with the following variables:

   ```
   IDIOMS_WEBHOOK_URL=your_idioms_discord_webhook_url
   PHRASES_WEBHOOK_URL=your_phrases_discord_webhook_url
   OPENAI_API_KEY=your_openai_api_key
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

   - `IDIOMS_WEBHOOK_URL`: Discord webhook URL for idioms channel
   - `PHRASES_WEBHOOK_URL`: Discord webhook URL for phrases channel
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `API_KEY`: A secure random string for API authentication
   - `PORT`: Will be set automatically by Railway

4. Deploy! Railway will automatically:
   - Detect Bun.js
   - Install dependencies
   - Start the application

## API Endpoints

- `GET /`: Health check endpoint
- `GET /metrics`: Get application metrics (rate limited: 10 requests/5 minutes)
- `POST /idiom`: Manually trigger idiom delivery (rate limited: 5 requests/minute)
- `POST /how-to-say-this`: Manually trigger phrase delivery (rate limited: 5 requests/minute)

All endpoints except health check require the `x-api-key` header.

## Testing the API

Test the manual triggers:

```bash
# For idioms
curl -X POST -H "x-api-key: your_api_key" https://your-railway-url/idiom

# For Indonesian phrases
curl -X POST -H "x-api-key: your_api_key" https://your-railway-url/how-to-say-this

# For metrics
curl -H "x-api-key: your_api_key" https://your-railway-url/metrics
```

## Rate Limiting

The application includes rate limiting to prevent abuse:

- API endpoints (`/idiom`, `/how-to-say-this`): 5 requests per minute
- Metrics endpoint (`/metrics`): 10 requests per 5 minutes
- Health check endpoint (`/`): No rate limit

Rate limit headers are included in responses:

```
X-RateLimit-Limit: Maximum requests allowed
X-RateLimit-Remaining: Remaining requests in window
X-RateLimit-Reset: Timestamp when the limit resets
```

## Monitoring

- Railway provides built-in logs and metrics
- The application tracks:
  - Message delivery success/failure
  - API usage and rate limiting
  - Response times
  - Error rates
- Health endpoint (`/`) can be used for uptime monitoring

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
