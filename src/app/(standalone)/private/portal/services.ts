import type { Payload } from 'payload'

import type { PortalCategory, User } from '@/payload-types'

export interface PortalService {
  name: string
  desc: string
  category: string
  internal?: string
  external?: string
}

export interface PortalConfig {
  services: PortalService[]
  categories: string[]
  portalTagline: string
}

const DEFAULT_SERVICES: PortalService[] = [
  {
    name: 'LobeChat',
    desc: 'AI 对话平台',
    category: '核心应用',
    internal: 'http://192.168.1.103:3210',
    external: 'https://ai.amireux.chat',
  },
  {
    name: 'OpenClaw',
    desc: 'AI 自动化工作台',
    category: '核心应用',
    internal: 'http://192.168.1.103:18789',
    external: 'https://oc.amireux.chat',
  },
  {
    name: 'Dify',
    desc: '工作流 / 建档 / 自动化编排',
    category: '核心应用',
    external: 'https://dify.amireux.chat',
  },
  {
    name: 'Wiki.js',
    desc: '知识库系统',
    category: '核心应用',
    internal: 'http://192.168.1.103:3005',
    external: 'https://wiki.amireux.chat',
  },
  {
    name: 'Immich',
    desc: '照片管理系统',
    category: '核心应用',
    internal: 'http://192.168.1.103:2283',
    external: 'https://p.amireux.chat',
  },
  {
    name: 'Jellyfin',
    desc: '媒体服务器',
    category: '核心应用',
    internal: 'http://192.168.1.103:8096',
    external: 'https://media.amireux.chat',
  },
  {
    name: 'Home Assistant',
    desc: '智能家居自动化',
    category: '核心应用',
    internal: 'http://192.168.1.103:8123',
    external: 'https://ha.amireux.chat',
  },
  {
    name: 'Next Portal',
    desc: '个人数字门户 / CMS 后台',
    category: '核心应用',
    external: 'https://amireux.chat',
  },
  {
    name: 'Sub2API',
    desc: '主中间层 / 聚合 API 网关 / Dify & Claude Code 入口',
    category: 'API 与代理',
    internal: 'http://192.168.1.103:3232',
    external: 'https://clip.amireux.chat',
  },
  {
    name: 'CLIProxyAPI',
    desc: 'CPA 号池 / 特殊反代（运行于 backup-vps）',
    category: 'API 与代理',
    internal: 'http://64.186.228.249:3011/management.html',
  },
  {
    name: 'EasyProxies',
    desc: '代理池管理 / 多端口出口池',
    category: 'API 与代理',
    internal: 'http://192.168.1.103:9888',
    external: 'https://proxy.amireux.chat',
  },
  {
    name: 'GOT-OCR',
    desc: '高精度 OCR 识别服务',
    category: 'API 与代理',
    internal: 'http://192.168.1.103:8866',
  },
  {
    name: 'OutlookMail Plus',
    desc: '邮箱接码 / 验证码提取 / Outlook OAuth',
    category: 'API 与代理',
    internal: 'http://192.168.1.103:5002',
  },
  {
    name: 'Dockge',
    desc: 'Docker Compose 管理面板',
    category: '基础设施',
    internal: 'http://192.168.1.103:5001',
    external: 'https://dockge.amireux.chat',
  },
  {
    name: 'Traefik',
    desc: '反向代理 Dashboard',
    category: '基础设施',
    internal: 'http://192.168.1.103:8080',
    external: 'https://traefik.amireux.chat',
  },
  {
    name: 'Aria2 / AriaNg',
    desc: '下载管理',
    category: '基础设施',
    internal: 'http://192.168.1.103:6880',
    external: 'https://aria.amireux.chat',
  },
  {
    name: 'CasaOS',
    desc: 'NAS 管理面板',
    category: '基础设施',
    internal: 'http://192.168.1.103:8580',
  },
  {
    name: 'Telegram Downloader',
    desc: 'Telegram 媒体下载',
    category: '基础设施',
    internal: 'http://192.168.1.103:5000',
  },
  {
    name: 'Glances',
    desc: '系统监控',
    category: '基础设施',
    internal: 'http://192.168.1.103:61208',
  },
  {
    name: 'MCP Wiki',
    desc: 'Wiki 读写工具',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3001',
  },
  {
    name: 'MCP Wiki Incremental',
    desc: 'Wiki 增量更新',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3007',
  },
  {
    name: 'MCP Search',
    desc: '搜索与网页抓取',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3002',
  },
  {
    name: 'MCP D2',
    desc: 'D2 图表生成',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3003',
  },
  {
    name: 'MCP Mermaid',
    desc: 'Mermaid 图表',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3006',
  },
  {
    name: 'MCP Media',
    desc: '媒体 / B站相关工具',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3004',
  },
  {
    name: 'MCP DevOps',
    desc: 'Docker / 日志只读工具',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3010',
  },
  {
    name: 'MCP Archive Writer',
    desc: 'OpenClaw 归档写入工具',
    category: 'MCP 工具',
    internal: 'http://192.168.1.103:3009',
  },
  { name: 'NapCat', desc: 'QQ 机器人', category: 'QQ Bot', internal: 'http://192.168.1.103:6099' },
  {
    name: 'NapCat Exporter',
    desc: '聊天记录导出 + QCE',
    category: 'QQ Bot',
    internal: 'http://192.168.1.103:6098',
    external: 'http://192.168.1.103:40654/qce-v4-tool',
  },
  {
    name: 'LinuxDo Collector',
    desc: 'LinuxDo 日报采集',
    category: 'QQ Bot',
  },
  {
    name: 'LinuxDo Query',
    desc: 'LinuxDo 按需查询接口',
    category: 'QQ Bot',
    internal: 'http://192.168.1.103:8765',
  },
]

