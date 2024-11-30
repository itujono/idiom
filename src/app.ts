import { OpenAIService } from "./services/openai";
import { IdiomsService } from "./services/idioms";
import { PhrasesService } from "./services/phrases";
import { fallbackIdioms } from "./data/idioms";
import { phrases } from "./data/phrases";
import { config } from "./config";

// Initialize services
const openAIService = new OpenAIService(config.openai.apiKey);
const idiomsService = new IdiomsService(fallbackIdioms, openAIService);
const phrasesService = new PhrasesService(openAIService, phrases);
