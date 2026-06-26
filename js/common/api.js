export async function requestJson(path, { method = 'GET', query, body, headers = {} } = {}) {
  const base = document.body.dataset.apiBase || window.location.origin;
  const url = new URL(path, base);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method,
    headers: { Accept: 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
