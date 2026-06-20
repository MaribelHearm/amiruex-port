'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  FilePlus2,
  History,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import { SECTION_OPTIONS, type SectionValue } from '@/constants/sections'
import { slugify } from '@/utilities/slugify'
import { cn } from '@/utilities/ui'

import { CrepeMarkdownEditor } from './CrepeMarkdownEditor'
import { WriterContentEnhancer } from './WriterContentEnhancer'
import type {
  WriterAuthorSummary,
  WriterCategorySummary,
  WriterMediaRef,
  WriterPostDocument,
  WriterPostStatus,
  WriterPostSummary,
} from '@/lib/writer/types'

type WriterClientProps = {
  initialAuthors: WriterAuthorSummary[]
  initialCategories: WriterCategorySummary[]
  initialPost: WriterPostDocument | null
  initialPosts: WriterPostSummary[]
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type PreviewState = 'idle' | 'loading' | 'error'
type ImageTarget = 'hero' | 'meta'

type WriterUploadResponse = {
  alt?: string
  error?: string
  filename?: string
  id?: string
  url?: string
}

type LocalDraftSnapshot = {
  id: string
  updatedAt: string
  form: FormState
}

type FormState = {
  id?: string
  title: string
  excerpt: string
  slug: string
  section: SectionValue
  tagsText: string
  status: WriterPostStatus
  markdown: string
  authorIDs: string[]
  authors: WriterAuthorSummary[]
  categoryIDs: string[]
  categories: WriterCategorySummary[]
  publishedAt: string
  heroImageID?: string
  heroImage?: WriterMediaRef | null
  metaImageID?: string
  metaImage?: WriterMediaRef | null
  metaTitle: string
  metaDescription: string
  isFeatured: boolean
  relatedPostIDs: string[]
  relatedPosts: WriterPostSummary[]
}

const emptyMarkdown =
  '# 新文章\n\n把 AI 写好的 Markdown 粘贴到这里，然后继续修改、预览、保存或发布。\n'
const localDraftKey = 'next-portal.writer.autosave.v1'
const localHistoryKey = 'next-portal.writer.history.v1'
const maxLocalHistory = 24
const historyIntervalMs = 30_000

function readLocalSnapshot(key: string): LocalDraftSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraftSnapshot
    if (!parsed || typeof parsed.updatedAt !== 'string' || !parsed.form) return null
    return parsed
  } catch {
    return null
  }
}

function readLocalHistory(): LocalDraftSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(localHistoryKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalDraftSnapshot[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.updatedAt === 'string' && item.form)
      .slice(0, maxLocalHistory)
  } catch {
    return []
  }
}

function writeLocalHistory(history: LocalDraftSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localHistoryKey, JSON.stringify(history.slice(0, maxLocalHistory)))
}

function createEmptyForm(): FormState {
  return {
    title: '',
    excerpt: '',
    slug: '',
    section: 'home',
    tagsText: '',
    status: 'draft',
    markdown: emptyMarkdown,
    authorIDs: [],
    authors: [],
    categoryIDs: [],
    categories: [],
    publishedAt: '',
    heroImageID: '',
    heroImage: null,
    metaImageID: '',
    metaImage: null,
    metaTitle: '',
    metaDescription: '',
    isFeatured: false,
    relatedPostIDs: [],
    relatedPosts: [],
  }
}

function formFromPost(post: WriterPostDocument): FormState {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    section: post.section,
    tagsText: post.tags.join(', '),
    status: post.status,
    markdown: post.markdown || emptyMarkdown,
    authorIDs: post.authorIDs ?? [],
    authors: post.authors ?? [],
    categoryIDs: post.categoryIDs ?? [],
    categories: post.categories ?? [],
    publishedAt: formatDateTimeLocal(post.publishedAt),
    heroImageID: post.heroImageID || '',
    heroImage: post.heroImage ?? null,
    metaImageID: post.metaImageID || '',
    metaImage: post.metaImage ?? null,
    metaTitle: post.metaTitle || '',
    metaDescription: post.metaDescription || '',
    isFeatured: post.isFeatured,
    relatedPostIDs: post.relatedPostIDs ?? [],
    relatedPosts: post.relatedPosts ?? [],
  }
}

