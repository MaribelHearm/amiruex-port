'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Ctx } from '@milkdown/kit/ctx'
import { imageSchema } from '@milkdown/kit/preset/commonmark'
import type { Node as ProseMirrorNode } from '@milkdown/kit/prose/model'
import { $view } from '@milkdown/kit/utils'

import { cn } from '@/utilities/ui'

type CrepeMarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

type MilkdownEditorAction = <T>(action: (ctx: Ctx) => T) => T

type CrepeEditor = {
  create: () => Promise<{ action: MilkdownEditorAction }>
  destroy: () => Promise<unknown>
  editor: {
    action: MilkdownEditorAction
    use: (plugins: unknown) => unknown
  }
  getMarkdown: () => string
  on: (
    fn: (api: {
      markdownUpdated: (listener: (_ctx: unknown, markdown: string) => void) => unknown
    }) => void,
  ) => CrepeEditor
}

type UploadStatus = {
  kind: 'idle' | 'uploading' | 'success' | 'error'
  text: string
}

type WriterUploadResponse = {
  alt?: string
  error?: string
  filename?: string
  hash?: string
  id?: string
  reused?: boolean
  url?: string
}

type WriterUploadCacheEntry = {
  alt: string
  filename?: string
  hash: string
  id?: string
  type: string
  updatedAt: string
  url: string
}

const defaultMarkdown = '# 新文章\n\n从这里开始粘贴或撰写 Markdown。'
const uploadCacheKey = 'next-portal.writer.upload-cache.v1'
const maxUploadCacheEntries = 300

const topBarHeadingOptions = [
  { label: '正文', level: null },
  { label: '一级标题', level: 1 },
  { label: '二级标题', level: 2 },
  { label: '三级标题', level: 3 },
  { label: '四级标题', level: 4 },
  { label: '五级标题', level: 5 },
  { label: '六级标题', level: 6 },
]

const slashDescriptions: Record<string, string> = {
  正文: '正文段落',
  正文段落: '正文段落：普通段落文本',
  一级标题: '一级标题：文章主标题',
  '一级标题 H1': '一级标题：文章主标题',
  二级标题: '二级标题：章节标题',
  '二级标题 H2': '二级标题：章节标题',
  三级标题: '三级标题：小节标题',
  '三级标题 H3': '三级标题：小节标题',
  四级标题: '四级标题',
  '四级标题 H4': '四级标题',
  五级标题: '五级标题',
  '五级标题 H5': '五级标题',
  六级标题: '六级标题',
  '六级标题 H6': '六级标题',
  引用: '引用块：突出引用或提示',
  引用块: '引用块：突出引用或提示',
  分割线: '分割线：插入横向分隔',
  无序列表: '无序列表：项目符号列表',
  有序列表: '有序列表：编号列表',
  任务清单: '任务清单：可勾选待办列表',
  图片: '图片：上传或粘贴图片链接',
  '图片上传/链接': '图片：上传或粘贴图片链接',
  代码块: '代码块：带语言选择和复制',
  表格: '表格：插入 3×3 表格',
  公式: '公式：插入 LaTeX 数学公式',
  '公式 LaTeX': '公式：插入 LaTeX 数学公式',
}

const topBarButtonTooltips = [
  '加粗 Ctrl/⌘+B',
  '斜体 Ctrl/⌘+I',
  '删除线',
  '行内代码',
  '无序列表',
  '有序列表',
  '任务清单',
  '插入链接 Ctrl/⌘+K',
  '插入图片',
  '插入表格',
  '代码块',
  '公式块 LaTeX',
  '引用',
  '分割线',
]

const toolbarButtonTooltips = [
  '加粗 Ctrl/⌘+B',
  '斜体 Ctrl/⌘+I',
  '删除线',
  '行内代码',
  '行内公式',
  '插入链接 Ctrl/⌘+K',
]

function formatMarkdownImageSource(node: ProseMirrorNode) {
  const alt = String(node.attrs.alt || '')
  const src = String(node.attrs.src || '')
  const title = String(node.attrs.title || '')
  const escapedTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  return title ? `![${alt}](${src} "${escapedTitle}")` : `![${alt}](${src})`
}

