import OpenAI from "openai";
import { appLogger as logger } from "./logger";
import type { Phrase, Example, Idiom } from "../types";

export class OpenAIService {
  private client: OpenAI;
  private readonly model = "gpt-4-1106-preview";

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateRandomIdiom(): Promise<Omit<Idiom, "examples">> {
    try {
      const prompt = `Generate a random English idiom that is:
1. Commonly used in modern conversations
2. Not too basic or obvious
3. Interesting to learn for non-native speakers
4. Different from common idioms like "break a leg", "piece of cake", etc.

Format the response as JSON:
{
  "phrase": "the idiom itself",
  "meaning": "clear, concise explanation of what it means"
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates interesting and useful English idioms.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const result = JSON.parse(content);
      if (!result.phrase || !result.meaning) {
        throw new Error("Invalid response format from OpenAI");
      }

      return result;
    } catch (error) {
      logger.error({ error }, "Failed to generate random idiom");
      throw error;
    }
  }

  async generatePhrase(): Promise<Phrase> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates casual Indonesian phrases and their English equivalents. 
Focus on common, everyday expressions that Indonesians use in casual conversations.

Important guidelines:
1. Use 'x' or 'y' as template variables when the phrase can be used with different words
2. Keep the Indonesian phrases colloquial (use "gue", "aja", "banget", etc.)
3. If there's a common alternative way to say the phrase, include it in alt_phrase
4. Focus on expressions that might be tricky for English speakers to translate directly
5. Each generated phrase should be unique and cover different contexts or situations
6. Avoid basic or literal translations; focus on idiomatic expressions
7. Include regional variations when relevant (Javanese influence, Jakarta slang, etc.)`,
          },
          {
            role: "user",
            content:
              "Generate a unique casual Indonesian phrase with its English equivalent. Make it colloquial, commonly used in daily conversations, and different from the example outputs. If there's a common alternative way to say it, include it in alt_phrase.",
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      if (
        !result.indonesian ||
        !result.english ||
        !result.example?.english ||
        !result.example?.indonesian
      ) {
        throw new Error("Invalid response format from OpenAI");
      }

      return result;
    } catch (error) {
      logger.error({ error }, "Failed to generate phrase using OpenAI");
      throw error;
    }
  }

  async generateIdiomExamples(
    idiom: string,
    meaning: string
  ): Promise<Example[]> {
    try {
      const prompt = `Given the idiom "${idiom}" which means "${meaning}", generate 2 natural, conversational example sentences using this idiom. Each example should be in a different context. Make the examples relatable and modern. Then translate each example to Indonesian, maintaining the natural conversational tone. Format the output as JSON:

{
  "examples": [
    {
      "english": "example1",
      "indonesian": "translation1"
    },
    {
      "english": "example2",
      "indonesian": "translation2"
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates natural, conversational examples of how to use idioms in everyday situations, with accurate Indonesian translations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const result = JSON.parse(content);
      if (!Array.isArray(result.examples)) {
        throw new Error("Invalid response format from OpenAI");
      }

      return result.examples;
    } catch (error) {
      logger.error({ error, idiom }, "Failed to generate idiom examples");
      return [
        {
          english: `I ${idiom} when trying to finish this project by myself.`,
          indonesian: `Saya ${idiom} ketika mencoba menyelesaikan proyek ini sendiri.`,
        },
        {
          english: `She told me it would be ${idiom} to learn a new language in just one month.`,
          indonesian: `Dia bilang akan ${idiom} untuk belajar bahasa baru hanya dalam satu bulan.`,
        },
      ];
    }
  }
}
