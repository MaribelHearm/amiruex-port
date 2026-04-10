'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, LayoutDashboard, ShieldCheck, House, PenLine } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType; isLoggedIn?: boolean }> = ({ data, isLoggedIn }) => {
  const pathname = usePathname()
  const navItems = data?.navItems || []
  const isHome = pathname === '/'

  return (
    <nav className="site-nav" aria-label="主导航">
      {!isHome && (
        <Link
          href="/"
          className="site-nav__home"
          title="回到主页"
        >
          <House className="w-4 h-4" />
        </Link>
      )}
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
        href="/wandering"
        className={`site-nav__link${pathname?.startsWith('/wandering') ? ' site-nav__link--active' : ''}`}
      >
        Wandering
      </Link>
      <Link
        href="/photography"
        className={`site-nav__link${pathname?.startsWith('/photography') ? ' site-nav__link--active' : ''}`}
      >
        Photos
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

      {/* 登录后：编辑快捷入口（替代黑色 AdminBar） */}
      {isLoggedIn && (
        <Link
          href="/admin"
          className="site-nav__admin"
          title="进入后台"
        >
          <PenLine className="w-4 h-4" />
        </Link>
      )}

      {/* 未登录时显示登录入口 */}
      {!isLoggedIn && (
        <Link
          href="/admin"
          className={`site-nav__link${pathname?.startsWith('/admin') ? ' site-nav__link--active' : ''}`}
          title="登录"
        >
          <LayoutDashboard className="w-4 h-4" />
        </Link>
      )}

      <Link href="/search" className="site-nav__search" aria-label="搜索">
        <span className="sr-only">搜索</span>
        <SearchIcon className="w-5" />
      </Link>
    </nav>
  )
}