const markdownImageSourceView = $view(imageSchema.node, () => {
  return (initialNode) => {
    let currentNode = initialNode
    const dom = document.createElement('span')
    const code = document.createElement('span')

    dom.className = 'writer-markdown-image-source'
    dom.contentEditable = 'false'
    code.className = 'writer-markdown-image-source__code'
    dom.append(code)

    const render = (node: ProseMirrorNode) => {
      currentNode = node
      const source = formatMarkdownImageSource(node)
      code.textContent = source
      dom.dataset.src = String(node.attrs.src || '')
      dom.setAttribute('title', `编辑区以 Markdown 图片链接显示；右侧预览/前台会渲染图片。\n${source}`)
      dom.setAttribute('aria-label', source)
    }

    render(initialNode)

    return {
      dom,
      update: (updatedNode) => {
        if (updatedNode.type !== currentNode.type) return false
        render(updatedNode)
        return true
      },
      selectNode: () => {
        dom.classList.add('selected')
      },
      deselectNode: () => {
        dom.classList.remove('selected')
      },
    }
  }
})

const classTooltipRules: Array<[string, string]> = [
  ['link-edit-button', '编辑链接'],
  ['link-remove-button', '移除链接'],
  ['link-icon', '复制链接'],
  ['copy-button', '复制代码'],
  ['preview-toggle-button', '切换代码预览/编辑'],
  ['language-button', '选择代码语言'],
  ['add-button', '添加行/列'],
  ['top-bar-heading-button', '选择段落/标题级别'],
]

function setControlTooltip(element: Element, label: string) {
  if (!(element instanceof HTMLElement)) return
  if (!label) return

  element.dataset.writerTooltip = label
  element.setAttribute('title', label)
  element.setAttribute('aria-label', label)
}

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim()
}

function tooltipFromClass(element: Element) {
  if (element.classList.contains('confirm')) {
    if (element.closest('.milkdown-link-edit')) return '确认链接'
    if (element.closest('.milkdown-image-block, .milkdown-image-inline')) return '确认图片链接'
    return '确认'
  }

  for (const [className, label] of classTooltipRules) {
    if (element.classList.contains(className)) return label
  }

  return ''
}

function tooltipForTableButton(button: HTMLButtonElement) {
  const role = button.closest<HTMLElement>('[data-role]')?.dataset.role
  const group = button.closest<HTMLElement>('.button-group')
  const buttons = group ? Array.from(group.querySelectorAll('button')) : []
  const index = buttons.indexOf(button)

  if (role === 'col-drag-handle') {
    return ['左对齐本列', '居中对齐本列', '右对齐本列', '删除列'][index] ?? '表格列操作'
  }

  if (role === 'row-drag-handle') return '删除行'
  if (role === 'x-line-drag-handle') return '添加行'
  if (role === 'y-line-drag-handle') return '添加列'

  return ''
}

function tooltipForButton(button: HTMLButtonElement) {
  const explicit = tooltipFromClass(button)
  if (explicit) return explicit

  const label = textOf(button)
  if (label) {
    if (/正文|Paragraph/i.test(label)) return '正文段落'
    if (/一级标题|Heading 1/i.test(label)) return '一级标题'
    if (/二级标题|Heading 2/i.test(label)) return '二级标题'
    if (/三级标题|Heading 3/i.test(label)) return '三级标题'
    if (/四级标题|Heading 4/i.test(label)) return '四级标题'
    if (/五级标题|Heading 5/i.test(label)) return '五级标题'
    if (/六级标题|Heading 6/i.test(label)) return '六级标题'
    if (/上传图片|上传|Upload/i.test(label)) return '上传图片'
    if (/确认|Confirm/i.test(label)) return '确认图片链接'
    if (/复制|Copy/i.test(label)) return '复制代码'
    if (/Text/i.test(label)) return '选择代码语言'
    return label
  }

  const table = tooltipForTableButton(button)
  if (table) return table

  const topBar = button.closest('.milkdown-top-bar')
  if (topBar && button.classList.contains('top-bar-item')) {
    const buttons = Array.from(topBar.querySelectorAll<HTMLButtonElement>('button.top-bar-item'))
    const index = buttons.indexOf(button)
    return topBarButtonTooltips[index] ?? '编辑器工具按钮'
  }

  const toolbar = button.closest('.milkdown-toolbar')
  if (toolbar && button.classList.contains('toolbar-item')) {
    const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button.toolbar-item'))
    const index = buttons.indexOf(button)
    return toolbarButtonTooltips[index] ?? '文字格式工具'
  }

  return ''
}

