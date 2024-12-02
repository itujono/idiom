export interface Example {
  english: string;
  indonesian: string;
}

export interface Idiom {
  id: string;
  phrase: string;
  meaning: string;
  examples: string;
}

export interface Phrase {
  id: string;
  indonesian: string;
  english: string;
  examples: string;
  alt_phrases?: string;
}
