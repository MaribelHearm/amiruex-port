import type { Metadata } from 'next'
import Link from 'next/link'
import { BackgroundFX } from '@/components/BackgroundFX'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { About } from '@/payload-types'

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  const data = await getAbout()
  return {
    title: '关于 | About | Amireux',
    description: data?.intro ?? '关于子湛：我是谁、这个站为什么存在、我现在在做什么。',
  }
}

async function getAbout(): Promise<About | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return await payload.findGlobal({ slug: 'about' })
  } catch {
    return null
  }
}

export default async function AboutPage() {
  const data = await getAbout()

  const tag = data?.tag ?? 'About / 人的入口'
  const heading = data?.heading ?? '你好，我是子湛。'
  const intro = data?.intro ?? ''
  const statusTitle = data?.statusTitle ?? '当前状态'
  const statusContent = data?.statusContent ?? ''
  const whyTitle = data?.whyTitle ?? '这个站为什么存在'
  const whyContent = data?.whyContent ?? ''
  const notesTitle = data?.notesTitle ?? '轻碎碎念'
  const notes = data?.notes ?? []
  const placeholderTitle = data?.placeholderTitle ?? '留白区（持续扩展）'
  const placeholderContent = data?.placeholderContent ?? ''

  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">{tag}</p>
          <h1 className="secondary-header__title">{heading}</h1>
          <p className="secondary-header__description">{intro}</p>
        </div>
      </section>

      <div className="container pb-24 space-y-8">
        {statusContent && (
          <section aria-labelledby="about-now-title">
            <div className="about-block">
              <h2 id="about-now-title" className="text-xl font-bold mb-4 text-primary">
                {statusTitle}
              </h2>
              <p className="leading-relaxed opacity-90">{statusContent}</p>
            </div>
          </section>
        )}

        {whyContent && (
          <section aria-labelledby="about-origin-title">
            <div className="about-block">
              <h2 id="about-origin-title" className="text-xl font-bold mb-4 text-primary">
                {whyTitle}
              </h2>
              <p className="leading-relaxed opacity-90">{whyContent}</p>
            </div>
          </section>
        )}

        {notes.length > 0 && (
          <section aria-labelledby="about-note-title">
            <div className="about-block">
              <h2 id="about-note-title" className="text-xl font-bold mb-4 text-primary">
                {notesTitle}
              </h2>
              <ul className="space-y-3 opacity-90">
                {notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{note.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-labelledby="about-next-title">
          <div className="about-block border-dashed opacity-80">
            <h2 id="about-next-title" className="text-xl font-bold mb-4">
              {placeholderTitle}
            </h2>
            {placeholderContent && (
              <p className="leading-relaxed mb-8">{placeholderContent}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <Link href="/posts" className="home-btn home-btn--primary">
                去看 Blog
              </Link>
              <Link href="/coding-tools" className="home-btn">
                去玩 Tools
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
