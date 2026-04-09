import type { Metadata } from 'next'

import Link from 'next/link'

import { TOOL_CATEGORY_LABEL, TOOL_ITEMS, TOOL_STATUS_LABEL } from '@/constants/tools'
import { BackgroundFX } from '@/components/BackgroundFX'

export function generateMetadata(): Metadata {
  return {
    title: '交互实验室 | Tools | Amireux',
    description: '沉淀工程实践，提升协作效率。这里收纳可交互的实用工具。',
  }
}

export default function CodingToolsPage() {
  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">Interactive Lab</p>
          <h1 className="secondary-header__title">交互实验室 / Tools</h1>
          <p className="secondary-header__description">
            沉淀工程实践，提升协作效率。这里收纳可交互的实用工具，优先保证 MVP 可用，再持续迭代体验。
          </p>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOL_ITEMS.map((tool) => (
            <Link key={tool.slug} href={`/coding-tools/${tool.slug}`} className="home-tool-card group">
              <div className="flex justify-between items-start mb-6">
                <div className={`status-indicator status-indicator--${tool.status}`}>
                  <span className="status-indicator__dot" />
                  {TOOL_STATUS_LABEL[tool.status]}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                {tool.summary}
              </p>

              <div className="flex flex-wrap gap-2 mt-auto">
                {tool.tags.map((tag) => (
                  <span key={tag} className="text-[0.65rem] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          <div className="home-tool-card border-dashed opacity-50 flex flex-col justify-center items-center text-center p-8">
            <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-4">
              <span className="text-xl text-muted-foreground">+</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">更多工具正在开发中</p>
            <p className="text-xs mt-1 text-muted-foreground/40">Prompt Polisher, Personality Quiz...</p>
          </div>
        </div>
      </section>
    </main>
  )
}
