export const SECTION_OPTIONS = [
  { label: '首页 Home', value: 'home' },
  { label: 'Aletheia / Infra', value: 'aletheia-infra' },
  { label: 'Coding / Tools', value: 'coding-tools' },
  { label: 'Guides / Docs', value: 'guides-docs' },
  { label: 'Visual / Cos / Craft', value: 'visual-cos-craft' },
  { label: 'About', value: 'about' },
] as const

export type SectionValue = (typeof SECTION_OPTIONS)[number]['value']

export const SECTION_META: Record<SectionValue, { title: string; description: string; heading: string }> = {
  home: {
    title: 'Home',
    description: '首页内容聚合',
    heading: 'Home',
  },
  'aletheia-infra': {
    title: 'Aletheia / Infra',
    description: '基础设施、工程实践与系统思考',
    heading: 'Aletheia / Infra',
  },
  'coding-tools': {
    title: 'Coding / Tools',
    description: '编码实践、工具链与效率方案',
    heading: 'Coding / Tools',
  },
  'guides-docs': {
    title: 'Guides / Docs',
    description: '教程、文档与知识整理',
    heading: 'Guides / Docs',
  },
  'visual-cos-craft': {
    title: 'Visual / Cos / Craft',
    description: '视觉、摄影、Cos 与手作',
    heading: 'Visual / Cos / Craft',
  },
  about: {
    title: 'About',
    description: '碎碎念、随笔与个人说明',
    heading: 'About',
  },
}
