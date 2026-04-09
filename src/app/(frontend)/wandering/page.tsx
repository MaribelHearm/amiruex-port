import type { Metadata } from 'next'

import Link from 'next/link'

const FRAGMENTS = [
  {
    title: '凌晨的构建日志',
    content:
      '今天把主站的导航、404、首页聚合做了统一，剩下的不是“再堆功能”，而是保持可持续的节奏。',
    time: '2026-04-09',
  },
  {
    title: '关于碎片区的意义',
    content:
      '不是每次都要写成完整长文。碎片区允许“半成品思考”先留下来，后续再沉淀成文章或工具。',
    time: '2026-04-08',
  },
  {
    title: '维护感受',
    content:
      '当页面、文案、状态表达统一之后，维护成本会明显下降，因为每次迭代都能复用已有决策。',
    time: '2026-04-07',
  },
]

export function generateMetadata(): Metadata {
  return {
    title: 'Wandering / 碎片区',
    description: '记录短想法、轻笔记与尚未展开的方向。',
  }
}

export default function WanderingPage() {
  return (
    <main className="wandering-shell pt-16 pb-20">
      <section className="container" aria-labelledby="wandering-title">
        <div className="wandering-hero">
          <p className="wandering-hero__tag">wandering / fragments</p>
          <h1 id="wandering-title">Wandering · 碎片区</h1>
          <p>
            用来放短随笔、过程性想法和未完成线索。它不追求完整，而追求持续更新与可回看。
          </p>
        </div>
      </section>

      <section className="container mt-8" aria-labelledby="wandering-list-title">
        <div className="home-section-head">
          <h2 id="wandering-list-title" className="home-section-title">
            最近碎片
          </h2>
          <Link className="home-inline-link" href="/posts">
            去看完整文章
          </Link>
        </div>

        <div className="wandering-list">
          {FRAGMENTS.map((item) => (
            <article key={item.title} className="wandering-card">
              <p className="wandering-card__time">{item.time}</p>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
