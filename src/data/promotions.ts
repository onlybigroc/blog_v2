export type PromotionStatus = 'ready' | 'draft' | 'hidden';

export interface PromotionItem {
  id: string;
  name: string;
  description: string;
  path: string;
  status?: PromotionStatus;
  external?: boolean;
}

// 统一维护推广入口。后续新增推广页面时，在这里追加一条记录即可。
export const promotions: PromotionItem[] = [
  {
    id: 'chatgpt-auto-recharge',
    name: 'ChatGPT全自动充值系统',
    description: '围绕 ChatGPT 使用场景的一站式充值与账号开通入口，适合需要稳定使用 AI 工具的用户。',
    path: '/promotions/chatgpt-auto-recharge',
    status: 'hidden',
  },
];
