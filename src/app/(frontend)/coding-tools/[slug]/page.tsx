import type { Metadata } from 'next'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ProfileCardPlayground } from '@/components/tools/ProfileCardPlayground'
import { PromptPolisherPlayground } from '@/components/tools/PromptPolisherPlayground'
import { UnderConstruction } from '@/components/UnderConstruction'
import { TOOL_CATEGORY_LABEL, TOOL_ITEMS, TOOL_STATUS_LABEL, getToolBySlug } from '@/constants/tools'
import { BackgroundFX } from '@/components/BackgroundFX'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  return TOOL_ITEMS.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug } = await paramsPromise
  const tool = getToolBySlug(slug)

  if (!tool) {
    return {
      title: '工具未找到 | Amireux',
    }
  }

  return {
    title: `${tool.title} | Tools | Amireux`,
    description: tool.summary,
  }
}

export default async function ToolDetailPage({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise
  const tool = getToolBySlug(slug)

  if (!tool) {
    notFound()
  }

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <div className="flex justify-between items-start mb-4">
            <div className={`status-indicator status-indicator--${tool.status}`}>
              <span className="status-indicator__dot" />
              {TOOL_STATUS_LABEL[tool.status]}
            </div>
            <Link className="text-xs font-bold text-primary/60 hover:text-primary transition-colors" href="/coding-tools">
              ← 返回工具总览
            </Link>
          </div>

          <h1 className="secondary-header__title">{tool.title}</h1>
          <p className="secondary-header__description mb-6">{tool.summary}</p>

          <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5 text-xs text-muted-foreground">
            <span>分类：{TOOL_CATEGORY_LABEL[tool.category]}</span>
            <span>路线：{tool.mvpScope}</span>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="relative z-10">
          {tool.slug === 'profile-card-generator' && <ProfileCardPlayground />}
          {tool.slug === 'prompt-polisher' && <PromptPolisherPlayground />}
          {tool.slug !== 'profile-card-generator' && tool.slug !== 'prompt-polisher' && (
            <UnderConstruction
              tag={TOOL_STATUS_LABEL[tool.status]}
              title={`${tool.title} 正在推进中`}
              description={tool.mvpScope}
            />
          )}
        </div>
      </section>
    </main>
  )
}
