import { expect, test, describe } from "bun:test";
import { getRandomIdiom, getRandomExpression } from "../lib/notion/fetchers";

describe("Notion Integration", () => {
  test("should fetch a random idiom", async () => {
    console.log("Fetching random idiom...");
    const idiom = await getRandomIdiom();
    console.log("Idiom:", idiom);

    expect(idiom).toBeDefined();
    expect(idiom?.idiom).toBeDefined();
    expect(idiom?.meaning).toBeDefined();
    expect(idiom?.examples).toBeDefined();
  });

  test("should fetch a random expression", async () => {
    console.log("\nFetching random expression...");
    const expression = await getRandomExpression();
    console.log("Expression:", expression);

    expect(expression).toBeDefined();
    expect(expression?.sentence).toBeDefined();
    expect(expression?.in_english).toBeDefined();
    expect(expression?.examples).toBeDefined();
    expect(expression?.alt_phrases).toBeDefined();
  });
});
