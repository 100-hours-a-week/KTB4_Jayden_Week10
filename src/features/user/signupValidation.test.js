import { describe, expect, it } from 'vitest';
import { validateEmail, validateSignup } from './signupValidation.js';

describe('signupValidation', () => {
  it('이메일 형식과 필수 값을 검증한다', () => {
    expect(validateEmail('hobby@example.com')).toBe('');
    expect(validateEmail('invalid')).toContain('올바른');
    expect(validateEmail('')).toContain('입력');
  });

  it('가입 필드 전체의 오류를 반환한다', () => {
    expect(validateSignup({
      email: 'hobby@example.com',
      password: 'Valid1!x',
      passwordConfirm: 'Valid1!x',
      nickname: '새하비',
    })).toEqual({ email: '', password: '', passwordConfirm: '', nickname: '' });

    expect(validateSignup({
      email: 'invalid', password: 'invalid', passwordConfirm: 'different', nickname: 'a',
    })).toMatchObject({
      email: expect.any(String),
      password: expect.any(String),
      passwordConfirm: expect.any(String),
      nickname: expect.any(String),
    });
  });
});
