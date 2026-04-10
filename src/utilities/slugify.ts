import { pinyin } from 'pinyin-pro'

/**
 * 将任意标题转换为 URL 安全的 slug。
 * - 中文 → 拼音（无声调，空格分隔）
 * - 英文 / 数字正常保留
 * - 其余特殊字符替换为连字符
 */
export function slugify(input: string): string {
  if (!input) return ''

  // 中文字符转拼音（无声调，字间加空格）
  const converted = pinyin(input, {
    toneType: 'none',
    separator: ' ',
    nonZh: 'consecutive', // 非中文字符原样保留，连续段不拆分
  })

  return converted
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')      // 空格/下划线 → 连字符
    .replace(/[^a-z0-9-]/g, '')   // 去掉其他非法字符
    .replace(/-{2,}/g, '-')       // 合并连续连字符
    .replace(/^-+|-+$/g, '')      // 去掉首尾连字符
}
