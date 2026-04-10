'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Header } from '@/payload-types'
import type { PayloadMeUser } from '@payloadcms/admin-bar'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { PayloadAdminBar } from '@payloadcms/admin-bar'
import { getClientSideURL } from '@/utilities/getURL'

interface HeaderClientProps {
  data: Header
  preview?: boolean
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, preview }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const threshold = pathname === '/' ? 240 : 120
    const handleScroll = () => setIsScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname])

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // 动态测量 nav 宽度，写入 --island-w 驱动收缩动画
  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return
    if (isScrolled) {
      const nav = inner.querySelector('.site-nav') as HTMLElement | null
      if (nav) {
        // scrollWidth 反映 CSS 应用后的最终布局宽度（已计算新 gap/padding）
        const targetW = nav.scrollWidth + 32 // 32px = 两侧 1rem padding
        inner.style.setProperty('--island-w', `${targetW}px`)
      }
    } else {
      inner.style.setProperty('--island-w', '1200px')
    }
  }, [isScrolled])

  const onAuthChange = useCallback((user: PayloadMeUser) => {
    setIsLoggedIn(Boolean(user?.id))
  }, [])

  return (
    <header
      className="site-header"
      {...(theme ? { 'data-theme': theme } : {})}
      data-scrolled={isScrolled ? 'true' : undefined}
    >
      {/* 隐藏的 AdminBar，仅用于登录态检测 */}
      <div style={{ display: 'none' }}>
        <PayloadAdminBar
          cmsURL={getClientSideURL()}
          collectionSlug="posts"
          preview={preview}
          onAuthChange={onAuthChange}
        />
      </div>

      <div className="site-header__inner" ref={innerRef}>
        <Link href="/" className="site-header__logo-container">
          <Logo loading="eager" priority="high" className="site-header__logo" />
        </Link>
        <HeaderNav data={data} isLoggedIn={isLoggedIn} />
      </div>
    </header>
  )
}
