import { describe, it, expect } from 'vitest';
import { normalizePostSlug, normalizePath, getPostUrl, getPostPath, getTagUrl, getCategoryUrl } from '../slug';

describe('normalizePostSlug', () => {
  it('removes leading/trailing slashes', () => {
    expect(normalizePostSlug('/test-slug/')).toBe('test-slug');
  });

  it('removes posts/ prefix', () => {
    expect(normalizePostSlug('posts/test-slug')).toBe('test-slug');
  });

  it('removes .md extension', () => {
    expect(normalizePostSlug('test-slug.md')).toBe('test-slug');
  });

  it('removes .mdx extension', () => {
    expect(normalizePostSlug('test-slug.mdx')).toBe('test-slug');
  });

  it('trims whitespace', () => {
    expect(normalizePostSlug('  test-slug  ')).toBe('test-slug');
  });
});

describe('normalizePath', () => {
  it('removes trailing slashes', () => {
    expect(normalizePath('/posts/test/')).toBe('/posts/test');
  });

  it('returns / for root', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('returns / for empty string after trimming', () => {
    expect(normalizePath('')).toBe('/');
  });
});

describe('getPostUrl', () => {
  it('handles string input', () => {
    expect(getPostUrl('posts/test-slug.md')).toBe('test-slug');
  });

  it('handles PostLike input', () => {
    const post = { id: 'test-id', data: { slug: 'custom-slug' } };
    expect(getPostUrl(post)).toBe('custom-slug');
  });

  it('falls back to id when no slug', () => {
    const post = { id: 'test-id' };
    expect(getPostUrl(post)).toBe('test-id');
  });
});

describe('getPostPath', () => {
  it('returns full path', () => {
    expect(getPostPath('test-slug')).toBe('/posts/test-slug');
  });
});

describe('getTagUrl', () => {
  it('encodes tag', () => {
    expect(getTagUrl('JavaScript')).toBe('/tags/JavaScript');
  });

  it('encodes special characters', () => {
    expect(getTagUrl('C++')).toBe('/tags/C%2B%2B');
  });
});

describe('getCategoryUrl', () => {
  it('encodes category', () => {
    expect(getCategoryUrl('技术')).toBe('/categories/%E6%8A%80%E6%9C%AF');
  });
});
