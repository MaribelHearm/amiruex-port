import type { ElementContent, Root } from 'hast'
import type { Parent, Root as MdastRoot, RootContent } from 'mdast'
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype, { type Options as RemarkRehypeOptions } from 'remark-rehype'
import type { Plugin } from 'unified'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

export type WriterMarkdownRenderResult = {
  html: string
}

type ForumBlockKind = 'details' | 'fade' | 'grid' | 'spoiler'

type ForumBlockNode = Parent & {
  type: 'forumBlock'
  kind: ForumBlockKind
  title?: string
  children: RootContent[]
}

type ForumSpoilerInlineNode = {
  type: 'forumSpoilerInline'
  value: string
}

type ForumImageInfo = {
  alt: string
  src: string
  title?: string | null
}

type ForumOpeningBoundary = {
  kind: ForumBlockKind
  title?: string
  type: 'open'
}

type ForumClosingBoundary = {
  kind: ForumBlockKind
  type: 'close'
}

type ForumBoundary = ForumOpeningBoundary | ForumClosingBoundary

const forumBlockTags = ['details', 'spoiler', 'fade', 'grid'] as const

function isForumBlockTag(value: string): value is ForumBlockKind {
  return forumBlockTags.includes(value as ForumBlockKind)
}

function collectParagraphImage(paragraph: RootContent): ForumImageInfo | null {
  if (paragraph.type !== 'paragraph') return null

  const image = paragraph.children.find((child) => child.type === 'image')
  if (!image || image.type !== 'image') return null

  const hasOnlyImageAndWhitespace = paragraph.children.every((child) => {
    if (child.type === 'image') return child === image
    return child.type === 'text' && !child.value.trim()
  })

  if (!hasOnlyImageAndWhitespace) return null

  return {
    alt: image.alt ?? '',
    src: image.url,
    title: image.title,
  }
}

