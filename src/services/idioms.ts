import type { Idiom } from "../types";

export class IdiomsService {
  private fallbackIdioms: Idiom[];

  constructor(fallbackIdioms: Idiom[]) {
    this.fallbackIdioms = fallbackIdioms;
  }

  async getRandomIdioms(count: number = 4): Promise<Idiom[]> {
    const shuffled = [...this.fallbackIdioms].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
