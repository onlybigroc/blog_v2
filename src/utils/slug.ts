type PostLike = {
  id: string;
  data?: {
    slug?: string;
  };
};

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function normalizePostSlug(value: string): string {
  return value
    .trim()
    .replace(/^\/?posts\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/^\/+|\/+$/g, '');
}

export function getPostUrl(postOrId: string | PostLike): string {
  if (typeof postOrId === 'string') {
    return normalizePostSlug(postOrId);
  }

  return normalizePostSlug(postOrId.data?.slug || postOrId.id);
}

export function getPostPath(postOrId: string | PostLike): string {
  return `/posts/${getPostUrl(postOrId)}`;
}

export function getExternalOriginUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

export function encodePathSegment(value: string): string {
  return encodeURIComponent(value);
}

export function getTagUrl(tag: string): string {
  return `/tags/${encodePathSegment(tag)}`;
}

export function getCategoryUrl(category: string): string {
  return `/categories/${encodePathSegment(category)}`;
}
