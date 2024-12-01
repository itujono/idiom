interface NotionTitleProperty {
  type: "title";
  title: Array<{ plain_text: string }>;
}

interface NotionRichTextProperty {
  type: "rich_text";
  rich_text: Array<{ plain_text: string }>;
}

export interface IdiomEntry {
  id: string;
  idiom: string;
  meaning: string;
  examples: string;
}

export interface ExpressionEntry {
  id: string;
  sentence: string;
  in_english: string;
  examples: string;
  alt_phrases: string;
}

export type { NotionTitleProperty, NotionRichTextProperty };
