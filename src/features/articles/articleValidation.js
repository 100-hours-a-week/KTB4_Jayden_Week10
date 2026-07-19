export function parseArticleId(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const articleId = Number(value);
  return Number.isSafeInteger(articleId) && articleId > 0 ? articleId : null;
}
