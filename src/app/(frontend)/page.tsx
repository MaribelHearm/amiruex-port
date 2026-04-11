import type { Metadata } from 'next'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { UnderConstruction } from '@/components/UnderConstruction'
import { BackgroundFX } from '@/components/BackgroundFX'
import { HomeScrollRevealController } from '@/components/home/HomeScrollRevealController'
import { HeroParticles } from '@/components/home/HeroParticles'
import { HeroTypewriter } from '@/components/home/HeroTypewriter'
import { formatDateTime } from '@/utilities/formatDateTime'
import { TOOL_ITEMS } from '@/constants/tools'
import { EXTENSION_MODULES } from '@/constants/extension-modules'

export const revalidate = 600

type LightweightPost = {
  id: string
  title?: string | null
  slug?: string | null
  section?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  isFeatured?: boolean | null
  meta?: {
    description?: string | null
  } | null
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Amireux | 个人数字门户',
    description: '连接工程、创作与生活的个人操作界面。',
  }
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  let latestPosts: LightweightPost[] = []
  let featuredPosts: LightweightPost[] = []
  let recentFragments: { id: string; title?: string | null; content?: string | null; publishedAt?: string | null }[] = []

  try {
    const [latestResult, featuredResult, fragmentsResult] = await Promise.all([
      payload.find({
        collection: 'posts',
        depth: 0,
        limit: 4,
        overrideAccess: false,
        sort: '-publishedAt',
      }),
      payload.find({
        collection: 'posts',
        depth: 0,
        limit: 2,
        overrideAccess: false,
        sort: '-publishedAt',
        where: { isFeatured: { equals: true } },
      }),
      payload.find({
        collection: 'fragments',
        depth: 0,
        limit: 3,
        overrideAccess: false,
        sort: '-publishedAt',
        select: { title: true, content: true, publishedAt: true },
      }),
    ])

    latestPosts = latestResult.docs as LightweightPost[]
    featuredPosts = featuredResult.docs as LightweightPost[]
    recentFragments = fragmentsResult.docs as typeof recentFragments

    if (featuredPosts.length === 0) {
      featuredPosts = latestPosts.slice(0, 2)
      latestPosts = latestPosts.slice(2)
    } else {
      const featuredIds = new Set(featuredPosts.map(p => p.id))
      latestPosts = latestPosts.filter(p => !featuredIds.has(p.id)).slice(0, 3)
    }
  } catch {
    latestPosts = []
    featuredPosts = []
  }

  const toolsAvailable = TOOL_ITEMS.filter((item) => item.status === 'available')

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />
      {/* 客户端滚动 reveal 控制器，纯副作用，不渲染 DOM */}
      <HomeScrollRevealController />

      {/* ── 首屏展示舞台 ── 100vh 大块，居中展示品牌信息 */}
      <section className="home-top-stage" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* 粒子氛围层：漂浮点+连线，极低透明度，不抢主视觉 */}
        <HeroParticles />
        <div className="container home-hero-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="home-hero home-hero--portal">
            <div className="home-hero__content">
              <p className="home-hero__tag">AMIREUX · PERSONAL PORTAL</p>
              <h1 className="home-hero__title">
                用一个持续生长的站点，
                <span className="home-hero__title-accent">连接工程、创作与生活</span>
              </h1>
              <p className="home-hero__subtitle">
                这里是我的个人操作界面：输出文章、沉淀工具、记录实践。先保证可用，再持续打磨体验。
              </p>

              {/* 打字机副标语 */}
              <HeroTypewriter />

              {/* 小状态徽章行 */}
              <div className="home-hero__badges">
                <span className="home-hero__badge home-hero__badge--online">
                  <span className="home-hero__badge-dot" />
                  在线中
                </span>
                <span className="home-hero__badge">Cloud Iteration · v5+</span>
                <span className="home-hero__badge">已上云稳定运行</span>
              </div>

              <div className="home-hero__actions">
                <Link className="home-btn home-btn--primary" href="/posts">
                  阅读文章
                </Link>
                <Link className="home-btn" href="/coding-tools">
                  实用工具
                </Link>
                <Link className="home-btn home-btn--ghost" href="/about">
                  关于我
                </Link>
                <a
                  className="home-btn home-btn--ghost"
                  href="https://github.com/MaribelHearm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>

            <aside className="home-hero__panel" aria-label="站点状态">
              {/* 标题行：左侧彩点 + 标签 */}
              <div className="home-hero__panel-header">
                <span className="home-hero__panel-dot" aria-hidden />
                <span className="home-hero__panel-label">SYS · STATUS</span>
              </div>

              {/* 横排统计：用分隔线隔开，不用小盒子 */}
              <div className="home-hero__stat-row">
                <div className="home-hero__stat">
                  <span className="home-hero__stat-val">{latestPosts.length + featuredPosts.length}+</span>
                  <span className="home-hero__stat-key">文章</span>
                </div>
                <div className="home-hero__stat-divider" aria-hidden />
                <div className="home-hero__stat">
                  <span className="home-hero__stat-val">{toolsAvailable.length}</span>
                  <span className="home-hero__stat-key">工具</span>
                </div>
                <div className="home-hero__stat-divider" aria-hidden />
                <div className="home-hero__stat">
                  <span className="home-hero__stat-val">v5+</span>
                  <span className="home-hero__stat-key">云端迭代</span>
                </div>
              </div>

              {/* 最近更新：左边彩色竖线 + 文本 */}
              <div className="home-hero__update">
                <div className="home-hero__update-bar" aria-hidden />
                <div>
                  <p className="home-hero__update-label">最近更新</p>
                  <p className="home-hero__update-text">已上云并持续迭代多个版本，当前为稳定在线演进态</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
        {/* 向下滚动提示箭头：绝对定位在首屏底部居中 */}
        <div className="home-scroll-hint" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ── 内容展开层 ── 滚动渐进 reveal */}
      <div className="home-content-surface">

        {/* 深度思考区块 */}
        <section className="home-reveal-section container mt-14 md:mt-16">
          <div className="home-section-head mb-6 md:mb-8">
            <h2 className="home-section-title">深度思考 / Blog</h2>
            <Link className="home-inline-link" href="/posts">查看全部 →</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* 左侧：精选大卡片 */}
            <div className="lg:col-span-2 space-y-6">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`} className="block group">
                  <article className="home-latest-item p-5 md:p-8 h-full">
                    <p className="home-latest-item__meta mb-4">FEATURED · {post.section || 'TECH'}</p>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 mb-5 md:mb-6">
                      {post.excerpt || post.meta?.description || '点击阅读全文...'}
                    </p>
                    <div className="text-sm font-medium text-primary/80">READ ARTICLE</div>
                  </article>
                </Link>
              ))}
            </div>

            {/* 右侧：最新列表 */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Recent Updates</p>
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`} className="block group">
                  <article className="home-latest-item p-5">
                    <p className="text-xs text-muted-foreground mb-1">
                      {post.publishedAt ? formatDateTime(post.publishedAt) : 'RECENT'}
                    </p>
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {post.title}
                    </h4>
                  </article>
                </Link>
              ))}
              {/* 碎片区预览 */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Wandering · 碎片</p>
                  <Link href="/wandering" className="text-xs text-primary/70 hover:text-primary transition-colors">全部 →</Link>
                </div>
                {recentFragments.length > 0 ? (
                  <div className="space-y-2">
                    {recentFragments.map((f) => (
                      <Link key={f.id} href="/wandering" className="block group">
                        <article className="home-latest-item p-4">
                          {f.publishedAt && (
                            <p className="text-[0.72rem] text-muted-foreground mb-1">{formatDateTime(f.publishedAt)}</p>
                          )}
                          <h4 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">{f.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{f.content}</p>
                        </article>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link href="/wandering" className="block">
                    <div className="p-5 rounded-2xl border border-dashed border-white/10 hover:border-primary/40 transition-colors">
                      <p className="text-xs text-muted-foreground">记录那些不便成文的瞬时灵感与日常观察。</p>
                    </div>
                  </Link>
                )}</div>
            </div>
          </div>
        </section>

        {/* 交互工具区块 */}
        <section className="home-reveal-section container mt-24">
          <div className="home-section-head mb-8">
            <h2 className="home-section-title">交互实验室 / Tools</h2>
            <Link className="home-inline-link" href="/coding-tools">所有工具 →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolsAvailable.map((tool) => (
              <Link key={tool.slug} href={`/coding-tools/${tool.slug}`} className="home-tool-card group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">Available</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
                <p className="text-sm text-muted-foreground">{tool.summary}</p>
              </Link>
            ))}
            <div className="home-tool-card border-dashed opacity-60 flex flex-col justify-center items-center text-center p-8">
              <p className="text-sm font-medium text-muted-foreground">更多工具正在开发中</p>
              <p className="text-xs mt-1 text-muted-foreground/60">Prompt Polisher, Personality Quiz...</p>
            </div>
          </div>
        </section>

        {/* 底部聚合：关于与建设 */}
        <section className="home-reveal-section container mt-20 md:mt-24 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="home-about-brief p-5 md:p-8">
              <h2 className="text-xl font-bold mb-4">About · 一点人味</h2>
              <p className="text-muted-foreground leading-relaxed">
                我在这里记录工程实践，也保留生活与表达。这个站不是成品展示，而是一段持续更新的建设过程。
                如果你对这个站点的技术实现感兴趣，欢迎查看底部的开源信息。
              </p>
              <div className="mt-8 flex gap-4">
                <Link href="/about" className="text-sm font-bold text-primary hover:underline">了解更多</Link>
                <a href="https://github.com/MaribelHearm" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">GITHUB</a>
              </div>
            </div>

            <div className="construction-card p-5 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="construction-card__tag">CLOUD STAGE</span>
                  <span className="text-xs font-bold text-success">ACTIVE MAINTENANCE</span>
                </div>
                <h3 className="text-xl font-bold mb-2">站点演进状态</h3>
                <p className="text-sm text-muted-foreground">
                  首页最后一张卡片 UI 设计已完成，当前进入上云后的内容更新与修复优化阶段（持续小步迭代）。
                </p>
              </div>
              <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
