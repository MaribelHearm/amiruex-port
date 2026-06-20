import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

import type { Post } from '@/payload-types'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { WriterContentEnhancer } from '@/components/writer/WriterContentEnhancer'
import { BackgroundFX } from '@/components/BackgroundFX'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const isDefaultTypedEditorState = (content: Post['content']): content is DefaultTypedEditorState => {
  return Boolean(content?.root)
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

  const hasHeroImage = post.heroImage && typeof post.heroImage !== 'string'

  return (
    <main className="home-root-shell">
      {/* 有 Hero Image 时由 PostHero 的层 B 充当背景，不用 BackgroundFX */}
      {!hasHeroImage && <BackgroundFX />}
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="post-body container -mt-8 relative" style={{ zIndex: 1 }}>
        {/* 卡片：72rem，内部 prose 限宽 52rem 保证阅读舒适 */}
        <div className="post-body__surface max-w-[72rem] mx-auto">
          <div className="max-w-[52rem] mx-auto">
            {post.contentSource === 'writerMarkdown' && post.contentHtml ? (
              <WriterContentEnhancer
                className={cn('payload-richtext max-w-none mx-auto prose md:prose-md dark:prose-invert')}
                html={post.contentHtml}
              />
            ) : isDefaultTypedEditorState(post.content) ? (
              <RichText data={post.content} enableGutter={false} enableProse />
            ) : null}
          </div>
        </div>
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <RelatedPosts
            className="mt-12 max-w-[72rem] mx-auto"
            docs={post.relatedPosts.filter((post) => typeof post === 'object')}
          />
        )}
      </div>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
