export type ToolStatus = 'ready' | 'draft';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  status?: ToolStatus;
}

// 统一维护工具入口。后续迁移新工具时，在这里追加一条记录即可。
export const tools: ToolItem[] = [
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: '支持秒/毫秒时间戳与日期时间双向转换，含当前时间戳快捷复制。',
    path: '/tools/timestamp',
    icon: 'Clock',
    status: 'ready',
  },
  {
    id: 'roll-call',
    name: '课堂点名',
    description: '导入 Excel 或粘贴名单后随机点名，支持本轮不重复、课堂反馈和自定义表扬鼓励语。',
    path: '/tools/roll-call',
    icon: 'Users',
    status: 'ready',
  },
  {
    id: 'winter-troops',
    name: '无尽冬日出兵计算器',
    description: '按盾、矛、射比例计算出兵数量，支持 118/127、自定义比例、多队列和带兵上限。',
    path: '/tools/winter-troops',
    icon: 'Swords',
    status: 'ready',
  },
  {
    id: 'json-format',
    name: 'JSON 格式化',
    description: 'JSON 格式化、压缩、语法校验，支持自定义缩进。',
    path: '/tools/json-format',
    icon: 'Braces',
    status: 'ready',
  },
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: 'Base64 编码解码，支持 UTF-8 和 URL 安全模式。',
    path: '/tools/base64',
    icon: 'Lock',
    status: 'ready',
  },
  {
    id: 'color',
    name: '颜色转换器',
    description: 'HEX / RGB / HSL 颜色格式互转，含色板和随机颜色。',
    path: '/tools/color',
    icon: 'Palette',
    status: 'ready',
  },
  {
    id: 'password',
    name: '密码生成器',
    description: '安全随机密码生成，支持自定义字符、长度和批量生成。',
    path: '/tools/password',
    icon: 'KeyRound',
    status: 'ready',
  },
  {
    id: 'regex',
    name: '正则表达式测试',
    description: '实时高亮匹配，支持常用正则预设。',
    path: '/tools/regex',
    icon: 'Search',
    status: 'ready',
  },
];
