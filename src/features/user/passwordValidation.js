export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/;

export function validatePassword(password) {
  if (!password) return { type: 'required', message: '비밀번호를 입력해주세요.' };
  if (!PASSWORD_PATTERN.test(password)) {
    return {
      type: 'format',
      message: '비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 각각 포함해야 합니다.',
    };
  }
  return { type: 'valid', message: '' };
}

export function validatePasswordConfirm(password, passwordConfirm) {
  if (!passwordConfirm) return { type: 'required', message: '비밀번호를 한 번 더 입력해주세요.' };
  if (password !== passwordConfirm) return { type: 'mismatch', message: '비밀번호가 일치하지 않습니다.' };
  return { type: 'valid', message: '' };
}
