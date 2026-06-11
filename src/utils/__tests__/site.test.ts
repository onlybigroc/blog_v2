import { describe, it, expect } from 'vitest';
import { withBrandSuffix, getMetaDescription, calculateReadingTime, calculateWordCount, formatChineseDate } from '../site';

describe('withBrandSuffix', () => {
  it('adds brand suffix to title', () => {
    expect(withBrandSuffix('Hello')).toBe('Hello | 大鹏的Log');
  });

  it('returns site name for empty title', () => {
    expect(withBrandSuffix('')).toBe('大鹏的Log');
  });

  it('removes legacy suffix before adding new one', () => {
    expect(withBrandSuffix('Hello | 个人技术博客')).toBe('Hello | 大鹏的Log');
  });
});

describe('getMetaDescription', () => {
  it('returns provided description', () => {
    expect(getMetaDescription('Test description')).toBe('Test description');
  });

  it('returns default description for empty input', () => {
    expect(getMetaDescription('')).toContain('大鹏的Log');
  });

  it('returns default description for null', () => {
    expect(getMetaDescription(null)).toContain('大鹏的Log');
  });
});

describe('calculateReadingTime', () => {
  it('returns 0 for empty content', () => {
    expect(calculateReadingTime('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(calculateReadingTime(null)).toBe(0);
  });

  it('calculates reading time for Chinese text', () => {
    const text = '字'.repeat(300); // 300 chars = 1 minute
    expect(calculateReadingTime(text)).toBe(1);
  });

  it('calculates reading time for English text', () => {
    const text = 'word '.repeat(200); // 200 words = 1 minute
    expect(calculateReadingTime(text)).toBe(1);
  });
});

describe('calculateWordCount', () => {
  it('returns 0 for empty content', () => {
    expect(calculateWordCount('')).toBe(0);
  });

  it('counts Chinese characters', () => {
    expect(calculateWordCount('你好世界')).toBe(4);
  });

  it('counts English words', () => {
    expect(calculateWordCount('hello world')).toBe(2);
  });

  it('counts numbers', () => {
    expect(calculateWordCount('123 456')).toBe(2);
  });
});

describe('formatChineseDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2026-06-11');
    const formatted = formatChineseDate(date);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('6');
    expect(formatted).toContain('11');
    expect(formatted).toContain('年');
    expect(formatted).toContain('月');
    expect(formatted).toContain('日');
  });
});