function patchCrepeControlTooltips(root: HTMLElement) {
  root
    .querySelectorAll<HTMLButtonElement>(
      '.milkdown-top-bar button, .milkdown-toolbar button, .milkdown-link-preview button, .milkdown-link-edit button, .milkdown-code-block button, .milkdown-table-block button, [data-role] button',
    )
    .forEach((button) => setControlTooltip(button, tooltipForButton(button)))

  root
    .querySelectorAll<HTMLElement>('.milkdown-slash-menu li, .milkdown-slash-menu button')
    .forEach((item) => {
      const label = textOf(item)
      setControlTooltip(item, slashDescriptions[label] ?? label)
    })

  root
    .querySelectorAll<HTMLElement>('.milkdown-link-preview .button, .milkdown-link-edit .button')
    .forEach((button) => {
      setControlTooltip(button, tooltipFromClass(button) || textOf(button))
    })

  root
    .querySelectorAll<HTMLElement>(
      '.milkdown-image-block .uploader, .milkdown-image-inline .uploader',
    )
    .forEach((button) => {
      setControlTooltip(button, '上传图片')
    })

  root
    .querySelectorAll<HTMLElement>(
      '.milkdown-image-block .confirm, .milkdown-image-inline .confirm',
    )
    .forEach((button) => {
      setControlTooltip(button, '确认图片链接')
    })

  root.querySelectorAll<HTMLElement>('.milkdown-image-block .operation-item').forEach((button) => {
    setControlTooltip(button, '添加/编辑图片说明')
  })

  root
    .querySelectorAll<HTMLElement>('.milkdown-image-block .image-resize-handle')
    .forEach((handle) => {
      setControlTooltip(handle, '拖拽调整图片高度')
    })

  root.querySelectorAll<HTMLElement>('[data-role="col-drag-handle"]').forEach((handle) => {
    setControlTooltip(handle, '选择/拖拽表格列')
  })

  root.querySelectorAll<HTMLElement>('[data-role="row-drag-handle"]').forEach((handle) => {
    setControlTooltip(handle, '选择/拖拽表格行')
  })

  root
    .querySelectorAll<HTMLInputElement>(
      '.milkdown-image-block .link-input-area, .milkdown-image-inline .link-input-area',
    )
    .forEach((input) => {
      input.setAttribute('aria-label', '粘贴图片链接')
      input.setAttribute('placeholder', input.getAttribute('placeholder') || '粘贴图片链接')
      input.setAttribute('title', '粘贴图片链接，或点击上传图片')
    })

  root.querySelectorAll<HTMLInputElement>('.milkdown-link-edit .input-area').forEach((input) => {
    input.setAttribute('aria-label', '粘贴或编辑链接地址')
    input.setAttribute('title', '粘贴或编辑链接地址，Enter 确认，Esc 取消')
  })

  root.querySelectorAll<HTMLInputElement>('.milkdown-code-block .search-input').forEach((input) => {
    input.setAttribute('aria-label', '搜索代码语言')
    input.setAttribute('title', '搜索代码语言')
  })
}

function observeCrepeControls(root: HTMLElement) {
  const patch = () => patchCrepeControlTooltips(root)
  patch()

  const observer = new MutationObserver(() => patch())
  observer.observe(root, {
    attributes: true,
    attributeFilter: ['class', 'data-show', 'data-expanded'],
    childList: true,
    subtree: true,
  })

  return observer
}

