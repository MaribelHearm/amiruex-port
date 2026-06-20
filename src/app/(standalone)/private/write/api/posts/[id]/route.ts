import { SECTION_OPTIONS, type SectionValue } from '@/constants/sections'
import { requireWriterUser, unauthenticatedResponse } from '@/lib/writer/auth'
import { markdownToPayloadLexical } from '@/lib/writer/lexical'
import { renderWriterMarkdown } from '@/lib/writer/markdown'
import { normalizeTags, postToWriterDocument, type WriterPostPayload } from '@/lib/writer/types'
import { slugify } from '@/utilities/slugify'

export const dynamic = 'force-dynamic'

const sectionValues = new Set<string>(SECTION_OPTIONS.map((option) => option.value))

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStatus(value: unknown): 'draft' | 'published' {
  return value === 'published' ? 'published' : 'draft'
}

function cleanOptionalID(value: unknown): string | undefined {
  const text = cleanString(value)
  return text || undefined
}

function cleanOptionalDate(value: unknown): string | null {
  const text = cleanString(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeIDList(value: unknown, limit = 24): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map(cleanString).filter(Boolean))).slice(0, limit)
}

function normalizeRelatedPostIDs(value: unknown): string[] {
  return normalizeIDList(value, 12)
}

function parseWriterPostPayload(body: Record<string, unknown>): WriterPostPayload {
  const title = cleanString(body.title)
  const excerpt = cleanString(body.excerpt)
  const markdown = typeof body.markdown === 'string' ? body.markdown : ''
  const section = cleanString(body.section) || 'home'
  const slug = cleanString(body.slug) || slugify(title)

  if (!title) throw new Error('标题不能为空')
  if (!excerpt) throw new Error('摘要不能为空')
  if (!slug) throw new Error('slug 不能为空')
  if (!sectionValues.has(section)) throw new Error('section 不合法')

  return {
    title,
    excerpt,
    slug,
    section: section as SectionValue,
    tags: normalizeTags(body.tags),
    status: normalizeStatus(body.status),
    markdown,
    authorIDs: normalizeIDList(body.authorIDs, 8),
    categoryIDs: normalizeIDList(body.categoryIDs, 8),
    heroImageID: cleanOptionalID(body.heroImageID),
    metaImageID: cleanOptionalID(body.metaImageID),
    metaTitle: cleanString(body.metaTitle),
    metaDescription: cleanString(body.metaDescription),
    isFeatured: body.isFeatured === true,
    publishedAt: cleanOptionalDate(body.publishedAt),
    relatedPostIDs: normalizeRelatedPostIDs(body.relatedPostIDs),
  }
}

type Args = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, { params }: Args) {
  try {
    const { id } = await params
    const { payload, user } = await requireWriterUser()
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseWriterPostPayload(body)
    const { html } = await renderWriterMarkdown(parsed.markdown)
    const lexical = await markdownToPayloadLexical(parsed.markdown)
    const now = new Date().toISOString()

    const post = await payload.update({
      collection: 'posts',
      id,
      user,
      overrideAccess: false,
      depth: 2,
      data: {
        title: parsed.title,
        excerpt: parsed.excerpt,
        slug: parsed.slug,
        section: parsed.section,
        tags: parsed.tags,
        authors: parsed.authorIDs,
        categories: parsed.categoryIDs,
        heroImage: parsed.heroImageID || null,
        isFeatured: parsed.isFeatured,
        relatedPosts: parsed.relatedPostIDs,
        publishedAt: parsed.publishedAt || null,
        meta: {
          title: parsed.metaTitle || null,
          description: parsed.metaDescription || parsed.excerpt,
          image: parsed.metaImageID || null,
        },
        _status: parsed.status,
        contentSource: 'writerMarkdown',
        contentMarkdown: parsed.markdown,
        contentHtml: html,
        writerUpdatedAt: now,
        content: lexical,
      },
    })

    return Response.json({ post: postToWriterDocument(post) })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return unauthenticatedResponse()
    }

    const message = error instanceof Error ? error.message : '保存失败'
    console.error('[writer-posts:patch]', error)
    return Response.json({ error: message }, { status: 400 })
  }
}
