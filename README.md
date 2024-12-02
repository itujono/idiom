# Daily Idioms & Indonesian Phrases Bot

A TypeScript application built with Bun.js and Hono that sends daily English idioms and Indonesian phrases to Discord channels, complete with translations and examples. Uses Notion as a content management system.

## Example Outputs

### Daily Idioms Example

```
🌟 Hot off the press! New set of idioms for Sunday, December 1, 2024

1. **Bite off more than you can chew**
💡 To take on more responsibility than you can handle

📝 Example:
Don't bite off more than you can chew by signing up for five different clubs this semester.

2. **Break the ice**
💡 To make people feel more comfortable in a social situation

📝 Example:
The host broke the ice by asking everyone to share a funny story about their weekend.
```

### How to Say This Example

```
🎯 Today's must-know Indonesian phrase for Sunday, December 1, 2024

1. **Nggak ada angin nggak ada hujan**: Out of the blue

📝 Examples:
🇬🇧 He suddenly quit his job out of the blue
🇮🇩 Dia mengundurkan diri nggak ada angin nggak ada hujan

💫 Alternative phrases:
🇮🇩 Tiba-tiba aja

2. **Panjang tangan**: Light-fingered/tends to steal

📝 Examples:
🇬🇧 Be careful with your wallet, that guy is known to be light-fingered
🇮🇩 Hati-hati sama dompetmu, orang itu terkenal panjang tangan

💫 Alternative phrases:
🇮🇩 Suka ngambil barang orang

3. **Besar kepala**: Getting cocky

📝 Examples:
🇬🇧 Ever since he got promoted, he's been getting really cocky
🇮🇩 Semenjak naik jabatan, dia jadi besar kepala

💫 Alternative phrases:
🇮🇩 Jadi sombong
```

## Features

### English Idioms

- Sends random English idioms daily at:
  - 8:00 AM (GMT+7)
  - 9:00 AM (GMT+7)
- Each idiom includes:
  - Clear meaning
  - Practical examples

### "How to Say This" - Indonesian Phrases

- Sends Indonesian phrases daily at:
  - 2:00 PM (GMT+7)
  - 3:00 PM (GMT+7)
- Each phrase includes:
  - English equivalent
  - Practical example in both languages
  - Alternative phrasing (when applicable)

### Technical Features

- Built with TypeScript for type safety
- Uses Bun.js for fast execution
- Notion integration for content management
- Smart content rotation system:
  - Prevents duplicate content within 30-day windows
  - Tracks last sent date for each item
  - Uses Fisher-Yates shuffle for true randomization
  - Maintains large pool size for better variety
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
   NOTION_TOKEN=your_notion_integration_token
   NOTION_IDIOMS_DATABASE_ID=your_idioms_database_id
   NOTION_EXPRESSIONS_DATABASE_ID=your_expressions_database_id
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
   - `NOTION_TOKEN`: Your Notion integration token
   - `NOTION_IDIOMS_DATABASE_ID`: ID of your Notion idioms database
   - `NOTION_EXPRESSIONS_DATABASE_ID`: ID of your Notion expressions database
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
- `POST /test-webhook`: Test Discord webhook connection

All endpoints except health check require the `x-api-key` header.

## Content Management

The application uses Notion as its CMS with some special features:

- **Duplicate Prevention**: Items won't be repeated within a 30-day window
- **Content Tracking**: Each item's last sent date is automatically tracked
- **Smart Selection**: Uses an improved randomization algorithm to ensure even distribution
- **Large Pool**: Maintains a large selection pool for better variety

## Testing the API

Test manually with curl:

```bash
# For idioms
curl -X POST -H "x-api-key: your_api_key" https://your-railway-url/idiom

# For Indonesian phrases
curl -X POST -H "x-api-key: your_api_key" https://your-railway-url/how-to-say-this
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
- Detailed error logging with stack traces

## Contributing

I don't accept contributions at the moment.