const guideItems = [
  {
    label: '粘贴 Markdown',
    tip: '直接从 AI、Obsidian 或 Typora 粘贴 Markdown，Crepe 会保持标题、列表、代码块等结构。',
  },
  {
    label: '拖拽图片',
    tip: '把图片拖进编辑区，或复制截图后 Ctrl/⌘ + V；会上传到 Payload media 并插入 Markdown 图片语法。编辑区只显示图片链接，右侧预览渲染图片。',
  },
  { label: '/ 块菜单', tip: '在空行输入 / 可插入标题、列表、引用、代码块、表格、图片等块。' },
  {
    label: '选中文字格式',
    tip: '选中文字后会出现悬浮工具条，可加粗、斜体、删除线、行内代码或链接。',
  },
  {
    label: '快捷键',
    tip: '常用：Ctrl/⌘+B 加粗，Ctrl/⌘+I 斜体，Ctrl/⌘+K 链接；Markdown 语法也可直接输入。',
  },
]

const forumBlockTemplates = [
  {
    label: '折叠',
    title: '插入 details 折叠块：[details="标题"]...[/details]',
    markdown: '\n\n[details="补充说明"]\n这里写可折叠内容。\n[/details]\n',
  },
  {
    label: '剧透',
    title: '插入 spoiler 隐藏块：[spoiler]...[/spoiler]',
    markdown: '\n\n[spoiler]\n这里写需要点击显示的剧透/隐藏内容。\n[/spoiler]\n',
  },
  {
    label: '渐隐',
    title: '插入 fade 渐隐展开块：[fade="标题"]...[/fade]',
    markdown: '\n\n[fade="展开阅读全文"]\n这里写较长内容，默认会限制高度并显示渐隐遮罩。\n[/fade]\n',
  },
  {
    label: '图集',
    title: '插入 grid 多图网格：[grid] 多张 Markdown 图片 [/grid]',
    markdown: '\n\n[grid]\n![图片 1](/media/example-1.webp)\n\n![图片 2](/media/example-2.webp)\n[/grid]\n',
  },
]


