import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'

export type ConsoleRiskLevel = 'L0' | 'L1' | 'L2'

export interface ConsoleHealthConfig {
  type: 'http'
  url: string
  expectStatus?: number | number[]
  timeoutMs?: number
}

export interface ConsoleRuntimeConfig {
  host?: string
  composeProject?: string
  dockerContainer?: string
  dockerContainers?: string[]
  traefikRouters?: string[]
  timerUnits?: string[]
  systemdUnits?: string[]
}

export interface ConsoleActionConfig {
  id: string
  label: string
  kind: 'link' | 'dockge-stack' | 'timer' | 'script'
  riskLevel: ConsoleRiskLevel
  requiresConfirmation?: boolean
  disabled?: boolean
  description?: string
}

export interface ConsoleServiceMeta {
  id: string
  name: string
  desc?: string
  category?: string
  internal?: string
  external?: string
  adminUrl?: string
  hasAdminUi?: boolean
  health?: ConsoleHealthConfig
  runtime?: ConsoleRuntimeConfig
  capabilities?: string[]
  actions?: ConsoleActionConfig[]
  riskLevel?: ConsoleRiskLevel
  docs?: string[]
  notes?: string
}

export interface ConsoleRegistry {
  version: number
  updatedAt?: string
  services: ConsoleServiceMeta[]
  source?: string
  fallback?: boolean
  errors?: string[]
}

export interface PortalServiceWithConsole {
  id?: string
  name: string
  desc: string
  category: string
  internal?: string
  external?: string
  adminUrl?: string
  hasAdminUi?: boolean
  health?: ConsoleHealthConfig
  runtime?: ConsoleRuntimeConfig
  capabilities?: string[]
  actions?: ConsoleActionConfig[]
  riskLevel?: ConsoleRiskLevel
  docs?: string[]
  notes?: string
}

const DEFAULT_REGISTRY: ConsoleRegistry = {
  version: 1,
  updatedAt: '2026-06-29',
  services: [],
}

function normalizeKey(value: string | undefined) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fileExists(path: string) {
  try {
    await access(path, constants.R_OK)
    return true
  } catch {
    return false
  }
}

function registryPaths() {
  return [
    process.env.ALETHEIA_CONSOLE_REGISTRY,
    '/app/config/console/services.json',
    '/app/config/console-services.json',
  ].filter(Boolean) as string[]
}

export async function loadConsoleRegistry(): Promise<ConsoleRegistry> {
  const errors: string[] = []

  for (const path of registryPaths()) {
    if (!(await fileExists(path))) {
      continue
    }

    try {
      const raw = await readFile(path, 'utf8')
      const parsed = JSON.parse(raw) as ConsoleRegistry

      if (Array.isArray(parsed.services)) {
        return {
          version: parsed.version || 1,
          updatedAt: parsed.updatedAt,
          services: parsed.services,
          source: path,
          fallback: false,
          errors,
        }
      }
      errors.push(`${path}: services must be a list`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${path}: ${message}`)
    }
  }

  return {
    ...DEFAULT_REGISTRY,
    source: 'embedded-default',
    fallback: true,
    errors: errors.length > 0 ? errors : ['no readable external registry found'],
  }
}

export function mergeConsoleMeta(
  baseServices: PortalServiceWithConsole[],
  registry: ConsoleRegistry,
): PortalServiceWithConsole[] {
  const metaByName = new Map<string, ConsoleServiceMeta>()
  const metaById = new Map<string, ConsoleServiceMeta>()

  registry.services.forEach((service) => {
    metaByName.set(normalizeKey(service.name), service)
    metaById.set(normalizeKey(service.id), service)
  })

  const seenIds = new Set<string>()

  const merged = baseServices.map((service) => {
    const meta = metaById.get(normalizeKey(service.id)) || metaByName.get(normalizeKey(service.name))

    if (!meta) {
      return service
    }

    seenIds.add(normalizeKey(meta.id))

    const adminUrl =
      meta.adminUrl ||
      meta.external ||
      meta.internal ||
      service.adminUrl ||
      service.external ||
      service.internal

    return {
      ...service,
      id: meta.id || service.id,
      desc: meta.desc || service.desc,
      category: meta.category || service.category,
      internal: meta.internal || service.internal,
      external: meta.external || service.external,
      adminUrl,
      hasAdminUi: meta.hasAdminUi ?? service.hasAdminUi ?? Boolean(adminUrl),
      health: meta.health,
      runtime: meta.runtime,
      capabilities: meta.capabilities,
      actions: meta.actions,
      riskLevel: meta.riskLevel,
      docs: meta.docs,
      notes: meta.notes,
    }
  })

  registry.services.forEach((service) => {
    const key = normalizeKey(service.id)
    const alreadyPresent = seenIds.has(key) || merged.some((item) => normalizeKey(item.name) === normalizeKey(service.name))

    if (alreadyPresent) {
      return
    }

    merged.push({
      id: service.id,
      name: service.name,
      desc: service.desc || '',
      category: service.category || '未分类',
      internal: service.internal,
      external: service.external,
      adminUrl: service.adminUrl || service.external || service.internal,
      hasAdminUi: service.hasAdminUi ?? Boolean(service.adminUrl || service.external || service.internal),
      health: service.health,
      runtime: service.runtime,
      capabilities: service.capabilities,
      actions: service.actions,
      riskLevel: service.riskLevel,
      docs: service.docs,
      notes: service.notes,
    })
  })

  return merged
}

export { DEFAULT_REGISTRY }
