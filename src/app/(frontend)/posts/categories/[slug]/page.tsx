import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import { CategoryFilter } from '@/components/CategoryFilter'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { BackgroundFX } from '@/components/BackgroundFX'
import PageClient from '../../page.client'
import { POSTS_PAGE_SIZE } from '../../constants'

export const revalidate = 600

type Args = { params: Promise<{ slug: string }> }

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const [categoryResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      where: { slug: { equals: slug } },
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      select: { title: true, slug: true },
    }),
  ])

  const category = categoryResult.docs[0]
  if (!category) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: POSTS_PAGE_SIZE,
    overrideAccess: false,
    where: { categories: { contains: category.id } },
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
  })

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
          <p className="secondary-header__tag">Category</p>
          <h1 className="secondary-header__title">{category.title}</h1>
          <p className="secondary-header__description">
            共 {posts.totalDocs} 篇文章
          </p>
        </div>
      </section>

      <div className="container mb-2">
        <CategoryFilter categories={categories} />
      </div>

      <div className="container mb-8 flex justify-between items-center">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={POSTS_PAGE_SIZE}
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

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    select: { slug: true },
  })
  return categories.docs
    .filter((c) => typeof c.slug === 'string' && c.slug)
    .map((c) => ({ slug: c.slug as string }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  const category = result.docs[0]
  return {
    title: category ? `${category.title} | Blog | Amireux` : 'Blog | Amireux',
  }
}
