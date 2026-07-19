import { describe, expect, it } from 'vitest';
import { validateNickname } from './profileValidation.js';

describe('validateNickname', () => {
  it('한글·영문·숫자·밑줄·하이픈 2~10자를 허용한다', () => {
    expect(validateNickname('하비_01')).toBe('');
    expect(validateNickname('a')).toContain('2~10자');
  });

  it('빈 값, 공백, 10자 초과를 구분한다', () => {
    expect(validateNickname('')).toContain('입력');
    expect(validateNickname('하 비')).toContain('공백');
    expect(validateNickname('12345678901')).toContain('최대 10자');
  });
});
