import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import {
  notion,
  NOTION_IDIOMS_DATABASE_ID,
  NOTION_EXPRESSIONS_DATABASE_ID,
} from "../notion";
import {
  IdiomEntry,
  ExpressionEntry,
  NotionTitleProperty,
  NotionRichTextProperty,
} from "../types/notion";

function getRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export async function getRandomIdiom(): Promise<IdiomEntry | null> {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_IDIOMS_DATABASE_ID!,
      page_size: 10,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    if (!response.results.length) return null;

    const page = getRandomItem(response.results) as PageObjectResponse;
    const props = page.properties;

    if (!props.idiom || !props.meaning || !props.examples) {
      throw new Error("Missing required properties in Notion database");
    }

    const idiomProp = props.idiom as NotionTitleProperty;
    const meaningProp = props.meaning as NotionRichTextProperty;
    const examplesProp = props.examples as NotionRichTextProperty;

    if (
      !idiomProp.title.length ||
      !meaningProp.rich_text.length ||
      !examplesProp.rich_text.length
    ) {
      throw new Error("One or more properties are empty");
    }

    return {
      id: page.id,
      idiom: idiomProp.title[0].plain_text,
      meaning: meaningProp.rich_text[0].plain_text,
      examples: examplesProp.rich_text[0].plain_text,
    };
  } catch (error) {
    console.error("Error fetching idiom:", error);
    throw error;
  }
}

export async function getRandomExpression(): Promise<ExpressionEntry | null> {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_EXPRESSIONS_DATABASE_ID!,
      page_size: 10,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    if (!response.results.length) return null;

    const page = getRandomItem(response.results) as PageObjectResponse;
    const props = page.properties;

    // Check required properties
    const missingProps = [];
    if (!props.sentence) missingProps.push("sentence");
    if (!props.in_english) missingProps.push("in_english");
    if (!props.examples) missingProps.push("examples");

    if (missingProps.length > 0) {
      throw new Error(
        `Missing required properties: ${missingProps.join(", ")}`
      );
    }

    const sentenceProp = props.sentence as NotionTitleProperty;
    const inEnglishProp = props.in_english as NotionRichTextProperty;
    const examplesProp = props.examples as NotionRichTextProperty;
    const altPhrasesProp = props.alt_phrases as
      | NotionRichTextProperty
      | undefined;

    // Check required properties for empty content
    const emptyProps = [];
    if (!sentenceProp.title.length) emptyProps.push("sentence");
    if (!inEnglishProp.rich_text.length) emptyProps.push("in_english");
    if (!examplesProp.rich_text.length) emptyProps.push("examples");

    if (emptyProps.length > 0) {
      throw new Error(
        `Empty content in required properties: ${emptyProps.join(", ")}`
      );
    }

    return {
      id: page.id,
      sentence: sentenceProp.title[0].plain_text,
      in_english: inEnglishProp.rich_text[0].plain_text,
      examples: examplesProp.rich_text[0].plain_text,
      alt_phrases: altPhrasesProp?.rich_text[0]?.plain_text ?? "",
    };
  } catch (error) {
    console.error("Error fetching expression:", error);
    throw error;
  }
}