function parseOpeningForumTag(value: string): { kind: ForumBlockKind; title?: string } | null {
  const match = value.match(/^\s*\\*\[(details|spoiler|fade|grid)(?:=("([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\]\r\n]+)))?\]\s*$/i)
  if (!match) return null

  const kind = match[1].toLowerCase()
  if (!isForumBlockTag(kind)) return null

  const rawTitle = match[3] ?? match[4] ?? match[5]
  const title = typeof rawTitle === 'string' ? rawTitle.replace(/\\(["'])/g, '$1').trim() : undefined
  return { kind, title: title || undefined }
}

function parseClosingForumTag(value: string): ForumBlockKind | null {
  const match = value.match(/^\s*\\*\[\/(details|spoiler|fade|grid)\]\s*$/i)
  if (!match) return null
  const kind = match[1].toLowerCase()
  return isForumBlockTag(kind) ? kind : null
}

function normalizeForumBlockBoundaries(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const output: string[] = []

  lines.forEach((line, index) => {
    const isBoundary = Boolean(parseOpeningForumTag(line) || parseClosingForumTag(line))

    if (isBoundary && output.length > 0 && output[output.length - 1]?.trim()) {
      output.push('')
    }

    output.push(line)

    const nextLine = lines[index + 1]
    if (isBoundary && typeof nextLine === 'string' && nextLine.trim()) {
      output.push('')
    }
  })

  return output.join('\n').replace(/\n{3,}/g, '\n\n')
}

function unwrapSingleTextParagraph(node: RootContent): string | null {
  if (node.type === 'paragraph' && node.children.length === 1 && node.children[0]?.type === 'text') {
    return node.children[0].value
  }
  return null
}

function getForumBoundary(node: RootContent): ForumBoundary | null {
  const text = unwrapSingleTextParagraph(node)
  if (!text) return null

  const opening = parseOpeningForumTag(text)
  if (opening) return { type: 'open', ...opening }

  const closing = parseClosingForumTag(text)
  if (closing) return { type: 'close', kind: closing }

  return null
}

function transformForumBlocks(children: RootContent[]): RootContent[] {
  const boundaries = new Map<number, ForumBoundary>()
  const pairs = new Map<number, number>()
  const stack: Array<{ index: number; kind: ForumBlockKind }> = []

  children.forEach((node, index) => {
    const boundary = getForumBoundary(node)
    if (!boundary) return

    boundaries.set(index, boundary)

    if (boundary.type === 'open') {
      stack.push({ index, kind: boundary.kind })
      return
    }

    const opener = stack[stack.length - 1]
    if (opener?.kind !== boundary.kind) {
      // A crossed or stray closing tag is plain Markdown text. Do not close a
      // lower stack frame through a still-open different forum block, otherwise
      // content would be swallowed into the wrong block.
      return
    }

    pairs.set(opener.index, index)
    stack.pop()
  })

  const output: RootContent[] = []

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index]
    const boundary = boundaries.get(index)
    const closingIndex = pairs.get(index)

    if (boundary?.type !== 'open' || typeof closingIndex !== 'number') {
      output.push(node)
      continue
    }

    output.push({
      type: 'forumBlock',
      kind: boundary.kind,
      title: boundary.title,
      children: transformForumBlocks(children.slice(index + 1, closingIndex)),
    } as ForumBlockNode as RootContent)
    index = closingIndex
  }

  return output
}

function transformInlineSpoilersInParent(parent: Parent) {
  const transformed: unknown[] = []

  for (const child of parent.children) {
    if (child.type !== 'text') {
      transformed.push(child)
      continue
    }

    const text = child.value
    const pieces: Array<typeof child | ForumSpoilerInlineNode> = []
    const pattern = /\[spoiler\]([\s\S]+?)\[\/spoiler\]/gi
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text))) {
      if (match.index > lastIndex) pieces.push({ type: 'text', value: text.slice(lastIndex, match.index) })
      pieces.push({ type: 'forumSpoilerInline', value: match[1] ?? '' })
      lastIndex = pattern.lastIndex
    }

    if (lastIndex === 0) {
      transformed.push(child)
      continue
    }

    if (lastIndex < text.length) pieces.push({ type: 'text', value: text.slice(lastIndex) })
    transformed.push(...pieces)
  }

  parent.children = transformed as Parent['children']
}

const remarkForumBlocks: Plugin<[], MdastRoot> = () => (tree) => {
  tree.children = transformForumBlocks(tree.children)

  visit(tree, (node) => {
    if ('children' in node && Array.isArray(node.children)) {
      transformInlineSpoilersInParent(node as Parent)
    }
  })
}

const forumRehypeOptions = {
  allowDangerousHtml: false,
  handlers: {
  forumBlock(_state: unknown, node: ForumBlockNode): ElementContent {
    const children = mdastChildrenToHast(node.children)

    if (node.kind === 'details') {
      return {
        type: 'element',
        tagName: 'details',
        properties: { className: ['forum-details'] },
        children: [
          {
            type: 'element',
            tagName: 'summary',
            properties: { className: ['forum-details__summary'] },
            children: [{ type: 'text', value: node.title || '展开内容' }],
          },
          { type: 'element', tagName: 'div', properties: { className: ['forum-details__body'] }, children },
        ],
      }
    }

    if (node.kind === 'fade') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['forum-fade'], dataExpanded: 'false' },
        children: [
          ...(node.title
            ? [
                {
                  type: 'element' as const,
                  tagName: 'div',
                  properties: { className: ['forum-fade__title'] },
                  children: [{ type: 'text' as const, value: node.title }],
                },
              ]
            : []),
          { type: 'element', tagName: 'div', properties: { className: ['forum-fade__content'] }, children },
          {
            type: 'element',
            tagName: 'button',
            properties: { className: ['forum-fade__toggle'], type: 'button' },
            children: [{ type: 'text', value: '展开全文' }],
          },
        ],
      }
    }

    if (node.kind === 'grid') {
      const images = node.children.map(collectParagraphImage).filter((image): image is ForumImageInfo => Boolean(image))

      if (images.length > 0) {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['forum-grid'], dataForumGrid: 'true' },
          children: images.map((image, index) => ({
            type: 'element',
            tagName: 'figure',
            properties: { className: ['forum-grid__item'] },
            children: [
              {
                type: 'element',
                tagName: 'img',
                properties: {
                  alt: image.alt,
                  className: ['forum-grid__image'],
                  dataCaption: image.title || image.alt,
                  dataIndex: String(index),
                  decoding: 'async',
                  loading: 'lazy',
                  src: image.src,
                  title: image.title || undefined,
                },
                children: [],
              },
              ...(image.title
                ? [
                    {
                      type: 'element' as const,
                      tagName: 'figcaption',
                      properties: { className: ['forum-grid__caption'] },
                      children: [{ type: 'text' as const, value: image.title }],
                    },
                  ]
                : []),
            ],
          })),
        }
      }

      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['forum-grid'], dataForumGrid: 'true' },
        children,
      }
    }

    return {
      type: 'element',
      tagName: 'div',
      properties: { className: ['forum-spoiler'], dataRevealed: 'false', role: 'button', tabIndex: 0 },
      children: [
        { type: 'element', tagName: 'div', properties: { className: ['forum-spoiler__content'] }, children },
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['forum-spoiler__hint'] },
          children: [{ type: 'text', value: '点击显示隐藏内容' }],
        },
      ],
    }
  },
  forumSpoilerInline(_state: unknown, node: ForumSpoilerInlineNode): ElementContent {
    return {
      type: 'element',
      tagName: 'span',
      properties: { className: ['forum-spoiler', 'forum-spoiler--inline'], dataRevealed: 'false', role: 'button', tabIndex: 0 },
      children: [
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['forum-spoiler__content'] },
          children: [{ type: 'text', value: node.value }],
        },
      ],
    }
  },
  },
} as unknown as RemarkRehypeOptions

