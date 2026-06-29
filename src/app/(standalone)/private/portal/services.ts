import type { Payload } from 'payload'

import type { PortalCategory, User } from '@/payload-types'
import { loadConsoleRegistry, mergeConsoleMeta } from './consoleRegistry'
import type { PortalServiceWithConsole } from './consoleRegistry'

export type PortalService = PortalServiceWithConsole

export interface PortalConfig {
  services: PortalService[]
  categories: string[]
  portalTagline: string
}

const DEFAULT_SERVICES: PortalService[] = []

const DEFAULT_CATEGORIES = ['核心应用', 'API 与代理', '基础设施', 'MCP 工具', '自动化任务', 'QQ Bot']
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

async function buildDefaultPortalConfig(): Promise<PortalConfig> {
  const registry = await loadConsoleRegistry()
  const services = mergeConsoleMeta([], registry)
  const categories = Array.from(new Set(services.map((s) => s.category)))

  return {
    services,
    categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
    portalTagline: process.env.PORTAL_TAGLINE || DEFAULT_PORTAL_TAGLINE,
  }
}

async function syncPortalDataFromRegistry(payload: Payload, user: User) {
  const registry = await loadConsoleRegistry()
  const registryServices = mergeConsoleMeta([], registry)
  const registryServiceNames = new Set(registryServices.map((service) => service.name))
  const categoryNames = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...registryServices.map((s) => s.category)]),
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

  for (const [index, service] of registryServices.entries()) {
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

  if (!registry.fallback && registryServices.length > 0) {
    for (const service of existingServices.docs as PortalServiceDoc[]) {
      if (!service.id || !service.name || registryServiceNames.has(service.name)) {
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
}

export async function getPortalConfig(payload: Payload, user: User): Promise<PortalConfig> {
  const fallback = await buildDefaultPortalConfig()

  try {
    await syncPortalDataFromRegistry(payload, user)

    const registry = await loadConsoleRegistry()
    const registryServices = mergeConsoleMeta([], registry)

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

    const dbServices = (serviceResult.docs as PortalServiceDoc[])
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

    const sourceServices = !registry.fallback && registryServices.length > 0
      ? registryServices
      : dbServices.length > 0
        ? dbServices
        : fallback.services
    const services = mergeConsoleMeta(sourceServices, registry)

    if (services.length === 0) {
      return fallback
    }

    return {
      services,
      categories:
        categories.length > 0
          ? Array.from(new Set([...categories, ...services.map((s) => s.category)]))
          : Array.from(new Set(services.map((s) => s.category))),
      portalTagline: process.env.PORTAL_TAGLINE || DEFAULT_PORTAL_TAGLINE,
    }
  } catch {
    return fallback
  }
}

export { DEFAULT_SERVICES, DEFAULT_CATEGORIES, DEFAULT_PORTAL_TAGLINE }