const DEFAULT_CATEGORIES = ['核心应用', 'API 与代理', '基础设施', 'MCP 工具', 'QQ Bot']
const DEFAULT_PORTAL_TAGLINE = 'DIGITAL SOVEREIGNTY PORTAL · 192.168.1.103'

interface PortalCategoryDoc {
  id: string
  name: string
  order?: number | null
  enabled?: boolean | null
}

interface PortalServiceDoc {
  id?: string
  name: string
  desc: string
  internal?: string | null
  external?: string | null
  category: string | PortalCategoryDoc
  enabled?: boolean | null
}

function buildDefaultPortalConfig(): PortalConfig {
  const categories = Array.from(new Set(DEFAULT_SERVICES.map((s) => s.category)))

  return {
    services: DEFAULT_SERVICES,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    portalTagline: process.env.PORTAL_TAGLINE || DEFAULT_PORTAL_TAGLINE,
  }
}

async function seedPortalDataIfEmpty(payload: Payload, user: User) {
  const categoryNames = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...DEFAULT_SERVICES.map((s) => s.category)]),
  )

  const [existingCategories, existingServices] = await Promise.all([
    payload.find({
      collection: 'portal-categories',
      limit: 200,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'portal-services',
      limit: 1000,
      depth: 0,
      user,
      overrideAccess: false,
    }),
  ])

  const categoryMap = new Map<string, string>()

  existingCategories.docs.forEach((category) => {
    categoryMap.set((category as PortalCategory).name, (category as PortalCategory).id)
  })

  for (const [index, categoryName] of categoryNames.entries()) {
    const existingCategoryId = categoryMap.get(categoryName)

    if (!existingCategoryId) {
      const createdCategory = await payload.create({
        collection: 'portal-categories',
        data: {
          name: categoryName,
          order: index,
          enabled: true,
        },
        user,
        overrideAccess: false,
      })

      categoryMap.set(createdCategory.name, createdCategory.id)
      continue
    }

    await payload.update({
      collection: 'portal-categories',
      id: existingCategoryId,
      data: {
        name: categoryName,
        order: index,
        enabled: true,
      },
      user,
      overrideAccess: false,
    })
  }

  const existingServicesByName = new Map<string, PortalServiceDoc>()

  existingServices.docs.forEach((service) => {
    const typedService = service as PortalServiceDoc

    if (typedService.name) {
      existingServicesByName.set(typedService.name, typedService)
    }
  })

  const allowedServiceNames = new Set(DEFAULT_SERVICES.map((service) => service.name))

  for (const [index, service] of DEFAULT_SERVICES.entries()) {
    const categoryId = categoryMap.get(service.category)

    if (!categoryId) {
      continue
    }

    const existingService = existingServicesByName.get(service.name)

    if (existingService?.id) {
      await payload.update({
        collection: 'portal-services',
        id: existingService.id,
        data: {
          name: service.name,
          desc: service.desc,
          category: categoryId,
          internal: service.internal,
          external: service.external,
          order: index,
          enabled: true,
        },
        user,
        overrideAccess: false,
      })

      continue
    }

    await payload.create({
      collection: 'portal-services',
      data: {
        name: service.name,
        desc: service.desc,
        category: categoryId,
        internal: service.internal,
        external: service.external,
        order: index,
        enabled: true,
      },
      user,
      overrideAccess: false,
    })
  }

  for (const service of existingServices.docs as PortalServiceDoc[]) {
    if (!service.id || !service.name || allowedServiceNames.has(service.name)) {
      continue
    }

    await payload.update({
      collection: 'portal-services',
      id: service.id,
      data: {
        enabled: false,
      },
      user,
      overrideAccess: false,
    })
  }
}

export async function getPortalConfig(payload: Payload, user: User): Promise<PortalConfig> {
  const fallback = buildDefaultPortalConfig()

  try {
    await seedPortalDataIfEmpty(payload, user)

    const [categoryResult, serviceResult] = await Promise.all([
      payload.find({
        collection: 'portal-categories',
        where: { enabled: { equals: true } },
        sort: 'order',
        limit: 200,
        depth: 0,
        user,
        overrideAccess: false,
      }),
      payload.find({
        collection: 'portal-services',
        where: { enabled: { equals: true } },
        sort: 'order',
        limit: 500,
        depth: 1,
        user,
        overrideAccess: false,
      }),
    ])

    const categories = (categoryResult.docs as PortalCategoryDoc[])
      .map((item) => item.name)
      .filter(Boolean)

    const services = (serviceResult.docs as PortalServiceDoc[])
      .filter((item) => item.enabled !== false)
      .map((item) => {
        const categoryName = typeof item.category === 'string' ? undefined : item.category?.name

        return {
          name: item.name,
          desc: item.desc,
          category: categoryName || fallback.categories[0] || DEFAULT_CATEGORIES[0],
          internal: item.internal || undefined,
          external: item.external || undefined,
        } satisfies PortalService
      })

    if (services.length === 0) {
      return fallback
    }

    return {
      services,
      categories:
        categories.length > 0 ? categories : Array.from(new Set(services.map((s) => s.category))),
      portalTagline: process.env.PORTAL_TAGLINE || DEFAULT_PORTAL_TAGLINE,
    }
  } catch {
    return fallback
  }
}

export { DEFAULT_SERVICES, DEFAULT_CATEGORIES, DEFAULT_PORTAL_TAGLINE }
