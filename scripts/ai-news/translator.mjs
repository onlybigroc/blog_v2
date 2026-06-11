// AI News 翻译模块
import { CONFIG } from './config.mjs';
import { sleep, normalizeWhitespace, containsChinese } from './utils.mjs';

const translationCache = new Map();

export async function translateTextToChinese(text) {
  if (!CONFIG.TRANSLATION_ENABLED) return '';
  
  const normalized = normalizeWhitespace(text);
  if (!normalized || containsChinese(normalized)) return '';
  if (normalized.length < 10) return '';

  const cacheKey = normalized.slice(0, 200);
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

  try {
    const params = new URLSearchParams({
      q: normalized.slice(0, 500),
      langpair: 'en|zh-CN',
    });

    const response = await fetch(`${CONFIG.TRANSLATION_BASE_URL}?${params}`, {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      translationCache.set(cacheKey, '');
      return '';
    }

    const data = await response.json();
    const translated = data?.responseData?.translatedText || '';
    
    if (translated && translated !== normalized && !translated.includes('MYMEMORY WARNING')) {
      translationCache.set(cacheKey, translated);
      return translated;
    }

    translationCache.set(cacheKey, '');
    return '';
  } catch {
    translationCache.set(cacheKey, '');
    return '';
  }
}

export async function enrichBilingualFields(item) {
  if (!CONFIG.TRANSLATION_ENABLED) return item;

  const enriched = { ...item };

  if (item.title && !containsChinese(item.title)) {
    await sleep(CONFIG.TRANSLATION_DELAY_MS);
    const translated = await translateTextToChinese(item.title);
    if (translated) enriched.titleCn = translated;
  }

  if (item.summary && !containsChinese(item.summary)) {
    await sleep(CONFIG.TRANSLATION_DELAY_MS);
    const translated = await translateTextToChinese(item.summary);
    if (translated) enriched.summaryCn = translated;
  }

  return enriched;
}
