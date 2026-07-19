import { describe, expect, it } from 'vitest';
import { getSafeReturnTo } from './getSafeReturnTo.js';

describe('getSafeReturnTo', () => {
  it.each([
    ['/posts/10?tab=comments#reply', '/posts/10?tab=comments#reply'],
    ['/settings/profile', '/settings/profile'],
    ['https://evil.example', '/posts'],
    ['//evil.example/path', '/posts'],
    ['/\\evil.example/path', '/posts'],
    ['posts/10', '/posts'],
    ['', '/posts'],
    [null, '/posts'],
    [undefined, '/posts'],
  ])('%s 입력을 안전한 내부 경로로 변환한다', (candidate, expected) => {
    expect(getSafeReturnTo(candidate)).toBe(expected);
  });
});
