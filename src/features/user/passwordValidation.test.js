import { describe, expect, it } from 'vitest';
import { validatePassword, validatePasswordConfirm } from './passwordValidation.js';

describe('passwordValidation', () => {
  it('8~20자와 대소문자·숫자·특수문자 조합을 검증한다', () => {
    expect(validatePassword('Valid1!x').type).toBe('valid');
    expect(validatePassword('invalid').type).toBe('format');
    expect(validatePassword('')).toMatchObject({ type: 'required' });
  });

  it('확인 값의 빈 상태와 불일치를 구분한다', () => {
    expect(validatePasswordConfirm('Valid1!x', '')).toMatchObject({ type: 'required' });
    expect(validatePasswordConfirm('Valid1!x', 'Valid1!y')).toMatchObject({ type: 'mismatch' });
    expect(validatePasswordConfirm('Valid1!x', 'Valid1!x')).toMatchObject({ type: 'valid' });
  });
});
