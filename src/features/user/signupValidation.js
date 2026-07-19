import { validateNickname } from './profileValidation.js';
import { validatePassword, validatePasswordConfirm } from './passwordValidation.js';

export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email) {
  if (!email) return '이메일을 입력해주세요.';
  if (!EMAIL_PATTERN.test(email)) return '올바른 이메일 주소 형식을 입력해주세요.';
  return '';
}

export function validateSignup(values) {
  const passwordResult = validatePassword(values.password);
  const confirmResult = validatePasswordConfirm(values.password, values.passwordConfirm);
  return {
    email: validateEmail(values.email),
    password: passwordResult.message,
    passwordConfirm: confirmResult.message,
    nickname: validateNickname(values.nickname),
  };
}
