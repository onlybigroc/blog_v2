export const SITE_NAME = 'Bigroc';
export const SITE_TITLE_SUFFIX = 'Bigroc';
export const SITE_DESCRIPTION =
  '个人技术博客，分享编程、开发和技术经验，涵盖 Java、JavaScript、Go、Docker、数据库等领域。原创技术文章，持续更新。';
export const SITE_KEYWORDS =
  '技术博客,编程,开发,Java,JavaScript,Go,Docker,数据库,前端,后端,Spring Boot,Vue,React,Astro,PostgreSQL,MySQL,算法,数据结构,软件设计';
export const SITE_TWITTER_HANDLE = '@bigroc';
export const SITE_OG_IMAGE_ALT = 'Bigroc 技术博客默认分享卡片';
export const DEFAULT_SOCIAL_IMAGE = '/og-image.svg';

const LEGACY_TITLE_SUFFIX_PATTERN =
  /\s*\|\s*(?:个人技术博客(?:\s*[-|]?\s*bigroc)?|bigroc)\s*$/i;

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
