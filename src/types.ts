export interface Example {
  english: string;
  indonesian: string;
}

export interface Idiom {
  phrase: string;
  meaning: string;
  examples: Example[];
}

export interface Phrase {
  indonesian: string;
  english: string;
  example: Example;
  alt_phrase?: string;
}
