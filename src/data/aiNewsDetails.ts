import aiNewsDetails from './ai-news-details.json';
import { getAiNewsById, getAiNewsItems, type AINewsItem } from './aiNews';

type AINewsDetailMap = Record<string, { originalContentText?: string }>;

const details = aiNewsDetails as AINewsDetailMap;

function withDetails(item: AINewsItem): AINewsItem {
  const originalContentText = item.originalContentText || details[item.id]?.originalContentText || '';

  return {
    ...item,
    originalContentText,
    originalContentAvailable: item.originalContentAvailable ?? Boolean(originalContentText),
  };
}

export function getAiNewsDetailItems(): AINewsItem[] {
  return getAiNewsItems().map((item) => withDetails(item));
}

export function getAiNewsDetailById(id: string): AINewsItem | undefined {
  const item = getAiNewsById(id);
  return item ? withDetails(item) : undefined;
}
