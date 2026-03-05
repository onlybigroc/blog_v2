export type ToolStatus = 'ready' | 'draft';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  path: string;
  status?: ToolStatus;
}

// 统一维护工具入口。后续迁移新工具时，在这里追加一条记录即可。
export const tools: ToolItem[] = [
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: '支持秒/毫秒时间戳与日期时间双向转换，含当前时间戳快捷复制。',
    path: '/tools/timestamp',
    status: 'ready',
  },
];
