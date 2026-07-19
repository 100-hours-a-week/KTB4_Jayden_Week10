export const NICKNAME_PATTERN = /^[ㄱ-ㅎ가-힣a-zA-Z0-9_-]{2,10}$/;

export function validateNickname(value) {
  if (!value) return '닉네임을 입력해주세요.';
  if (/\s/.test(value)) return '닉네임에는 공백을 사용할 수 없습니다.';
  if (value.length > 10) return '닉네임은 최대 10자까지 작성 가능합니다.';
  if (!NICKNAME_PATTERN.test(value)) return '닉네임은 한글·영문·숫자·밑줄·하이픈으로 2~10자여야 합니다.';
  return '';
}
