import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { CategoryFilter } from '@/components/CategoryFilter'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { formatDateTime } from '@/utilities/formatDateTime'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { BackgroundFX } from '@/components/BackgroundFX'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const [posts, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        tags: true,
        categories: true,
        heroImage: true,
        meta: true,
      },
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      select: { title: true, slug: true },
    }),
  ])

  const categories = categoriesResult.docs.map((c) => ({
    id: String(c.id),
    title: c.title,
    slug: typeof c.slug === 'string' ? c.slug : '',
  }))

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />
      <PageClient />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">Deep Thinking</p>
          <h1 className="secondary-header__title">深度思考 / Blog</h1>
          <p className="secondary-header__description">
            沉淀教程、工程实践与项目记录。这里是长期内容主阵地，不追求高频，追求可复用与深度思考。
          </p>
        </div>
      </section>

      {categories.length > 0 && (
        <div className="container mb-2">
          <CategoryFilter categories={categories} />
        </div>
      )}

      <div className="container mb-8 flex justify-between items-center">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <section className="pb-24">
        <CollectionArchive posts={posts.docs} />

        <div className="container mt-12">
          {posts.totalPages > 1 && posts.page && (
            <Pagination page={posts.page} totalPages={posts.totalPages} />
          )}
        </div>
      </section>
    </main>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: '深度思考 | Blog | Amireux',
    description: `按时间沉淀的文章列表，最后更新于 ${formatDateTime(new Date().toISOString())}`,
  }
}
