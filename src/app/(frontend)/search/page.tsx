import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { BackgroundFX } from '@/components/BackgroundFX'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {}),
  })

  return (
    <div className="home-root-shell pb-24">
      <BackgroundFX />
      <PageClient />

      <section className="search-hero container">
        <p className="search-hero__tag">Portal Search</p>
        <h1 className="search-hero__title">站内搜索</h1>
        <p className="search-hero__desc">
          按标题、摘要和 slug 检索内容，输入关键词后会自动更新结果。
        </p>
        <div className="search-hero__bar">
          <Search />
        </div>
      </section>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as unknown as CardPostData[]} />
      ) : (
        <section className="container">
          <article className="home-tool-card p-5 sm:p-6 text-sm text-muted-foreground">
            暂无匹配结果，请尝试更短或更具体的关键词。
          </article>
        </section>
      )}
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `站内搜索 | Personal Portal`,
  }
}
