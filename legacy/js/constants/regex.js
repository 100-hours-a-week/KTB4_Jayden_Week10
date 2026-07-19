export const REGEX = Object.freeze({
    EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,20}$/,
    NICKNAME_REGEX: /^[ㄱ-ㅎ가-힣a-zA-Z0-9_-]{2,10}$/
});
