export interface WordCounterMetrics {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  readingMinutes: number;
}

const WORD_PATTERN = /[\p{Letter}\p{Number}]+(?:['’][\p{Letter}\p{Number}]+)*/gu;
const SENTENCE_END_PATTERN = /[.!?]+(?=\s|$)/gu;

export function countWords(text: string): number {
  return text.match(WORD_PATTERN)?.length ?? 0;
}

export function countSentences(text: string): number {
  if (countWords(text) === 0) return 0;
  return text.match(SENTENCE_END_PATTERN)?.length || 1;
}

export function getWordCounterMetrics(text: string): WordCounterMetrics {
  const words = countWords(text);
  const codePoints = [...text];
  return {
    words,
    characters: codePoints.length,
    charactersNoSpaces: codePoints.filter((character) => !/\s/u.test(character)).length,
    sentences: countSentences(text),
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
  };
}
