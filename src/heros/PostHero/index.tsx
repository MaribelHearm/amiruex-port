import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

const PostMeta: React.FC<{ post: Post; light?: boolean }> = ({ post, light }) => {
  const { categories, populatedAuthors, publishedAt, title } = post
  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''
  const textClass = light ? 'text-foreground' : 'text-white'
  const dimClass = light ? 'text-muted-foreground' : 'text-white/70'

  return (
    <>
      <div className={`uppercase text-sm mb-6 font-semibold tracking-wider ${dimClass}`}>
        {categories?.map((category, index) => {
          if (typeof category === 'object' && category !== null) {
            const titleToUse = category.title || 'Untitled category'
            const isLast = index === (categories?.length ?? 0) - 1
            return (
              <React.Fragment key={index}>
                {titleToUse}
                {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
              </React.Fragment>
            )
          }
          return null
        })}
      </div>

      <h1 className={`mb-6 text-3xl md:text-5xl lg:text-6xl font-bold leading-tight ${textClass}`}>
        {title}
      </h1>

      <div className={`flex flex-col md:flex-row gap-4 md:gap-16 text-sm ${dimClass}`}>
        {hasAuthors && (
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider opacity-60">Author</p>
            <p>{formatAuthors(populatedAuthors)}</p>
          </div>
        )}
        {publishedAt && (
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wider opacity-60">Date Published</p>
            <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
          </div>
        )}
      </div>
    </>
  )
}

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { heroImage } = post

  /* ── 有 Hero 图：全宽沉浸式 header ── */
  if (heroImage && typeof heroImage !== 'string') {
    return (
      <div className="relative -mt-[10.4rem] flex items-end min-h-[80vh] select-none overflow-hidden">
        <Media fill priority imgClassName="-z-10 object-cover" resource={heroImage} />
        {/* 渐变：从底部透明背景色过渡，而非硬编码黑色 */}
        <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/30 to-transparent pointer-events-none" />
        <div className="container z-10 relative lg:grid lg:grid-cols-[1fr_48rem_1fr] pb-10">
          <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
            <PostMeta post={post} />
          </div>
        </div>
      </div>
    )
  }

  /* ── 无 Hero 图：紧凑文字 header，背景图透出 ── */
  return (
    <div className="post-hero-text container">
      <div className="post-hero-text__inner">
        <PostMeta post={post} light />
      </div>
    </div>
  )
}
