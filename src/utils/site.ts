export const SITE_NAME = '大鹏的 Git Log';
export const SITE_TITLE_SUFFIX = '大鹏的 Git Log';
export const SITE_DESCRIPTION =
  '大鹏的 Git Log，记录正在发生的技术事。涵盖 Java、JavaScript、Go、Docker、数据库等领域，分享编程、开发和技术经验。';
export const SITE_KEYWORDS =
  '大鹏的GitLog,技术博客,编程,开发,Java,JavaScript,Go,Docker,数据库,前端,后端,Spring Boot,Vue,React,Astro,PostgreSQL,MySQL,算法,数据结构,软件设计';
export const SITE_TWITTER_HANDLE = '@bigroc';
export const SITE_OG_IMAGE_ALT = '大鹏的 Git Log - 记录正在发生的技术事';
export const DEFAULT_SOCIAL_IMAGE = '/og-image.svg';

const LEGACY_TITLE_SUFFIX_PATTERN =
  /\s*\|\s*(?:个人技术博客(?:\s*[-|]?\s*bigroc)?|大鹏的 Git Log|Bigroc)\s*$/i;

export function withBrandSuffix(title: string): string {
  const normalizedTitle = title.replace(LEGACY_TITLE_SUFFIX_PATTERN, '').trim();

  return normalizedTitle ? `${normalizedTitle} | ${SITE_TITLE_SUFFIX}` : SITE_NAME;
}

export function getMetaDescription(description?: string | null): string {
  const normalizedDescription = description?.trim();
  return normalizedDescription ? normalizedDescription : SITE_DESCRIPTION;
}

export function resolveAssetPath(path?: string | null): string {
  const normalizedPath = path?.trim();

  if (!normalizedPath) {
    return DEFAULT_SOCIAL_IMAGE;
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
}

export function getSocialImageUrl(image: string | undefined, siteURL: string): string {
  return new URL(resolveAssetPath(image), siteURL).toString();
}

export function getImageMimeType(image?: string | null): string | undefined {
  const resolvedImage = resolveAssetPath(image).toLowerCase();

  if (resolvedImage.endsWith('.png')) {
    return 'image/png';
  }

  if (resolvedImage.endsWith('.jpg') || resolvedImage.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (resolvedImage.endsWith('.webp')) {
    return 'image/webp';
  }

  if (resolvedImage.endsWith('.svg')) {
    return 'image/svg+xml';
  }

  return undefined;
}

export function isArticlePath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return normalizedPath.startsWith('/posts/') && !normalizedPath.startsWith('/posts/page/');
}
