import { describe, expect, it } from 'vitest';
import { parseArticleId } from './articleValidation.js';

describe('parseArticleId', () => {
  it.each([
    ['1', 1],
    ['42', 42],
    ['0', null],
    ['-1', null],
    ['1.5', null],
    ['abc', null],
    ['', null],
    [undefined, null],
  ])('%s route param을 검증한다', (value, expected) => {
    expect(parseArticleId(value)).toBe(expected);
  });
});
