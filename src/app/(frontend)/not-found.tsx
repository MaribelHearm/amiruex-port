import Link from 'next/link'
import React from 'react'
import { BackgroundFX } from '@/components/BackgroundFX'

export default function NotFound() {
  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="container flex items-center justify-center min-h-[80vh] relative z-10">
        <div className="secondary-header__card max-w-lg w-full text-center">
          <p className="text-primary font-mono text-4xl font-bold mb-4">404</p>
          <h1 className="secondary-header__title">你访问的页面不存在</h1>
          <p className="secondary-header__description mx-auto mb-10">
            链接可能已失效、内容被移动，或仍在建设中。
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link className="home-btn home-btn--primary" href="/">
              返回首页
            </Link>
            <Link className="home-btn" href="/posts">
              去看文章
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
