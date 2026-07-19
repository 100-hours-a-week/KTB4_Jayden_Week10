export function formatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return '0';
  return count >= 1000 ? `${Math.floor(count / 1000)}k` : String(count);
}

export function formatArticleDate(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 19);
}
