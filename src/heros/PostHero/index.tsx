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

      <div className={`flex items-center gap-2 text-sm ${dimClass}`}>
        {hasAuthors && (
          <span>{formatAuthors(populatedAuthors)}</span>
        )}
        {hasAuthors && publishedAt && (
          <span className="opacity-40">·</span>
        )}
        {publishedAt && (
          <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
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
        {/* 层 B：position:fixed 全屏背景，随滚动淡入
            图片加 blur+brightness，让非阅读区和首页 BackgroundFX 一致 */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            opacity: progress,
            pointerEvents: 'none',
            overflow: 'hidden', // 裁掉 blur 溢出边缘
          }}
        >
          <Media fill imgClassName="post-hero-bg-img" resource={heroImage} />
          {/* 渐变遮罩：顶部压暗供 Header 区使用，整体加深 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.1) 100%)',
            }}
          />
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

          {/* 底部三分之一遮罩：纯黑渐变，标题压在上面 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: '55%',
              opacity: 1 - progress,
              background: [
                'linear-gradient(to top,',
                '  rgba(0,0,0,0.82) 0%,',
                '  rgba(0,0,0,0.60) 25%,',
                '  rgba(0,0,0,0.30) 55%,',
                '  transparent 100%)',
              ].join(' '),
              zIndex: 1,
            }}
          />

          {/* 底部地平线（主题色渐变）：衔接正文卡片，随 progress 淡出 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: '22%',
              opacity: 1 - progress,
              background: [
                'linear-gradient(to top,',
                '  var(--background) 0%,',
                '  color-mix(in oklch, var(--background) 60%, transparent) 50%,',
                '  transparent 100%)',
              ].join(' '),
              zIndex: 2,
            }}
          />

          {/* 文字：压在底部遮罩上，随层 A 一起淡出 */}
          <div
            className="container pb-10 relative"
            style={{ zIndex: 3, opacity: 1 - progress * 1.4 }}
          >
            <div className="max-w-[48rem]">
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
