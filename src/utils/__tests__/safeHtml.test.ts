import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlAttribute, normalizeSafeUrl } from '../safeHtml';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes less than', () => {
    expect(escapeHtml('a<b')).toBe('a&lt;b');
  });

  it('escapes greater than', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("a'b")).toBe('a&#39;b');
  });

  it('escapes multiple characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});

describe('escapeHtmlAttribute', () => {
  it('escapes backticks', () => {
    expect(escapeHtmlAttribute('a`b')).toBe('a&#96;b');
  });

  it('escapes all HTML characters', () => {
    expect(escapeHtmlAttribute('<a href="test">')).toBe('&lt;a href=&quot;test&quot;&gt;');
  });
});

describe('normalizeSafeUrl', () => {
  it('returns # for empty string', () => {
    expect(normalizeSafeUrl('')).toBe('#');
  });

  it('returns # for protocol-relative URLs', () => {
    expect(normalizeSafeUrl('//evil.com')).toBe('#');
  });

  it('allows http URLs', () => {
    expect(normalizeSafeUrl('http://example.com')).toBe('http://example.com');
  });

  it('allows https URLs', () => {
    expect(normalizeSafeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns # for javascript URLs', () => {
    expect(normalizeSafeUrl('javascript:alert(1)')).toBe('#');
  });

  it('allows relative paths', () => {
    expect(normalizeSafeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('allows hash links', () => {
    expect(normalizeSafeUrl('#section')).toBe('#section');
  });
});
