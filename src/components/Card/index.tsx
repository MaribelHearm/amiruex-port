'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title' | 'heroImage'>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title, heroImage } = doc || {}
  const { description, image: metaImage } = meta || {}
  const coverImage = heroImage && typeof heroImage !== 'string' ? heroImage : (metaImage && typeof metaImage !== 'string' ? metaImage : null)

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const href = `/${relationTo}/${slug}`

  return (
    <article
      className={cn(
        'home-latest-item group h-full flex flex-col p-0 overflow-hidden border-white/5 hover:border-primary/30 transition-all duration-500',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full aspect-video overflow-hidden">
        {coverImage ? (
          <Media
            resource={coverImage}
            size="33vw"
            imgClassName="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          /* 无封面图时使用站点默认背景图作为 fallback */
          <img
            src="/assets/backgrounds/1.png"
            alt=""
            aria-hidden
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110 brightness-50"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        {showCategories && hasCategories && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories?.map((category, index) => {
              if (typeof category === 'object') {
                return (
                  <span key={index} className="text-[0.65rem] font-bold uppercase tracking-wider text-primary/80">
                    {category.title}
                  </span>
                )
              }
              return null
            })}
          </div>
        )}

        {titleToUse && (
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
            <Link className="not-prose" href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
            {sanitizedDescription}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-[0.7rem] font-bold text-primary/60 group-hover:text-primary transition-colors">READ POST</span>
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </article>
  )
}
