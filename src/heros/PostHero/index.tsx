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
      <div className="relative -mt-[10.4rem] h-screen overflow-hidden" style={{ zIndex: 1 }}>
        {/* 图片：正常填充，z-index 高于 BackgroundFX（fixed z-index:0） */}
        <Media fill priority imgClassName="object-cover" resource={heroImage} />

        {/* 顶部轻薄阅读遮罩：让 Header 区域文字可读 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 45%)',
            zIndex: 1,
          }}
        />

        {/* 地平线渐变：从背景色实色平滑过渡到透明，制造 "地平线" 视觉 */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '52%',
            background: [
              'linear-gradient(to top,',
              '  var(--background) 8%,',
              '  color-mix(in oklch, var(--background) 55%, transparent) 40%,',
              '  color-mix(in oklch, var(--background) 18%, transparent) 70%,',
              '  transparent 100%',
              ')',
            ].join(' '),
            zIndex: 1,
          }}
        />

        {/* 文字信息：位于底部，叠在渐变之上 */}
        <div className="absolute bottom-0 left-0 right-0 container pb-14" style={{ zIndex: 2 }}>
          <div className="max-w-[48rem] mx-auto">
            <PostMeta post={post} />
          </div>
        </div>
      </div>
    )
  }

  /* ── 无 Hero 图：紧凑文字 header，BackgroundFX 透出 ── */
  return (
    <div className="post-hero-text container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="post-hero-text__inner">
        <PostMeta post={post} light />
      </div>
    </div>
  )
}
