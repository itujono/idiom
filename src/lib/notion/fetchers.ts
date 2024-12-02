import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { notion, NOTION_IDIOMS_DATABASE_ID, NOTION_EXPRESSIONS_DATABASE_ID } from '../notion';
import { IdiomEntry, ExpressionEntry, NotionTitleProperty, NotionRichTextProperty } from '../types/notion';

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getDateFilter(daysAgo: number = 30) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}

export async function getRandomIdioms(count: number = 1): Promise<IdiomEntry[]> {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_IDIOMS_DATABASE_ID!,
      page_size: Math.max(100, count * 10),
      filter: {
        or: [
          {
            property: 'last_sent',
            date: {
              before: getDateFilter(),
            },
          },
          {
            property: 'last_sent',
            date: {
              is_empty: true,
            },
          },
        ],
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    if (!response.results.length) return [];

    const shuffledResults = shuffleArray(response.results);

    const validPages = shuffledResults
      .filter(page => {
        const props = (page as PageObjectResponse).properties;
        return (
          props.idiom &&
          props.meaning &&
          props.examples &&
          (props.idiom as NotionTitleProperty).title.length &&
          (props.meaning as NotionRichTextProperty).rich_text.length &&
          (props.examples as NotionRichTextProperty).rich_text.length
        );
      })
      .map(page => {
        const props = (page as PageObjectResponse).properties;
        return {
          id: page.id,
          idiom: (props.idiom as NotionTitleProperty).title[0].plain_text,
          meaning: (props.meaning as NotionRichTextProperty).rich_text[0].plain_text,
          examples: (props.examples as NotionRichTextProperty).rich_text[0].plain_text,
        };
      });

    return validPages.slice(0, count);
  } catch (error) {
    console.error('Error fetching idioms:', error);
    throw error;
  }
}

export async function getRandomExpressions(count: number = 1): Promise<ExpressionEntry[]> {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_EXPRESSIONS_DATABASE_ID!,
      page_size: Math.max(100, count * 10),
      filter: {
        or: [
          {
            property: 'last_sent',
            date: {
              before: getDateFilter(),
            },
          },
          {
            property: 'last_sent',
            date: {
              is_empty: true,
            },
          },
        ],
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    });

    if (!response.results.length) return [];

    const shuffledResults = shuffleArray(response.results);

    const validPages = shuffledResults
      .filter(page => {
        const props = (page as PageObjectResponse).properties;
        return (
          props.sentence &&
          props.in_english &&
          props.examples &&
          (props.sentence as NotionTitleProperty).title.length &&
          (props.in_english as NotionRichTextProperty).rich_text.length &&
          (props.examples as NotionRichTextProperty).rich_text.length
        );
      })
      .map(page => {
        const props = (page as PageObjectResponse).properties;
        const altPhrasesProp = props.alt_phrases as NotionRichTextProperty | undefined;

        return {
          id: page.id,
          sentence: (props.sentence as NotionTitleProperty).title[0].plain_text,
          in_english: (props.in_english as NotionRichTextProperty).rich_text[0].plain_text,
          examples: (props.examples as NotionRichTextProperty).rich_text[0].plain_text,
          alt_phrases: altPhrasesProp?.rich_text[0]?.plain_text ?? '',
        };
      });

    return validPages.slice(0, count);
  } catch (error) {
    console.error('Error fetching expressions:', error);
    throw error;
  }
}

// Keep this for backward compatibility
export async function getRandomExpression(): Promise<ExpressionEntry | null> {
  const results = await getRandomExpressions(1);
  return results.length ? results[0] : null;
}

export async function updateLastSentDate(pageId: string): Promise<void> {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        last_sent: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error('Error updating last_sent date:', error);
    throw error;
  }
}

export async function updateLastSentDates(pageIds: string[]): Promise<void> {
  await Promise.all(pageIds.map(id => updateLastSentDate(id)));
}
