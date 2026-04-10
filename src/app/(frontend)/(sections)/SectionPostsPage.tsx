import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from '../posts/page.client'
import { SECTION_META, type SectionValue } from '@/constants/sections'

type SectionPostsPageProps = {
  section: SectionValue
}

export async function buildSectionMetadata(section: SectionValue): Promise<Metadata> {
  const meta = SECTION_META[section]

  return {
    title: `${meta.title} | Personal Portal`,
    description: meta.description,
  }
}

export default async function SectionPostsPage({ section }: SectionPostsPageProps) {
  const payload = await getPayload({ config: configPromise })
  const meta = SECTION_META[section]

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 24,
    overrideAccess: false,
    where: {
      section: {
        equals: section,
      },
    },
    select: {
      title: true,
      slug: true,
      categories: true,
      excerpt: true,
      meta: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />

      <div className="container mb-12">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{meta.heading}</h1>
          <p>{meta.description}</p>
        </div>
      </div>

      {posts.docs.length === 0 ? (
        <div className="container">
          <p className="text-sm text-muted-foreground">该分区暂时还没有内容，去后台新增一篇文章并设置对应 section 即可显示。</p>
        </div>
      ) : (
        <CollectionArchive posts={posts.docs} />
      )}
    </div>
  )
}
