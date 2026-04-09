import type { Metadata } from 'next'

import Link from 'next/link'

import {
  EXTENSION_MODULES,
  EXTENSION_MODULE_STATUS_LABEL,
  type ExtensionModule,
} from '@/constants/extension-modules'
import { UnderConstruction } from '@/components/UnderConstruction'

export function generateMetadata(): Metadata {
  return {
    title: '扩展模块 / Extensions',
    description: '主结构之外的扩展模块路线、入口和施工状态。',
  }
}

const sortByStatus = (a: ExtensionModule, b: ExtensionModule) => {
  const order: Record<ExtensionModule['status'], number> = {
    available: 0,
    mvp: 1,
    construction: 2,
  }

  return order[a.status] - order[b.status]
}

export default function ExtensionsPage() {
  const modules = [...EXTENSION_MODULES].sort(sortByStatus)

  return (
    <main className="tools-shell pt-16 pb-20">
      <section className="container" aria-labelledby="extensions-page-title">
        <div className="tools-head">
          <h1 id="extensions-page-title">Extensions · 扩展模块</h1>
          <p>这里集中管理扩展模块的必要性、入口位置和开发状态，保证主结构稳定演进。</p>
        </div>
      </section>

      <section className="container mt-8" aria-labelledby="extensions-page-list-title">
        <div className="home-section-head">
          <h2 id="extensions-page-list-title" className="home-section-title">
            模块总览
          </h2>
          <Link className="home-inline-link" href="/">
            返回首页
          </Link>
        </div>

        <div className="extensions-grid">
          {modules.map((item) => {
            if (item.href && item.status !== 'construction') {
              return (
                <Link key={item.slug} href={item.href} className="extensions-card">
                  <p className="extensions-card__status">{EXTENSION_MODULE_STATUS_LABEL[item.status]}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p className="tool-meta mt-2">入口：{item.entry}</p>
                </Link>
              )
            }

            return (
              <div key={item.slug} className="extensions-card extensions-card--construction">
                <p className="extensions-card__status">{EXTENSION_MODULE_STATUS_LABEL[item.status]}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p className="tool-meta mt-2">入口：{item.entry}</p>
                <UnderConstruction tag="Phase 6" title={item.title} description={item.whyNeeded} />
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
