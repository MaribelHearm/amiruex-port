import type { Metadata } from 'next'
import Link from 'next/link'
import { BackgroundFX } from '@/components/BackgroundFX'

export function generateMetadata(): Metadata {
  return {
    title: '关于 | About | Amireux',
    description: '关于子湛：我是谁、这个站为什么存在、我现在在做什么。',
  }
}

export default function AboutPage() {
  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">About / 人的入口</p>
          <h1 className="secondary-header__title">你好，我是子湛。</h1>
          <p className="secondary-header__description">
            一个在工程实践、内容写作和轻交互产品之间反复横跳的人。比起“做一个完美站点”，我更在意“把真实的阶段记录下来”。
          </p>
        </div>
      </section>

      <div className="container pb-24 space-y-8">
        <section aria-labelledby="about-now-title">
          <div className="about-block">
            <h2 id="about-now-title" className="text-xl font-bold mb-4 text-primary">当前状态</h2>
            <p className="leading-relaxed opacity-90">
              现在主要在推进这件事：把主站从“页面集合”升级成“有连续输出 + 有工具可玩 + 有个人表达”的长期项目。
              最近重心放在 Blog 的稳定发布节奏，以及 Tools 区的 MVP 落地。
            </p>
          </div>
        </section>

        <section aria-labelledby="about-origin-title">
          <div className="about-block">
            <h2 id="about-origin-title" className="text-xl font-bold mb-4 text-primary">这个站为什么存在</h2>
            <p className="leading-relaxed opacity-90">
              过去很多想法都散落在聊天记录、临时文档和零碎片段里。这个站的意义，是给这些内容一个持续生长的“母体”：
              可以记录、可以迭代、可以被未来的自己复用。
            </p>
          </div>
        </section>

        <section aria-labelledby="about-note-title">
          <div className="about-block">
            <h2 id="about-note-title" className="text-xl font-bold mb-4 text-primary">轻碎碎念</h2>
            <ul className="space-y-3 opacity-90">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>我喜欢把复杂问题拆成可执行的小阶段，再一块块推进。</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>我对“有手感的工具”有执念：哪怕很小，也要真的能用。</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>如果你在这里看到很多“施工中”，那不是敷衍，是我真实的迭代方式。</span>
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="about-next-title">
          <div className="about-block border-dashed opacity-80">
            <h2 id="about-next-title" className="text-xl font-bold mb-4">留白区（持续扩展）</h2>
            <p className="leading-relaxed mb-8">
              下一步会补：时间线、常用工具清单、工作流与设备偏好、以及我长期喜欢的内容入口。
            </p>
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
