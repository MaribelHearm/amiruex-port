'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  // 子页面进入时立刻呈现岛屿态；首页等待滚过 Hero 区
  const [isScrolled, setIsScrolled] = useState(pathname !== '/')

  useEffect(() => {
    if (pathname !== '/') {
      // 子页面：始终保持岛屿态，不受滚动影响
      setIsScrolled(true)
      return
    }
    // 首页：滚过 Hero 区域（240px）才收缩
    const handleScroll = () => setIsScrolled(window.scrollY > 240)
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

  return (
    <header
      className="site-header"
      {...(theme ? { 'data-theme': theme } : {})}
      data-scrolled={isScrolled ? 'true' : undefined}
    >
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo-container">
          <Logo loading="eager" priority="high" className="site-header__logo" />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
