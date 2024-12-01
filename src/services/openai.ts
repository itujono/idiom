import OpenAI from "openai";
import { appLogger as logger } from "./logger";
import type { Phrase, Example, Idiom } from "../types";

export class OpenAIService {
  private client: OpenAI;
  private readonly model = "gpt-4o-mini";

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
              "You are a helpful assistant that generates interesting and useful English idioms that could spark conversations.",
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
      logger.info("Starting phrase generation with OpenAI");

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates Indonesian phrases with their non-obvious English equivalents.
Focus on phrases where the English translation isn't immediately obvious to Indonesian speakers.

Important guidelines:
1. Focus on phrases that:
   - Are commonly used in Indonesian daily life
   - Have non-literal English translations
   - Would be tricky for Indonesians to express in English
   - Sound natural in both languages
2. Avoid:
   - Basic phrases like "Silakan duduk" or "Bisa saya bantu?"
   - Direct word-for-word translations
   - Overly formal or textbook-style phrases
   - Common idioms like "buka kartu" or "main mata"
3. Use template variables (::X::) only for truly flexible parts
4. Include alternative phrasings that are equally common

Examples of good phrases:
{
  "indonesian": "Ngelindas ::X::",
  "english": "Run ::X:: over",
  "example": {
    "english": "He could've run the robber over by slamming the gas pedal real hard",
    "indonesian": "Dia bisa aja ngelindas pencurinya dengan nginjek gas dalam-dalam"
  }
}

{
  "indonesian": "Pulangnya ntar aja",
  "english": "I'll head home later",
  "example": {
    "english": "It's still congested here. I'll head home around 5 o'clock or so",
    "indonesian": "Masih macet nih. Pulangnya ntar aja sekitar jam 5 gitu"
  },
  "alt_phrase": "Baliknya nanti aja"
}

{
  "indonesian": "Ngegantung ::X::",
  "english": "Leave ::X:: hanging",
  "example": {
    "english": "Don't leave your teammates hanging, they need your input",
    "indonesian": "Jangan ngegantung tim kamu, mereka butuh masukan kamu"
  }
}

You must respond with a JSON object in this format:
{
  "indonesian": "natural Indonesian phrase",
  "english": "non-obvious English equivalent",
  "example": {
    "english": "natural example in English",
    "indonesian": "natural example in Indonesian"
  },
  "alt_phrase": "alternative Indonesian phrasing (if applicable)"
}`,
          },
          {
            role: "user",
            content:
              "Generate a unique Indonesian phrase that's commonly used but has a non-obvious English translation. Focus on expressions that Indonesian speakers might struggle to express naturally in English. Make sure it's different from common phrases like 'buka kartu' (lay cards on the table).",
          },
        ],
        response_format: { type: "json_object" },
        temperature: 1.0, // Increased for maximum variety
        max_tokens: 500,
        presence_penalty: 0.8, // Increased to strongly discourage repetition
        frequency_penalty: 0.8, // Increased to strongly discourage repetition
      });

      logger.info("Received response from OpenAI");

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        logger.error("No content in OpenAI response");
        throw new Error("No content in OpenAI response");
      }

      logger.info({ content }, "Parsing OpenAI response");

      try {
        const result = JSON.parse(content);

        if (
          !result.indonesian ||
          !result.english ||
          !result.example?.english ||
          !result.example?.indonesian
        ) {
          logger.error({ result }, "Invalid response format from OpenAI");
          throw new Error("Invalid response format from OpenAI");
        }

        // Validate the response isn't too basic
        const basicPatterns = [
          "silakan",
          "permisi",
          "terima kasih",
          "selamat",
          "bisa saya bantu",
          "mohon maaf",
          "tolong",
        ];

        // Validate the response doesn't use overly casual patterns
        const casualPatterns = [
          "kebal",
          "kokoh",
          "kuat",
          "udah biasa",
          "ngga ada",
          "nol besar",
          "iri",
          "ngidam",
          "kayaknya",
          "deh",
          "sih",
          "buka kartu",
          "main mata",
        ];

        const lowerIndonesian = result.indonesian.toLowerCase();
        if (
          basicPatterns.some((pattern) => lowerIndonesian.includes(pattern))
        ) {
          logger.warn({ result }, "Generated phrase is too basic, retrying");
          throw new Error("Generated phrase too basic");
        }

        if (
          casualPatterns.some((pattern) => lowerIndonesian.includes(pattern))
        ) {
          logger.warn({ result }, "Generated phrase is too casual, retrying");
          throw new Error("Generated phrase too casual");
        }

        logger.info({ result }, "Successfully generated phrase");
        return result;
      } catch (error) {
        logger.error(
          { error, content },
          "Failed to parse or validate OpenAI response"
        );
        throw error;
      }
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
      const prompt = `Given the idiom "${idiom}" which means "${meaning}", generate 2 natural, conversational example sentences using this idiom. Each example should be in a different context. Make the examples relatable and modern. Then translate each example to Indonesian, maintaining the natural conversational tone. Return the response as a JSON object with this structure:

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
              "You are a helpful assistant that generates natural, conversational examples of how to use idioms in everyday situations, with accurate Indonesian translations. You will respond with a JSON object containing the examples.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
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
