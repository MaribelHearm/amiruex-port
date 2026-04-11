export type ToolStatus = 'available' | 'developing' | 'construction'
export type ToolCategory = 'fun' | 'tech' | 'utility'

export type ToolItem = {
  slug: string
  title: string
  summary: string
  category: ToolCategory
  status: ToolStatus
  tags: string[]
  mvpScope: string
}

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  available: '可用',
  developing: '开发中',
  construction: '施工中',
}

export const TOOL_CATEGORY_LABEL: Record<ToolCategory, string> = {
  fun: '有趣互动',
  tech: '技术效率',
  utility: '自用工具',
}

export const TOOL_ITEMS: ToolItem[] = [
  {
    slug: 'profile-card-generator',
    title: '个人资料卡生成器',
    summary: '输入昵称、技能与一句话介绍，实时生成可复制的个人资料卡。',
    category: 'fun',
    status: 'available',
    tags: ['MVP', '可交互', '首批工具'],
    mvpScope: '支持实时预览 + 一键复制为 Markdown。',
  },
  {
    slug: 'prompt-polisher',
    title: 'Prompt 文本整理器',
    summary: '把零散需求整理为结构化 Prompt 模板，提升与 LLM 协作效率。',
    category: 'tech',
    status: 'available',
    tags: ['MVP', 'LLM', '效率'],
    mvpScope: '支持角色、背景、任务、格式四段式结构化生成。',
  },
  {
    slug: 'bilibili-audio-transcriber',
    title: 'Bilibili 音频转文字',
    summary: '支持 B 站链接与本地音频上传，异步转写并可复制全文，支持任务 ID 找回。',
    category: 'tech',
    status: 'available',
    tags: ['MVP', 'ASR', '任务制'],
    mvpScope: '10 分钟内音频转写 + 进度条 + 任务 ID 查询恢复。',
  },
  {
    slug: 'exchange-rate-calculator',
    title: '汇率计算器',
    summary: '输入金额并选择币种，快速完成多币种换算，适合出海和跨境场景。',
    category: 'utility',
    status: 'available',
    tags: ['MVP', '金融工具', '效率'],
    mvpScope: '支持常见货币互转、币种交换与结果快速复制。',
  },
  {
    slug: 'personality-quiz-lite',
    title: '人格特质小测试',
    summary: '轻量题目评估你的偏好风格，产出可分享的人格卡。',
    category: 'fun',
    status: 'construction',
    tags: ['施工中', '问答互动'],
    mvpScope: '先完成题库结构与结果页骨架。',
  },
]

export const getToolBySlug = (slug: string): ToolItem | undefined => {
  return TOOL_ITEMS.find((item) => item.slug === slug)
}
