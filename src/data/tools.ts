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
  {
    id: 'json-csv',
    name: 'JSON 转 CSV',
    description: 'JSON 与 CSV 互转，支持嵌套对象展平和自定义分隔符。',
    path: '/tools/json-csv',
    icon: 'ArrowRightLeft',
    status: 'ready',
  },
  {
    id: 'word-count',
    name: '文字计数',
    description: '实时统计字数、字符数、行数、段落，支持中英文混合。',
    path: '/tools/word-count',
    icon: 'Type',
    status: 'ready',
  },
  {
    id: 'text-diff',
    name: '文本差异对比',
    description: '逐行对比两段文本，高亮显示差异。',
    path: '/tools/text-diff',
    icon: 'GitCompare',
    status: 'ready',
  },
  {
    id: 'markdown-preview',
    name: 'Markdown 预览',
    description: '实时预览 Markdown，支持常见语法和代码高亮。',
    path: '/tools/markdown-preview',
    icon: 'Eye',
    status: 'ready',
  },
  {
    id: 'csv-viewer',
    name: 'CSV 查看器',
    description: '解析 CSV 数据，以表格形式展示，支持排序和筛选。',
    path: '/tools/csv-viewer',
    icon: 'Table',
    status: 'ready',
  },
  {
    id: 'uuid',
    name: 'UUID 生成器',
    description: '生成 UUID v4，支持批量生成和格式自定义。',
    path: '/tools/uuid',
    icon: 'Fingerprint',
    status: 'ready',
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum 生成器',
    description: '生成 Lorem Ipsum 占位文本，支持段落、句子、单词模式。',
    path: '/tools/lorem-ipsum',
    icon: 'Pilcrow',
    status: 'ready',
  },
  {
    id: 'url-encode',
    name: 'URL 编解码',
    description: 'URL 编码解码，支持 encodeURI 和 encodeURIComponent 模式。',
    path: '/tools/url-encode',
    icon: 'Link',
    status: 'ready',
  },
  {
    id: 'html-entity',
    name: 'HTML 实体编解码',
    description: 'HTML 实体编码解码，支持命名实体和数字实体。',
    path: '/tools/html-entity',
    icon: 'Code',
    status: 'ready',
  },
  {
    id: 'text-reverse',
    name: '文本反转',
    description: '文本反转工具，支持按字符、行、单词多种反转模式。',
    path: '/tools/text-reverse',
    icon: 'RotateCcw',
    status: 'ready',
  },
];
