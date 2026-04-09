'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, LayoutDashboard, ShieldCheck } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const pathname = usePathname()
  const navItems = data?.navItems || []

  return (
    <nav className="site-nav" aria-label="主导航">
      <Link
        href="/posts"
        className={`site-nav__link${pathname?.startsWith('/posts') ? ' site-nav__link--active' : ''}`}
      >
        Blog
      </Link>
      <Link
        href="/coding-tools"
        className={`site-nav__link${pathname?.startsWith('/coding-tools') ? ' site-nav__link--active' : ''}`}
      >
        Tools
      </Link>
      <Link
        href="/about"
        className={`site-nav__link${pathname?.startsWith('/about') ? ' site-nav__link--active' : ''}`}
      >
        About
      </Link>

      {navItems.map(({ link }, i) => {
        const href = typeof link?.url === 'string' ? link.url : ''
        const isActive =
          href === '/' ? pathname === '/' : Boolean(href) && pathname?.startsWith(href)

        return (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className={`site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
          />
        )
      })}

      {/* 私有门户入口：后端鉴权，未登录时收到 403 提示 */}
      <Link
        href="/private/portal"
        className={`site-nav__link${pathname?.startsWith('/private/portal') ? ' site-nav__link--active' : ''}`}
        title="基础设施门户（需登录）"
      >
        <ShieldCheck className="w-4 h-4" />
      </Link>

      {/* 管理后台 / 登录入口 */}
      <Link
        href="/admin"
        className={`site-nav__link${pathname?.startsWith('/admin') ? ' site-nav__link--active' : ''}`}
        title="管理后台 / 登录"
      >
        <LayoutDashboard className="w-4 h-4" />
      </Link>

      <Link href="/search" className="site-nav__search" aria-label="搜索">
        <span className="sr-only">搜索</span>
        <SearchIcon className="w-5" />
      </Link>
    </nav>
  )
}
