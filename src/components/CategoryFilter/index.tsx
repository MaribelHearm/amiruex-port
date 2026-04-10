'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

type Category = { id: string; title: string; slug: string }

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const pathname = usePathname()
  const isAll = pathname === '/posts'

  return (
    <div className="posts-category-filter">
      <Link
        href="/posts"
        className={`posts-category-pill${isAll ? ' posts-category-pill--active' : ''}`}
      >
        全部
      </Link>
      {categories.map((cat) => {
        const isActive = pathname === `/posts/categories/${cat.slug}`
        return (
          <Link
            key={cat.id}
            href={`/posts/categories/${cat.slug}`}
            className={`posts-category-pill${isActive ? ' posts-category-pill--active' : ''}`}
          >
            {cat.title}
          </Link>
        )
      })}
    </div>
  )
}