function normalizeFormState(form: FormState): FormState {
  const fallback = createEmptyForm()
  return {
    ...fallback,
    ...form,
    authorIDs: form.authorIDs ?? [],
    authors: form.authors ?? [],
    categoryIDs: form.categoryIDs ?? [],
    categories: form.categories ?? [],
    publishedAt: form.publishedAt ?? '',
    relatedPostIDs: form.relatedPostIDs ?? [],
    relatedPosts: form.relatedPosts ?? [],
  }
}

function localSnapshotMatchesPost(snapshot: LocalDraftSnapshot, post: WriterPostDocument | null) {
  if (!post) return true
  return snapshot.form?.id === post.id
}

function tagsFromText(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function mediaPreviewUrl(media?: WriterMediaRef | null) {
  return media?.thumbnailURL || media?.url || ''
}

function mediaLabel(media?: WriterMediaRef | null) {
  return media?.alt || media?.filename || media?.id || '未选择图片'
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function normalizeDateTimeLocal(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function authorLabel(author: WriterAuthorSummary) {
  return author.name || author.email || author.id
}

function formatSaveTime(value?: string | null) {
  if (!value) return '尚未保存'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function WriterClient({
  initialAuthors,
  initialCategories,
  initialPost,
  initialPosts,
}: WriterClientProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialPost ? formFromPost(initialPost) : createEmptyForm(),
  )
  const [posts, setPosts] = useState(initialPosts)
  const [previewHtml, setPreviewHtml] = useState(initialPost?.html ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [message, setMessage] = useState('')
  const [localDraftState, setLocalDraftState] = useState('本地自动保存准备中')
  const [localHistory, setLocalHistory] = useState<LocalDraftSnapshot[]>([])
  const [lastSavedPostPath, setLastSavedPostPath] = useState(
    initialPost?.slug ? `/posts/${initialPost.slug}` : '',
  )
  const previewAbortRef = useRef<AbortController | null>(null)
  const heroImageInputRef = useRef<HTMLInputElement | null>(null)
  const metaImageInputRef = useRef<HTMLInputElement | null>(null)
  const localAutosaveReadyRef = useRef(false)
  const lastHistorySnapshotRef = useRef<{ at: number; fingerprint: string }>({
    at: 0,
    fingerprint: '',
  })
  const slugTouchedRef = useRef(Boolean(initialPost?.slug))
  const [editorResetVersion, setEditorResetVersion] = useState(0)
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0)
  const [assetUploadState, setAssetUploadState] = useState('')

  const selectedPost = useMemo(() => posts.find((post) => post.id === form.id), [form.id, posts])
  const visiblePostPath = lastSavedPostPath

  const restoreLocalSnapshot = useCallback((snapshot: LocalDraftSnapshot, source = '本地草稿') => {
    const nextForm = normalizeFormState(snapshot.form)
    setForm(nextForm)
    setEditorResetVersion((version) => version + 1)
    setPreviewHtml('')
    setPreviewRefreshToken((token) => token + 1)
    setLastSavedPostPath(nextForm.slug ? `/posts/${nextForm.slug}` : '')
    slugTouchedRef.current = Boolean(nextForm.slug)
    setMessage(`已恢复${source}：${formatSaveTime(snapshot.updatedAt)}`)
  }, [])

  useEffect(() => {
    const history = readLocalHistory()
    setLocalHistory(history)

    const snapshot = readLocalSnapshot(localDraftKey)
    if (snapshot && localSnapshotMatchesPost(snapshot, initialPost)) {
      restoreLocalSnapshot(snapshot, '本地自动保存')
      setLocalDraftState(`已恢复本地草稿：${formatSaveTime(snapshot.updatedAt)}`)
    } else if (snapshot && initialPost) {
      setLocalDraftState(
        `检测到另一篇文章的本地草稿：${formatSaveTime(snapshot.updatedAt)}，已保留在历史里，未覆盖当前文章。`,
      )
    } else {
      setLocalDraftState('本地自动保存已启用')
    }

    localAutosaveReadyRef.current = true
  }, [initialPost, restoreLocalSnapshot])

  const patchForm = useCallback((patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }, [])

  const refreshPostList = useCallback(async () => {
    const res = await fetch('/private/write/api/posts', { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as { posts?: WriterPostSummary[] }
    if (Array.isArray(data.posts)) setPosts(data.posts)
  }, [])

  const renderPreview = useCallback(async (markdown: string) => {
    previewAbortRef.current?.abort()
    const controller = new AbortController()
    previewAbortRef.current = controller
    setPreviewState('loading')

    try {
      const res = await fetch('/private/write/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('预览失败')
      const data = (await res.json()) as { html: string }
      setPreviewHtml(data.html)
      setPreviewState('idle')
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('[writer-preview-client]', error)
      setPreviewState('error')
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void renderPreview(form.markdown)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [form.markdown, previewRefreshToken, renderPreview])

  useEffect(() => {
    if (!localAutosaveReadyRef.current) return

    const timer = window.setTimeout(() => {
      const updatedAt = new Date().toISOString()
      const snapshot: LocalDraftSnapshot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        updatedAt,
        form,
      }

      try {
        window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot))
        setLocalDraftState(`本地已自动保存：${formatSaveTime(updatedAt)}`)

        const fingerprint = JSON.stringify({
          id: form.id ?? '',
          title: form.title,
          slug: form.slug,
          excerpt: form.excerpt,
          section: form.section,
          tagsText: form.tagsText,
          status: form.status,
          markdown: form.markdown,
          authorIDs: form.authorIDs,
          categoryIDs: form.categoryIDs,
          publishedAt: form.publishedAt,
          heroImageID: form.heroImageID ?? '',
          metaImageID: form.metaImageID ?? '',
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
          isFeatured: form.isFeatured,
          relatedPostIDs: form.relatedPostIDs,
        })
        const last = lastHistorySnapshotRef.current
        const enoughTimePassed = Date.now() - last.at >= historyIntervalMs

        if (fingerprint !== last.fingerprint && enoughTimePassed) {
          lastHistorySnapshotRef.current = { at: Date.now(), fingerprint }
          const nextHistory = [
            snapshot,
            ...readLocalHistory().filter(
              (item) => item.form.markdown !== form.markdown || item.form.title !== form.title,
            ),
          ].slice(0, maxLocalHistory)
          writeLocalHistory(nextHistory)
          setLocalHistory(nextHistory)
        }
      } catch (error) {
        console.error('[writer-local-autosave]', error)
        setLocalDraftState('本地自动保存失败：浏览器存储不可用')
      }
    }, 800)

    return () => window.clearTimeout(timer)
  }, [form])

  const clearLocalDrafts = useCallback(() => {
    window.localStorage.removeItem(localDraftKey)
    window.localStorage.removeItem(localHistoryKey)
    setLocalHistory([])
    setLocalDraftState('本地草稿和历史已清空')
  }, [])

  const handleTitleChange = (title: string) => {
    setForm((current) => {
      const next: FormState = { ...current, title }
      if (!slugTouchedRef.current || !current.slug) {
        next.slug = slugify(title)
      }
      return next
    })
  }

  const uploadImageAsset = async (file: File, target: ImageTarget) => {
    if (!file.type.startsWith('image/')) {
      setAssetUploadState('只能选择图片文件')
      return
    }

    setAssetUploadState(target === 'hero' ? '正在上传首页/文章封面图…' : '正在上传列表/SEO 展示图…')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', file.name.replace(/\.[^.]+$/, '') || '文章展示图')

    try {
      const res = await fetch('/private/write/api/upload', { method: 'POST', body: formData })
      const data = (await res.json().catch(() => ({}))) as WriterUploadResponse
      if (!res.ok || !data.id) throw new Error(data.error ?? '图片上传失败')

      const media: WriterMediaRef = {
        alt: data.alt || file.name,
        filename: data.filename,
        id: data.id,
        thumbnailURL: data.url,
        url: data.url,
      }

      if (target === 'hero') {
        patchForm({ heroImageID: media.id, heroImage: media })
        setAssetUploadState('已设置首页/文章封面图')
      } else {
        patchForm({ metaImageID: media.id, metaImage: media })
        setAssetUploadState('已设置列表/SEO 展示图')
      }
    } catch (error) {
      setAssetUploadState(error instanceof Error ? error.message : '图片上传失败')
    }
  }

  const handleImageAssetChange = (target: ImageTarget, file?: File | null) => {
    if (!file) return
    void uploadImageAsset(file, target)
  }

  const clearImageAsset = (target: ImageTarget) => {
    if (target === 'hero') {
      patchForm({ heroImageID: '', heroImage: null })
    } else {
      patchForm({ metaImageID: '', metaImage: null })
    }
    setAssetUploadState('已清除展示图设置，保存后生效')
  }

  const toggleRelatedPost = (post: WriterPostSummary, checked: boolean) => {
    setForm((current) => ({
      ...current,
      relatedPostIDs: checked
        ? uniqueStrings([...current.relatedPostIDs, post.id])
        : current.relatedPostIDs.filter((id) => id !== post.id),
      relatedPosts: checked
        ? [...current.relatedPosts.filter((item) => item.id !== post.id), post]
        : current.relatedPosts.filter((item) => item.id !== post.id),
    }))
  }

  const toggleCategory = (category: WriterCategorySummary, checked: boolean) => {
    setForm((current) => ({
      ...current,
      categoryIDs: checked
        ? uniqueStrings([...current.categoryIDs, category.id])
        : current.categoryIDs.filter((id) => id !== category.id),
      categories: checked
        ? [...current.categories.filter((item) => item.id !== category.id), category]
        : current.categories.filter((item) => item.id !== category.id),
    }))
  }

  const toggleAuthor = (author: WriterAuthorSummary, checked: boolean) => {
    setForm((current) => ({
      ...current,
      authorIDs: checked
        ? uniqueStrings([...current.authorIDs, author.id])
        : current.authorIDs.filter((id) => id !== author.id),
      authors: checked
        ? [...current.authors.filter((item) => item.id !== author.id), author]
        : current.authors.filter((item) => item.id !== author.id),
    }))
  }

  const handleLoadPost = async (id: string) => {
    if (!id) {
      setForm(createEmptyForm())
      setEditorResetVersion((version) => version + 1)
      setPreviewHtml('')
      setPreviewRefreshToken((token) => token + 1)
      slugTouchedRef.current = false
      setLastSavedPostPath('')
      setMessage('已切换到新建文章')
      return
    }

    setMessage('读取文章中…')
    const res = await fetch(`/private/write/api/posts?id=${encodeURIComponent(id)}`, {
      cache: 'no-store',
    })
    const data = (await res.json()) as { post?: WriterPostDocument; error?: string }

    if (!res.ok || !data.post) {
      setMessage(data.error ?? '读取文章失败')
      return
    }

    setForm(formFromPost(data.post))
    setEditorResetVersion((version) => version + 1)
    setPreviewHtml(data.post.html)
    setLastSavedPostPath(data.post.slug ? `/posts/${data.post.slug}` : '')
    slugTouchedRef.current = true
    setMessage(`已载入：${data.post.title}`)
  }

  const savePost = async (nextStatus?: WriterPostStatus) => {
    setSaveState('saving')
    setMessage('保存中…')

    const status = nextStatus ?? form.status
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      slug: form.slug,
      section: form.section,
      tags: tagsFromText(form.tagsText),
      status,
      markdown: form.markdown,
      authorIDs: form.authorIDs,
      categoryIDs: form.categoryIDs,
      publishedAt: normalizeDateTimeLocal(form.publishedAt),
      heroImageID: form.heroImageID || undefined,
      metaImageID: form.metaImageID || undefined,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      isFeatured: form.isFeatured,
      relatedPostIDs: form.relatedPostIDs,
    }

    try {
      const res = await fetch(
        form.id
          ? `/private/write/api/posts/${encodeURIComponent(form.id)}`
          : '/private/write/api/posts',
        {
          method: form.id ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = (await res.json()) as { post?: WriterPostDocument; error?: string }

      if (!res.ok || !data.post) throw new Error(data.error ?? '保存失败')

      setForm(formFromPost(data.post))
      setPreviewHtml(data.post.html)
      slugTouchedRef.current = true
      setSaveState('saved')
      const postPath = `/posts/${data.post.slug}`
      setLastSavedPostPath(postPath)
      setMessage(
        status === 'published' ? `已发布，可打开 ${postPath}` : `草稿已保存，可预览 ${postPath}`,
      )
      await refreshPostList()
    } catch (error) {
      const text = error instanceof Error ? error.message : '保存失败'
      setSaveState('error')
      setMessage(text)
    }
  }

  return (
    <main className="writer-page">
      <header className="writer-hero">
        <div>
          <p className="writer-eyebrow">Markdown-first Writer</p>
          <h1>/private/write 写作台</h1>
          <p>
            粘贴 Markdown、拖拽图片、用 / 块菜单组织内容；服务端真实预览后保存草稿或发布到 Payload。
          </p>
        </div>
        <div
          className="writer-ai-placeholder"
          aria-label="writer helper"
          title="这里先保留 AI 辅助入口，当前重点是 Linux.do 风格手工写作体验。"
        >
          <Sparkles size={18} />
          写作辅助入口预留
        </div>
      </header>

      <section className="writer-workspace">
        <aside className="writer-sidebar">
          <button
            className="writer-button writer-button-primary"
            onClick={() => void handleLoadPost('')}
          >
            <FilePlus2 size={16} /> 新建文章
          </button>

          <label className="writer-field">
            <span>编辑已有文章</span>
            <select
              value={form.id ?? ''}
              onChange={(event) => void handleLoadPost(event.target.value)}
            >
              <option value="">新建文章</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title} · {post.status === 'published' ? '已发布' : '草稿'}
                </option>
              ))}
            </select>
          </label>

          <div className="writer-post-meta-card">
            <strong>{selectedPost ? selectedPost.title : form.id ? form.title : '新建文章'}</strong>
            <span>状态：{form.status === 'published' ? '已发布' : '草稿'}</span>
            <span>Writer 更新时间：{formatSaveTime(selectedPost?.writerUpdatedAt)}</span>
            {visiblePostPath && (
              <a
                className="writer-post-link"
                href={visiblePostPath}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={14} /> 打开前台文章
              </a>
            )}
          </div>

          <div className="writer-post-meta-card writer-local-card">
            <strong>
              <History size={15} /> 本地保护
            </strong>
            <span>{localDraftState}</span>
            <span>打开新文章会自动恢复本地草稿；打开指定文章时只会自动恢复同一篇文章的草稿。</span>
            {localHistory.length > 0 && (
              <div className="writer-history-list" aria-label="本地历史版本">
                {localHistory.slice(0, 6).map((item) => (
                  <button
                    className="writer-history-item"
                    key={item.id}
                    onClick={() => restoreLocalSnapshot(item, '历史版本')}
                    title={`恢复 ${formatSaveTime(item.updatedAt)} 的本地历史版本`}
                    type="button"
                  >
                    <RotateCcw size={13} />
                    <span>{item.form.title || item.form.slug || '未命名文章'}</span>
                    <time>{formatSaveTime(item.updatedAt)}</time>
                  </button>
                ))}
              </div>
            )}
            <button
              className="writer-history-clear"
              onClick={clearLocalDrafts}
              title="只清理浏览器本地草稿和历史，不会删除 Payload 文章。"
              type="button"
            >
              <Trash2 size={13} /> 清空本地草稿
            </button>
          </div>
        </aside>

        <section className="writer-main-panel">
          <div className="writer-form-grid">
            <label className="writer-field writer-field-wide">
              <span>标题</span>
              <input
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
              />
            </label>

            <label className="writer-field">
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => {
                  slugTouchedRef.current = true
                  patchForm({ slug: slugify(event.target.value) || event.target.value.trim() })
                }}
              />
            </label>

            <label className="writer-field">
              <span>栏目</span>
              <select
                value={form.section}
                onChange={(event) => patchForm({ section: event.target.value as SectionValue })}
              >
                {SECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="writer-field writer-field-wide">
              <span>摘要</span>
              <textarea
                maxLength={220}
                rows={3}
                value={form.excerpt}
                onChange={(event) => patchForm({ excerpt: event.target.value })}
              />
            </label>

            <label className="writer-field">
              <span>标签（逗号分隔）</span>
              <input
                value={form.tagsText}
                onChange={(event) => patchForm({ tagsText: event.target.value })}
              />
            </label>

            <label className="writer-field">
              <span>状态</span>
              <select
                value={form.status}
                onChange={(event) => patchForm({ status: event.target.value as WriterPostStatus })}
              >
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </select>
            </label>

            <label className="writer-field">
              <span>发布时间</span>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(event) => patchForm({ publishedAt: event.target.value })}
              />
            </label>
          </div>

          <section className="writer-publish-panel" aria-label="文章发布设置">
            <div className="writer-pane-header writer-publish-panel__header">
              <h2>发布展示设置</h2>
              <span>{assetUploadState || '对应 Payload 后台的封面、列表图、SEO 和关联文章'}</span>
            </div>

            <div className="writer-publish-grid">
              <div className="writer-image-picker">
                <div>
                  <strong>首页/文章封面图</strong>
                  <span>用于文章页顶部 Hero，也优先作为首页/列表卡片图。</span>
                </div>
                {mediaPreviewUrl(form.heroImage) ? (
                  <Image
                    src={mediaPreviewUrl(form.heroImage) || ''}
                    alt={mediaLabel(form.heroImage)}
                    width={640}
                    height={360}
                    unoptimized
                  />
                ) : (
                  <div className="writer-image-placeholder">未选择封面图</div>
                )}
                <div className="writer-image-picker__actions">
                  <input
                    accept="image/*"
                    hidden
                    ref={heroImageInputRef}
                    type="file"
                    onChange={(event) => handleImageAssetChange('hero', event.target.files?.[0])}
                  />
                  <button
                    className="writer-button"
                    onClick={() => heroImageInputRef.current?.click()}
                    type="button"
                  >
                    <ImagePlus size={15} /> 上传/替换
                  </button>
                  {form.heroImageID && (
                    <button
                      className="writer-button writer-button-ghost"
                      onClick={() => clearImageAsset('hero')}
                      type="button"
                    >
                      <X size={15} /> 清除
                    </button>
                  )}
                </div>
              </div>

              <div className="writer-image-picker">
                <div>
                  <strong>列表/SEO 展示图</strong>
                  <span>对应后台 SEO image；没有封面图时列表卡片会用它。</span>
                </div>
                {mediaPreviewUrl(form.metaImage) ? (
                  <Image
                    src={mediaPreviewUrl(form.metaImage) || ''}
                    alt={mediaLabel(form.metaImage)}
                    width={640}
                    height={360}
                    unoptimized
                  />
                ) : (
                  <div className="writer-image-placeholder">未选择列表/SEO 图</div>
                )}
                <div className="writer-image-picker__actions">
                  <input
                    accept="image/*"
                    hidden
                    ref={metaImageInputRef}
                    type="file"
                    onChange={(event) => handleImageAssetChange('meta', event.target.files?.[0])}
                  />
                  <button
                    className="writer-button"
                    onClick={() => metaImageInputRef.current?.click()}
                    type="button"
                  >
                    <ImagePlus size={15} /> 上传/替换
                  </button>
                  {form.metaImageID && (
                    <button
                      className="writer-button writer-button-ghost"
                      onClick={() => clearImageAsset('meta')}
                      type="button"
                    >
                      <X size={15} /> 清除
                    </button>
                  )}
                </div>
              </div>

              <div className="writer-seo-panel">
                <label className="writer-checkbox-row">
                  <input
                    checked={form.isFeatured}
                    type="checkbox"
                    onChange={(event) => patchForm({ isFeatured: event.target.checked })}
                  />
                  <span>设为首页精选</span>
                </label>

                <label className="writer-field">
                  <span>SEO 标题（可空）</span>
                  <input
                    value={form.metaTitle}
                    onChange={(event) => patchForm({ metaTitle: event.target.value })}
                  />
                </label>

                <label className="writer-field">
                  <span>SEO / 列表描述</span>
                  <textarea
                    maxLength={220}
                    rows={3}
                    placeholder="默认使用摘要"
                    value={form.metaDescription}
                    onChange={(event) => patchForm({ metaDescription: event.target.value })}
                  />
                </label>
              </div>

              <div className="writer-taxonomy-panel">
                <strong>文章分类</strong>
                <span>对应后台侧边栏「分类」，会显示在列表卡片和文章 Hero。</span>
                <div className="writer-related-list">
                  {initialCategories.length > 0 ? (
                    initialCategories.map((category) => (
                      <label
                        className="writer-related-item"
                        key={category.id}
                        title={category.slug}
                      >
                        <input
                          checked={form.categoryIDs.includes(category.id)}
                          type="checkbox"
                          onChange={(event) => toggleCategory(category, event.target.checked)}
                        />
                        <span>{category.title}</span>
                      </label>
                    ))
                  ) : (
                    <span className="writer-empty-hint">后台还没有分类。</span>
                  )}
                </div>
              </div>

              <div className="writer-taxonomy-panel">
                <strong>作者</strong>
                <span>对应后台侧边栏「作者」。不选则沿用 Payload 默认/空作者。</span>
                <div className="writer-related-list">
                  {initialAuthors.length > 0 ? (
                    initialAuthors.map((author) => (
                      <label
                        className="writer-related-item"
                        key={author.id}
                        title={author.email || author.id}
                      >
                        <input
                          checked={form.authorIDs.includes(author.id)}
                          type="checkbox"
                          onChange={(event) => toggleAuthor(author, event.target.checked)}
                        />
                        <span>{authorLabel(author)}</span>
                      </label>
                    ))
                  ) : (
                    <span className="writer-empty-hint">后台还没有可选作者。</span>
                  )}
                </div>
              </div>

              <div className="writer-related-panel">
                <strong>双向/关联文章</strong>
                <span>对应后台「关联设置」，会展示在正文底部延伸阅读。</span>
                <div className="writer-related-list">
                  {posts
                    .filter((post) => post.id !== form.id)
                    .slice(0, 18)
                    .map((post) => (
                      <label className="writer-related-item" key={post.id} title={post.slug}>
                        <input
                          checked={form.relatedPostIDs.includes(post.id)}
                          type="checkbox"
                          onChange={(event) => toggleRelatedPost(post, event.target.checked)}
                        />
                        <span>{post.title}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </section>

          <div className="writer-editor-preview-grid">
            <section className="writer-pane">
              <div className="writer-pane-header">
                <h2>编辑</h2>
                <span title="可直接粘贴 Markdown；拖入或粘贴图片会自动上传并插入。">
                  粘贴 Markdown 后可直接富文本修改
                </span>
              </div>
              <CrepeMarkdownEditor
                key={editorResetVersion}
                value={form.markdown}
                onChange={(markdown) => patchForm({ markdown })}
              />
            </section>

            <section className="writer-pane writer-preview-pane">
              <div className="writer-pane-header">
                <h2>真实预览</h2>
                <span className={cn(previewState === 'error' && 'writer-text-danger')}>
                  {previewState === 'loading'
                    ? '服务端渲染中…'
                    : previewState === 'error'
                      ? '预览失败'
                      : '服务端 HTML'}
                </span>
              </div>
              <WriterContentEnhancer
                className="writer-preview prose prose-slate dark:prose-invert max-w-none"
                fallbackHtml="<p>开始写作后这里会显示服务端渲染预览。</p>"
                html={previewHtml}
              />
            </section>
          </div>

          <footer className="writer-actions">
            <div className="writer-save-state">
              <span className="writer-save-message">
                {saveState === 'saving' && <Loader2 className="writer-spin" size={16} />}
                {saveState === 'saved' && <CheckCircle2 size={16} />}
                {message || '准备就绪'}
              </span>
              {visiblePostPath && (
                <a
                  className="writer-inline-link"
                  href={visiblePostPath}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} /> {visiblePostPath}
                </a>
              )}
            </div>
            <div className="writer-action-buttons">
              <button
                className="writer-button"
                title="重新调用服务端 Markdown 渲染，刷新右侧预览。"
                onClick={() => void renderPreview(form.markdown)}
              >
                <Eye size={16} /> 刷新预览
              </button>
              <button
                className="writer-button"
                title="保存为 Payload 草稿，保留前台链接便于打开核对。"
                disabled={saveState === 'saving'}
                onClick={() => void savePost('draft')}
              >
                <Save size={16} /> 保存草稿
              </button>
              <button
                className="writer-button writer-button-primary"
                title="发布为前台可见文章，成功后可直接打开 /posts/{slug}。"
                disabled={saveState === 'saving'}
                onClick={() => void savePost('published')}
              >
                <Send size={16} /> 发布
              </button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  )
}
