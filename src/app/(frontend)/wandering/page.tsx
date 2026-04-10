import type { Metadata } from 'next'
import Link from 'next/link'
import { BackgroundFX } from '@/components/BackgroundFX'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { formatDateTime } from '@/utilities/formatDateTime'

export const revalidate = 600

export function generateMetadata(): Metadata {
  return {
    title: 'Wandering · 碎片区 | Amireux',
    description: '记录短想法、轻笔记与尚未展开的方向。',
  }
}

export default async function WanderingPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'fragments',
    draft: false,
    limit: 50,
    overrideAccess: false,
    sort: '-publishedAt',
    select: { title: true, content: true, publishedAt: true },
  })
  const fragments = result.docs

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">wandering / fragments</p>
          <h1 className="secondary-header__title">Wandering · 碎片区</h1>
          <p className="secondary-header__description">
            用来放短随笔、过程性想法和未完成线索。不追求完整，追求持续更新与可回看。
          </p>
        </div>
      </section>

      <div className="container pb-24">
        <div className="home-section-head mb-6">
          <h2 className="home-section-title">最近碎片</h2>
          <Link className="home-inline-link" href="/posts">
            去看完整文章
          </Link>
        </div>

        {fragments.length === 0 ? (
          <p className="text-muted-foreground text-sm py-12 text-center">还没有碎片，去后台添加第一条吧。</p>
        ) : (
          <div className="space-y-3">
            {fragments.map((item) => (
              <article key={item.id} className="home-latest-item p-6">
                {item.publishedAt && (
                  <p className="text-xs text-muted-foreground mb-2">{formatDateTime(item.publishedAt)}</p>
                )}
                <h3 className="font-semibold mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
