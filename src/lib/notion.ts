import { Client } from '@notionhq/client';

if (!process.env.NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN is not defined');
}

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const NOTION_IDIOMS_DATABASE_ID = process.env.NOTION_IDIOMS_DATABASE_ID;
export const NOTION_EXPRESSIONS_DATABASE_ID = process.env.NOTION_EXPRESSIONS_DATABASE_ID;

if (!NOTION_IDIOMS_DATABASE_ID || !NOTION_EXPRESSIONS_DATABASE_ID) {
  throw new Error('Notion database IDs must be defined in environment variables');
}
