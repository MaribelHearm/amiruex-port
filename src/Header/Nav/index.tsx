'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, LayoutDashboard, ShieldCheck, House, PenLine, Menu, X } from 'lucide-react'

export const HeaderNav: React.FC<{ data: HeaderType; isLoggedIn?: boolean }> = ({ data, isLoggedIn }) => {
  const pathname = usePathname()
  const navItems = data?.navItems || []
  const isHome = pathname === '/'
  const navRef = useRef<HTMLElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!navRef.current) return
      if (!navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const onMobilePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('a')) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <nav className="site-nav" aria-label="主导航" ref={navRef}>
      <div className="site-nav__desktop">
        {!isHome && (
          <Link href="/" className="site-nav__home" title="回到主页">
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
          const isActive = href === '/' ? pathname === '/' : Boolean(href) && pathname?.startsWith(href)

          return (
            <CMSLink
              key={i}
              {...link}
              appearance="link"
              className={`site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
            />
          )
        })}

        <Link
          href="/private/portal"
          className={`site-nav__link${pathname?.startsWith('/private/portal') ? ' site-nav__link--active' : ''}`}
          title="基础设施门户（需登录）"
        >
          <ShieldCheck className="w-4 h-4" />
        </Link>

        {isLoggedIn && (
          <Link href="/admin" className="site-nav__admin" title="进入后台">
            <PenLine className="w-4 h-4" />
          </Link>
        )}

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
      </div>

      <div className="site-nav__mobile">
        <Link href="/search" className="site-nav__search" aria-label="搜索">
          <span className="sr-only">搜索</span>
          <SearchIcon className="w-5" />
        </Link>

        <button
          type="button"
          className="site-nav__menu-toggle"
          aria-label={isMobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-mobile-menu"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div
        id="site-mobile-menu"
        className={`site-nav__mobile-panel${isMobileMenuOpen ? ' site-nav__mobile-panel--open' : ''}`}
        onClick={onMobilePanelClick}
      >
        {!isHome && (
          <Link href="/" className="site-nav__mobile-link">
            回到主页
          </Link>
        )}

        <Link
          href="/posts"
          className={`site-nav__mobile-link${pathname?.startsWith('/posts') ? ' site-nav__mobile-link--active' : ''}`}
        >
          Blog
        </Link>
        <Link
          href="/coding-tools"
          className={`site-nav__mobile-link${pathname?.startsWith('/coding-tools') ? ' site-nav__mobile-link--active' : ''}`}
        >
          Tools
        </Link>
        <Link
          href="/wandering"
          className={`site-nav__mobile-link${pathname?.startsWith('/wandering') ? ' site-nav__mobile-link--active' : ''}`}
        >
          Wandering
        </Link>
        <Link
          href="/photography"
          className={`site-nav__mobile-link${pathname?.startsWith('/photography') ? ' site-nav__mobile-link--active' : ''}`}
        >
          Photos
        </Link>
        <Link
          href="/about"
          className={`site-nav__mobile-link${pathname?.startsWith('/about') ? ' site-nav__mobile-link--active' : ''}`}
        >
          About
        </Link>

        {navItems.map(({ link }, i) => {
          const href = typeof link?.url === 'string' ? link.url : ''
          const isActive = href === '/' ? pathname === '/' : Boolean(href) && pathname?.startsWith(href)

          return (
            <CMSLink
              key={`mobile-${i}`}
              {...link}
              appearance="link"
              className={`site-nav__mobile-link${isActive ? ' site-nav__mobile-link--active' : ''}`}
            />
          )
        })}

        <Link
          href="/private/portal"
          className={`site-nav__mobile-link${pathname?.startsWith('/private/portal') ? ' site-nav__mobile-link--active' : ''}`}
          title="基础设施门户（需登录）"
        >
          Infra Portal
        </Link>

        {!isLoggedIn && (
          <Link
            href="/admin"
            className={`site-nav__mobile-link${pathname?.startsWith('/admin') ? ' site-nav__mobile-link--active' : ''}`}
            title="登录"
          >
            登录后台
          </Link>
        )}

        {isLoggedIn && (
          <Link href="/admin" className="site-nav__mobile-link site-nav__mobile-link--admin" title="进入后台">
            编辑后台
          </Link>
        )}
      </div>
    </nav>
  )
}
