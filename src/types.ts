export interface Example {
  english: string;
  indonesian: string;
}

export interface Idiom {
  phrase: string;
  meaning: string;
  examples: string;
}

export interface Phrase {
  indonesian: string;
  english: string;
  examples: string;
  alt_phrases?: string;
}
