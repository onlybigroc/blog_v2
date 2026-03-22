export function getPostUrl(id: string): string {
  return id.replace(/\.md$/, '');
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
