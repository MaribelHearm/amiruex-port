export type ExtensionModuleStatus = 'available' | 'mvp' | 'construction'

export type ExtensionModule = {
  slug: string
  title: string
  description: string
  status: ExtensionModuleStatus
  needed: boolean
  whyNeeded: string
  entry: 'home' | 'secondary' | 'home+secondary'
  href?: string
}

export const EXTENSION_MODULE_STATUS_LABEL: Record<ExtensionModuleStatus, string> = {
  available: '可用',
  mvp: 'MVP',
  construction: '施工中',
}

export const EXTENSION_MODULES: ExtensionModule[] = [
  {
    slug: 'visual-gallery',
    title: 'Visual / Gallery',
    description: '承接视觉与图像内容，支持轻量展示与持续补充。',
    status: 'available',
    needed: true,
    whyNeeded: '视觉内容已存在发布意图，需稳定入口承接访问。',
    entry: 'home+secondary',
    href: '/visual-cos-craft',
  },
  {
    slug: 'wandering-fragments',
    title: 'Wandering / 碎片区',
    description: '短随笔、日常观察、低门槛更新内容。',
    status: 'mvp',
    needed: true,
    whyNeeded: '可降低发布阻力，保持站点持续更新节奏。',
    entry: 'home+secondary',
    href: '/wandering',
  },
  {
    slug: 'collection-showcase',
    title: '收藏 / 图鉴 / 展柜',
    description: '整理偏好清单与长期参考资源。',
    status: 'construction',
    needed: true,
    whyNeeded: '中长期价值高，但短期内容沉淀不足，先占位。',
    entry: 'secondary',
  },
  {
    slug: 'experimental-pages',
    title: '实验性页面',
    description: '承载原型试验与不稳定功能，隔离主站风险。',
    status: 'construction',
    needed: true,
    whyNeeded: '需要试验场，但必须与主结构解耦。',
    entry: 'secondary',
  },
  {
    slug: 'more-interactive-tools',
    title: '更多互动工具',
    description: '逐步扩展工具可玩性与实用能力。',
    status: 'construction',
    needed: false,
    whyNeeded: '现阶段已有工具 MVP，优先级低于内容连续性。',
    entry: 'secondary',
  },
  {
    slug: 'private-space-placeholder',
    title: '私密内容占位页',
    description: '预留会员/权限内容入口，当前仅保留占位。',
    status: 'construction',
    needed: false,
    whyNeeded: '权限体系尚未纳入当前主线，先避免过早复杂化。',
    entry: 'secondary',
  },
]
