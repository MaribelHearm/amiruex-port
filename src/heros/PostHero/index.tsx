'use client'

import { formatDateTime } from 'src/utilities/formatDateTime'
import React, { useEffect, useRef, useState } from 'react'

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
  const heroRef = useRef<HTMLDivElement>(null)
  // 0 = 初始状态（层A全显）, 1 = 完全切换（层B全显）
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return
      // 在 Hero 区 60% 高度内完成 crossfade
      const threshold = heroRef.current.offsetHeight * 0.6
      setProgress(Math.min(1, Math.max(0, window.scrollY / threshold)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ── 有 Hero 图：双层 crossfade ── */
  if (heroImage && typeof heroImage !== 'string') {
    return (
      <>
        {/* 层 B：position:fixed 全屏背景，随滚动淡入 */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            opacity: progress,
            pointerEvents: 'none',
          }}
        >
          <Media fill imgClassName="object-cover" resource={heroImage} />
          {/* 轻薄暗色遮罩，让毛玻璃后面不过曝 */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
        </div>

        {/* 层 A：PostHero section，随滚动淡出 */}
        <div
          ref={heroRef}
          className="post-hero-entrance relative -mt-[10.4rem] flex items-end min-h-[80vh] overflow-hidden"
          style={{ zIndex: 1 }}
        >
          {/* 图片层，opacity 随 progress 淡出 */}
          <div
            style={{ position: 'absolute', inset: 0, opacity: 1 - progress }}
          >
            <Media fill priority imgClassName="object-cover" resource={heroImage} />
          </div>

          {/* 顶部阅读遮罩：固定，不参与 crossfade */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%)',
              zIndex: 1,
            }}
          />

          {/* 底部地平线渐变，随 progress 淡出 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: '52%',
              opacity: 1 - progress,
              background: [
                'linear-gradient(to top,',
                '  var(--background) 8%,',
                '  color-mix(in oklch, var(--background) 55%, transparent) 40%,',
                '  color-mix(in oklch, var(--background) 18%, transparent) 70%,',
                '  transparent 100%)',
              ].join(' '),
              zIndex: 1,
            }}
          />

          {/* 文字：随层 A 一起淡出 */}
          <div
            className="container pb-14 relative"
            style={{ zIndex: 2, opacity: 1 - progress * 1.4 }}
          >
            <div className="max-w-[48rem] mx-auto">
              <PostMeta post={post} />
            </div>
          </div>
        </div>
      </>
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
