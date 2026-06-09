const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function normalizeSafeUrl(value: string): string {
  const rawUrl = value.trim().replace(/&amp;/g, '&');

  if (!rawUrl) {
    return '#';
  }

  if (rawUrl.startsWith('//')) {
    return '#';
  }

  if (rawUrl.startsWith('#') || rawUrl.startsWith('/') || rawUrl.startsWith('./') || rawUrl.startsWith('../')) {
    return escapeHtmlAttribute(rawUrl);
  }

  try {
    const url = new URL(rawUrl);
    return SAFE_URL_PROTOCOLS.has(url.protocol) ? escapeHtmlAttribute(rawUrl) : '#';
  } catch {
    return '#';
  }
}
