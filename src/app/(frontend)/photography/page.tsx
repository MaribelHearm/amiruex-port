import type { Metadata } from 'next'
import { BackgroundFX } from '@/components/BackgroundFX'
import { Media } from '@/components/Media'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Photo } from '@/payload-types'

export const revalidate = 600

export function generateMetadata(): Metadata {
  return {
    title: '摄影 | Photography | Amireux',
    description: '用镜头记录的瞬间与地方。',
  }
}

export default async function PhotographyPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'photos',
    draft: false,
    limit: 60,
    overrideAccess: false,
    sort: '-takenAt',
    depth: 1,
  })
  const photos = result.docs as Photo[]

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">Photography · 摄影</p>
          <h1 className="secondary-header__title">用镜头记录的瞬间</h1>
          <p className="secondary-header__description">
            不追求专业，只追求真实。每一帧都是某个地方、某个光线、某个当时。
          </p>
        </div>
      </section>

      <div className="container pb-24">
        {photos.length === 0 ? (
          <p className="text-muted-foreground text-sm py-16 text-center">
            还没有照片，去后台上传第一张吧。
          </p>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => (
              <figure key={photo.id} className="photo-card">
                {photo.image && typeof photo.image !== 'string' && (
                  <div className="photo-card__img">
                    <Media
                      resource={photo.image}
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>
                )}
                {(photo.title || photo.location || photo.description) && (
                  <figcaption className="photo-card__caption">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      {photo.title && <span className="font-medium text-sm">{photo.title}</span>}
                      {photo.location && (
                        <span className="text-xs text-muted-foreground">{photo.location}</span>
                      )}
                    </div>
                    {photo.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