function readUploadCache(): Record<string, WriterUploadCacheEntry> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(uploadCacheKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, WriterUploadCacheEntry>
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

function writeUploadCache(cache: Record<string, WriterUploadCacheEntry>) {
  if (typeof window === 'undefined') return
  const entries = Object.entries(cache)
    .sort(([, a], [, b]) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, maxUploadCacheEntries)
  window.localStorage.setItem(uploadCacheKey, JSON.stringify(Object.fromEntries(entries)))
}

async function fileSha256(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function escapeMarkdownText(value: string) {
  return value.replace(/[\\\]\[]/g, '\\$&')
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function fileAlt(file: File) {
  return file.name.replace(/\.[^.]+$/, '').trim() || '图片'
}

export function CrepeMarkdownEditor({ value, onChange, className }: CrepeMarkdownEditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const crepeRef = useRef<CrepeEditor | null>(null)
  const onChangeRef = useRef(onChange)
  const initialValueRef = useRef(value)
  const externalValueRef = useRef(value)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    kind: 'idle',
    text: '支持拖拽、粘贴截图或编辑器图片块上传',
  })

  onChangeRef.current = onChange

  useEffect(() => {
    externalValueRef.current = value
  }, [value])

  const uploadImage = useCallback(async (file: File) => {
    if (!isImageFile(file)) throw new Error('只能上传图片文件')

    const hash = await fileSha256(file)
    const cache = readUploadCache()
    const cached = cache[hash]
    if (cached?.url) {
      return { alt: cached.alt || fileAlt(file), cached: true, hash, url: cached.url }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', fileAlt(file))
    formData.append('hash', hash)

    const res = await fetch('/private/write/api/upload', {
      method: 'POST',
      body: formData,
    })
    const data = (await res.json().catch(() => ({}))) as WriterUploadResponse

    if (!res.ok || !data.url) throw new Error(data.error ?? '图片上传失败')

    const entry: WriterUploadCacheEntry = {
      alt: data.alt || fileAlt(file),
      filename: data.filename,
      hash: data.hash || hash,
      id: data.id,
      type: file.type,
      updatedAt: new Date().toISOString(),
      url: data.url,
    }
    cache[entry.hash] = entry
    writeUploadCache(cache)

    return { alt: entry.alt, cached: Boolean(data.reused), hash: entry.hash, url: entry.url }
  }, [])

  const appendMarkdownFallback = useCallback((markdown: string) => {
    const fallback = `${externalValueRef.current.trimEnd()}\n\n${markdown.trim()}\n`
    externalValueRef.current = fallback
    onChangeRef.current(fallback)
  }, [])

  const insertMarkdown = useCallback(
    (markdown: string) => {
      const crepe = crepeRef.current

      if (!crepe) {
        appendMarkdownFallback(markdown)
        return
      }

      void import('@milkdown/kit/utils').then(({ insert }) => {
        try {
          crepe.editor.action(insert(markdown))
          const nextMarkdown = crepe.getMarkdown()
          externalValueRef.current = nextMarkdown
          onChangeRef.current(nextMarkdown)
        } catch (error) {
          console.error('[writer-crepe:insert]', error)
          appendMarkdownFallback(markdown)
        }
      })
    },
    [appendMarkdownFallback],
  )

  const uploadAndInsertImages = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter(isImageFile)
      if (imageFiles.length === 0) return false

      setUploadStatus({ kind: 'uploading', text: `正在上传 ${imageFiles.length} 张图片…` })

      try {
        const uploaded = await Promise.all(imageFiles.map(uploadImage))
        const markdown = uploaded.map(({ alt, url }) => `![${escapeMarkdownText(alt)}](${url})`).join('\n\n')
        const reusedCount = uploaded.filter((item) => item.cached).length
        insertMarkdown(`\n\n${markdown}\n\n`)
        setUploadStatus({
          kind: 'success',
          text: reusedCount > 0
            ? `已插入 ${uploaded.length} 张图片，其中 ${reusedCount} 张复用缓存`
            : `已上传 ${uploaded.length} 张图片并插入到正文`,
        })
      } catch (error) {
        setUploadStatus({
          kind: 'error',
          text: error instanceof Error ? error.message : '图片上传失败',
        })
      }

      return true
    },
    [insertMarkdown, uploadImage],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const files = Array.from(event.dataTransfer.files)
      if (!files.some(isImageFile)) return

      event.preventDefault()
      event.stopPropagation()
      setDragActive(false)
      void uploadAndInsertImages(files)
    },
    [uploadAndInsertImages],
  )

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const files = Array.from(event.clipboardData.files)
      if (!files.some(isImageFile)) return

      event.preventDefault()
      void uploadAndInsertImages(files)
    },
    [uploadAndInsertImages],
  )

  useEffect(() => {
    let cancelled = false
    let controlObserver: MutationObserver | null = null

    async function mountEditor() {
      if (!rootRef.current) return

      try {
        const { Crepe } = await import('@milkdown/crepe')

        if (cancelled || !rootRef.current) return

        const crepe = new Crepe({
          root: rootRef.current,
          defaultValue: initialValueRef.current || defaultMarkdown,
          features: {
            [Crepe.Feature.AI]: false,
            [Crepe.Feature.ImageBlock]: false,
            [Crepe.Feature.TopBar]: true,
          },
          featureConfigs: {
            [Crepe.Feature.Placeholder]: { text: '输入 / 打开块菜单，或直接粘贴 Markdown / 图片；图片在编辑区显示为 Markdown 链接' },
            [Crepe.Feature.BlockEdit]: {
              textGroup: {
                label: '标题 / 文本',
                text: { label: '正文段落' },
                h1: { label: '一级标题 H1' },
                h2: { label: '二级标题 H2' },
                h3: { label: '三级标题 H3' },
                h4: { label: '四级标题 H4' },
                h5: { label: '五级标题 H5' },
                h6: { label: '六级标题 H6' },
                quote: { label: '引用块' },
                divider: { label: '分割线' },
              },
              listGroup: {
                label: '列表 / 待办',
                bulletList: { label: '无序列表' },
                orderedList: { label: '有序列表' },
                taskList: { label: '任务清单' },
              },
              advancedGroup: {
                label: '插入模块',
                image: { label: '图片上传/链接' },
                codeBlock: { label: '代码块' },
                table: { label: '表格' },
                math: { label: '公式 LaTeX' },
              },
            },
            [Crepe.Feature.ImageBlock]: {
              onUpload: async (file: File) => {
                setUploadStatus({ kind: 'uploading', text: `正在上传 ${file.name}…` })
                const { cached, url } = await uploadImage(file)
                setUploadStatus({ kind: 'success', text: cached ? `已复用缓存：${file.name}` : `已上传 ${file.name}` })
                return url
              },
              inlineUploadButton: '上传',
              inlineConfirmButton: '确认',
              inlineUploadPlaceholderText: '或粘贴图片链接',
              blockUploadButton: '上传图片',
              blockConfirmButton: '确认',
              blockCaptionPlaceholderText: '图片说明（可选）',
              blockUploadPlaceholderText: '或粘贴图片链接',
            },
            [Crepe.Feature.LinkTooltip]: {
              editButton: '编辑',
              removeButton: '移除',
              confirmButton: '确认',
              inputPlaceholder: '粘贴链接',
            },
            [Crepe.Feature.CodeMirror]: {
              searchPlaceholder: '搜索代码语言',
              noResultText: '没有匹配语言',
              copyText: '复制代码',
              previewToggleText: (previewOnlyMode: boolean) =>
                previewOnlyMode ? '编辑代码' : '隐藏代码',
              previewLabel: '预览',
              previewLoading: '预览生成中…',
            },
            [Crepe.Feature.Latex]: {
              inlineEditConfirm: '确认公式',
            },
            [Crepe.Feature.TopBar]: {
              headingOptions: topBarHeadingOptions,
            },
          },
        }) as CrepeEditor

        crepe.editor.use(markdownImageSourceView)

        crepe.on((api) => {
          api.markdownUpdated((_ctx, markdown) => {
            externalValueRef.current = markdown
            onChangeRef.current(markdown)
          })
        })

        crepeRef.current = crepe
        await crepe.create()

        if (cancelled) {
          await crepe.destroy()
          return
        }

        if (rootRef.current) controlObserver = observeCrepeControls(rootRef.current)

        setStatus('ready')
        const currentMarkdown = crepe.getMarkdown()
        externalValueRef.current = currentMarkdown
        onChangeRef.current(currentMarkdown)
      } catch (error) {
        console.error('[writer-crepe]', error)
        if (!cancelled) setStatus('failed')
      }
    }

    void mountEditor()

    return () => {
      cancelled = true
      const crepe = crepeRef.current
      controlObserver?.disconnect()
      crepeRef.current = null
      if (crepe) void crepe.destroy()
    }
  }, [uploadImage])

  return (
    <div
      className={cn('writer-editor-shell', dragActive && 'is-drag-active', className)}
      onDragEnter={(event) => {
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith('image/'))) {
          event.preventDefault()
          setDragActive(true)
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false)
      }}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.items).some((item) => item.type.startsWith('image/')))
          event.preventDefault()
      }}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div className="writer-editor-toolbar">
        <div>
          <span>Crepe Markdown 编辑器</span>
          <strong>
            {status === 'ready' ? '已就绪' : status === 'failed' ? '加载失败' : '加载中…'}
          </strong>
          <em>图片源码显示</em>
        </div>
        <span className={cn('writer-upload-status', `writer-upload-status-${uploadStatus.kind}`)}>
          {uploadStatus.text}
        </span>
      </div>
      <div className="writer-editor-guide" aria-label="编辑器使用提示">
        {guideItems.map((item) => (
          <span className="writer-guide-pill" key={item.label} title={item.tip}>
            {item.label}
          </span>
        ))}
      </div>
      <div className="writer-forum-toolbar" aria-label="论坛内容块快捷插入">
        <span>论坛块</span>
        {forumBlockTemplates.map((item) => (
          <button
            className="writer-forum-button"
            key={item.label}
            onClick={() => insertMarkdown(item.markdown)}
            title={item.title}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="writer-drop-hint">释放后上传图片并插入当前位置</div>
      <div ref={rootRef} className="writer-crepe-root" />
      {status === 'failed' && (
        <textarea
          className="writer-fallback-markdown"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      )}
    </div>
  )
}