function mdastChildrenToHast(children: RootContent[]): ElementContent[] {
  const result = unified()
    .use(remarkRehype, forumRehypeOptions)
    .runSync({ type: 'root', children } as MdastRoot) as Root

  return result.children as ElementContent[]
}

const writerSanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'details', 'summary', 'figure', 'figcaption', 'button'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), ['className', /^forum-/], 'data-revealed', 'data-expanded', 'dataRevealed', 'dataExpanded'],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      'title',
      ['target', '_blank'],
      ['rel', 'nofollow', 'noopener', 'noreferrer'],
    ],
    button: [['className', /^forum-/], ['type', 'button']],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-/]],
    details: [['className', /^forum-/], 'open'],
    div: [...(defaultSchema.attributes?.div ?? []), ['className', /^forum-/], 'data-expanded', 'data-forum-grid', 'data-revealed', 'dataExpanded', 'dataForumGrid', 'dataRevealed', 'role', 'tabIndex'],
    figcaption: [...(defaultSchema.attributes?.figcaption ?? []), ['className', /^forum-/]],
    figure: [...(defaultSchema.attributes?.figure ?? []), ['className', /^forum-/]],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'alt',
      'decoding',
      'height',
      'loading',
      'title',
      'width',
      ['className', /^forum-/],
      'data-caption',
      'data-index',
      'dataCaption',
      'dataIndex',
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      ['checked', true],
      ['disabled', true],
      ['type', 'checkbox'],
    ],
    li: [...(defaultSchema.attributes?.li ?? []), ['className', 'task-list-item']],
    span: [...(defaultSchema.attributes?.span ?? []), ['className', /^forum-/], 'data-revealed', 'dataRevealed', 'role', 'tabIndex'],
    summary: [...(defaultSchema.attributes?.summary ?? []), ['className', /^forum-/]],
    ul: [...(defaultSchema.attributes?.ul ?? []), ['className', 'contains-task-list']],
  },
  clobberPrefix: 'writer-md-',
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', 'tel'],
    src: ['http', 'https'],
  },
  required: {
    ...defaultSchema.required,
    input: {
      disabled: true,
      type: 'checkbox',
    },
  },
  strip: [...(defaultSchema.strip ?? []), 'script', 'style'],
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkForumBlocks)
  .use(remarkRehype, forumRehypeOptions)
  .use(rehypeSanitize, writerSanitizeSchema)
  .use(rehypeStringify)

export async function markdownToSafeHtml(markdown: string | null | undefined): Promise<string> {
  if (!markdown) return ''

  const result = await markdownProcessor.process(normalizeForumBlockBoundaries(markdown))
  return String(result).trim()
}

export async function renderWriterMarkdown(markdown: string): Promise<WriterMarkdownRenderResult> {
  return { html: await markdownToSafeHtml(markdown) }
}

export const writerForumMarkdownExamples = {
  details: '[details="补充说明"]\n这里写可折叠内容。\n[/details]',
  fade: '[fade="长内容"]\n这里写较长内容，默认会渐隐收起。\n[/fade]',
  grid: '[grid]\n![图片 1](/media/example-1.webp)\n\n![图片 2](/media/example-2.webp)\n[/grid]',
  nested:
    '[details="总示例"]\n外层说明。\n\n[fade="展开多图剧透"]\n渐隐块开头。\n\n[spoiler]\n这里是剧透说明。\n\n[grid]\n![图片 1](/media/example-1.webp "第一张")\n\n![图片 2](/media/example-2.webp "第二张")\n[/grid]\n[/spoiler]\n[/fade]\n[/details]',
  spoiler: '[spoiler]\n这里写剧透或隐藏内容。\n[/spoiler]',
}
