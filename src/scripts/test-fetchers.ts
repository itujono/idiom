import { getRandomIdioms, getRandomExpressions } from '../lib/notion/fetchers';

async function testFetchers() {
  console.log('Testing Idioms Fetcher...');
  try {
    const idioms = await getRandomIdioms(3);
    console.log('\nFetched Idioms:');
    idioms.forEach((idiom, i) => {
      console.log(`\n${i + 1}. ${idiom.idiom}`);
      console.log(`   ID: ${idiom.id}`);
      console.log(`   Meaning: ${idiom.meaning}`);
      console.log(`   Example: ${idiom.examples}`);
    });
  } catch (error) {
    console.error('Error fetching idioms:', error);
  }

  console.log('\n-------------------\n');

  console.log('Testing Expressions Fetcher...');
  try {
    const expressions = await getRandomExpressions(3);
    console.log('\nFetched Expressions:');
    expressions.forEach((expr, i) => {
      console.log(`\n${i + 1}. ${expr.sentence}`);
      console.log(`   ID: ${expr.id}`);
      console.log(`   English: ${expr.in_english}`);
      console.log(`   Example: ${expr.examples}`);
      if (expr.alt_phrases) console.log(`   Alt Phrases: ${expr.alt_phrases}`);
    });
  } catch (error) {
    console.error('Error fetching expressions:', error);
  }
}

testFetchers();
