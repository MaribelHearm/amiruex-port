import type { SectionValue } from '@/constants/sections'
import type { Category, Media, Post, User } from '@/payload-types'

type WriterPostSummaryFields = Pick<
  Post,
  'id' | 'section' | 'slug' | 'title' | 'updatedAt' | '_status' | 'writerUpdatedAt'
>

type WriterPostDocumentFields = WriterPostSummaryFields &
  Pick<
    Post,
    | 'authors'
    | 'categories'
    | 'contentHtml'
    | 'contentMarkdown'
    | 'excerpt'
    | 'heroImage'
    | 'isFeatured'
    | 'meta'
    | 'publishedAt'
    | 'relatedPosts'
    | 'tags'
  >

export type WriterMediaRef = {
  alt?: string | null
  filename?: string | null
  height?: number | null
  id: string
  thumbnailURL?: string | null
  url?: string | null
  width?: number | null
}

export type WriterCategorySummary = {
  id: string
  slug: string
  title: string
}

export type WriterAuthorSummary = {
  email?: string | null
  id: string
  name?: string | null
}

export type WriterPostStatus = 'draft' | 'published'

export type WriterPostSummary = {
  id: string
  title: string
  slug: string
  section: SectionValue
  status: WriterPostStatus
  updatedAt: string
  writerUpdatedAt?: string | null
}

export type WriterPostPayload = {
  id?: string
  title: string
  excerpt: string
  slug: string
  section: SectionValue
  tags: string[]
  status: WriterPostStatus
  markdown: string
  authorIDs: string[]
  categoryIDs: string[]
  heroImageID?: string
  isFeatured: boolean
  metaDescription?: string
  metaImageID?: string
  metaTitle?: string
  publishedAt?: string | null
  relatedPostIDs: string[]
}

export type WriterPostDocument = WriterPostPayload & {
  authors: WriterAuthorSummary[]
  categories: WriterCategorySummary[]
  heroImage?: WriterMediaRef | null
  html: string
  id: string
  metaImage?: WriterMediaRef | null
  relatedPosts: WriterPostSummary[]
  updatedAt: string
  writerUpdatedAt?: string | null
}

function mediaToWriterRef(value: unknown): WriterMediaRef | null {
  if (!value || typeof value !== 'object') return null
  const media = value as Media
  return {
    alt: media.alt,
    filename: media.filename,
    height: media.height,
    id: media.id,
    thumbnailURL: media.thumbnailURL,
    url: media.url,
    width: media.width,
  }
}

function relationID(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id
  return ''
}

function relationIDs(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values.map(relationID).filter(Boolean)
}

function relatedPostSummaries(values: unknown): WriterPostSummary[] {
  if (!Array.isArray(values)) return []
  return values
    .filter((value): value is WriterPostSummaryFields =>
      Boolean(value && typeof value === 'object' && 'id' in value),
    )
    .map(postToWriterSummary)
}

function categorySummaries(values: unknown): WriterCategorySummary[] {
  if (!Array.isArray(values)) return []
  return values
    .filter((value): value is Category =>
      Boolean(value && typeof value === 'object' && 'id' in value),
    )
    .map(categoryToWriterSummary)
}

function authorSummaries(values: unknown): WriterAuthorSummary[] {
  if (!Array.isArray(values)) return []
  return values
    .filter((value): value is User => Boolean(value && typeof value === 'object' && 'id' in value))
    .map(userToWriterSummary)
}

export function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((tag) => String(tag).trim()).filter(Boolean)
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

export function categoryToWriterSummary(
  category: Pick<Category, 'id' | 'slug' | 'title'>,
): WriterCategorySummary {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
  }
}

export function userToWriterSummary(
  user: Pick<User, 'email' | 'id' | 'name'>,
): WriterAuthorSummary {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
  }
}

export function postToWriterDocument(post: WriterPostDocumentFields): WriterPostDocument {
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    slug: post.slug,
    section: post.section,
    tags: post.tags ?? [],
    status: post._status === 'published' ? 'published' : 'draft',
    markdown: typeof post.contentMarkdown === 'string' ? post.contentMarkdown : '',
    authorIDs: relationIDs(post.authors),
    categoryIDs: relationIDs(post.categories),
    heroImageID: relationID(post.heroImage),
    isFeatured: Boolean(post.isFeatured),
    metaDescription: post.meta?.description ?? '',
    metaImageID: relationID(post.meta?.image),
    metaTitle: post.meta?.title ?? '',
    publishedAt: post.publishedAt ?? null,
    relatedPostIDs: relationIDs(post.relatedPosts),
    authors: authorSummaries(post.authors),
    categories: categorySummaries(post.categories),
    heroImage: mediaToWriterRef(post.heroImage),
    html: typeof post.contentHtml === 'string' ? post.contentHtml : '',
    metaImage: mediaToWriterRef(post.meta?.image),
    relatedPosts: relatedPostSummaries(post.relatedPosts),
    updatedAt: post.updatedAt,
    writerUpdatedAt: post.writerUpdatedAt,
  }
}

export function postToWriterSummary(post: WriterPostSummaryFields): WriterPostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    section: post.section,
    status: post._status === 'published' ? 'published' : 'draft',
    updatedAt: post.updatedAt,
    writerUpdatedAt: post.writerUpdatedAt,
  }
}
