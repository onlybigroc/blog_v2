export function getPostUrl(id: string): string {
  return id.replace(/\.md$/, '');
}
