import { readFile } from 'node:fs/promises'

import config from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { loadConsoleRegistry } from '../../consoleRegistry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type HealthState = 'ok' | 'warn' | 'error' | 'unknown' | 'not_configured'

interface ConsoleSnapshotService {
  id: string
  docker?: {
    expected?: string[]
    matched?: string[]
    missing?: string[]
    state?: string
    status?: string
    health?: string
    image?: string
    ports?: string
  }
  health?: {
    state: HealthState
    status?: number
    latencyMs?: number
    error?: string
  }
  traefik?: {
    expected?: string[]
    matched?: string[]
    missing?: string[]
    expectedRouters?: string[]
    missingRouters?: string[]
    routers?: string[]
    rule?: string
    status?: string
  }
  timer?: {
    expected?: string[]
    matched?: string[]
    missing?: string[]
    units?: Array<{
      unit: string
      active?: string
      next?: string
      left?: string
      last?: string
      passed?: string
    }>
  }
  timers?: Array<{
    unit: string
    active?: string
    next?: string
    left?: string
    last?: string
    passed?: string
  }>
  timersExpected?: string[]
  timersMissing?: string[]
  systemd?: {
    expected?: string[]
    matched?: string[]
    missing?: string[]
    units?: Array<{
      unit: string
      scope?: string
      active?: string
      sub?: string
      description?: string
      result?: string
      mainPid?: string
    }>
  }
}

interface ConsoleSnapshot {
  version?: number
  generatedAt?: string
  host?: string
  source?: string
  summary?: Record<string, unknown>
  services?: ConsoleSnapshotService[]
  traefik?: Record<string, unknown>
  timers?: Array<Record<string, unknown>>
  docker?: Record<string, unknown>
  errors?: string[]
}

const SNAPSHOT_STALE_AFTER_SECONDS = 180

function snapshotPaths() {
  return [
    process.env.ALETHEIA_CONSOLE_STATUS_SNAPSHOT,
    '/app/config/console-runtime/status.json',
    '/app/config/console/status.json',
    '/app/config/console-status.json',
  ].filter(Boolean) as string[]
}

async function readSnapshot(): Promise<{ path?: string; snapshot?: ConsoleSnapshot; error?: string }> {
  const paths = snapshotPaths()
  const errors: string[] = []

  for (const path of paths) {
    try {
      const raw = await readFile(path, 'utf8')
      return { path, snapshot: JSON.parse(raw) as ConsoleSnapshot }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${path}: ${message}`)
    }
  }

  return { error: errors.join('; ') }
}

function snapshotAgeSeconds(generatedAt?: string) {
  if (!generatedAt) return undefined
  const timestamp = new Date(generatedAt).getTime()
  if (Number.isNaN(timestamp)) return undefined
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
}

async function probeHealth(url: string, expectStatus?: number | number[], timeoutMs = 1600) {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const expected = Array.isArray(expectStatus) ? expectStatus : [expectStatus ?? 200]

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    })
    const latencyMs = Date.now() - startedAt
    return {
      state: expected.includes(response.status) ? 'ok' : 'warn',
      status: response.status,
      latencyMs,
    } satisfies ConsoleSnapshotService['health']
  } catch (error) {
    const latencyMs = Date.now() - startedAt
    return {
      state: 'error',
      latencyMs,
      error: error instanceof Error ? error.message : String(error),
    } satisfies ConsoleSnapshotService['health']
  } finally {
    clearTimeout(timeout)
  }
}

function mergeServiceStatus(
  serviceId: string,
  snapshotServices: ConsoleSnapshotService[] | undefined,
): ConsoleSnapshotService | undefined {
  return snapshotServices?.find((item) => item.id === serviceId)
}

function normalizedTimers(fromSnapshot?: ConsoleSnapshotService) {
  return fromSnapshot?.timers || fromSnapshot?.timer?.units || []
}

export async function GET() {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const registry = await loadConsoleRegistry()
  const snapshotResult = await readSnapshot()
  const snapshot = snapshotResult.snapshot
  const snapshotServices = snapshot?.services || []
  const snapshotAge = snapshotAgeSeconds(snapshot?.generatedAt)

  const services = await Promise.all(
    registry.services.map(async (service) => {
      const fromSnapshot = mergeServiceStatus(service.id, snapshotServices)
      const snapshotHealth = fromSnapshot?.health
      const timers = normalizedTimers(fromSnapshot)
      const liveHealth = !snapshotHealth && service.health
        ? await probeHealth(service.health.url, service.health.expectStatus, service.health.timeoutMs)
        : undefined

      return {
        id: service.id,
        name: service.name,
        riskLevel: service.riskLevel || 'L0',
        hasAdminUi: service.hasAdminUi ?? Boolean(service.adminUrl || service.external || service.internal),
        adminUrl: service.adminUrl || service.external || service.internal,
        runtime: service.runtime,
        capabilities: service.capabilities || [],
        docs: service.docs || [],
        actions: service.actions || [],
        status: {
          docker: fromSnapshot?.docker,
          health: snapshotHealth || liveHealth || { state: service.health ? 'unknown' : 'not_configured' },
          traefik: fromSnapshot?.traefik,
          systemd: fromSnapshot?.systemd,
          timers,
          timer: fromSnapshot?.timer,
          timersExpected: fromSnapshot?.timersExpected || fromSnapshot?.timer?.expected || [],
          timersMissing: fromSnapshot?.timersMissing || fromSnapshot?.timer?.missing || [],
        },
      }
    }),
  )

  const summary = {
    services: services.length,
    healthOk: services.filter((item) => item.status.health?.state === 'ok').length,
    healthWarn: services.filter((item) => item.status.health?.state === 'warn').length,
    healthError: services.filter((item) => item.status.health?.state === 'error').length,
    healthUnknown: services.filter((item) => item.status.health?.state === 'unknown').length,
    healthNotConfigured: services.filter((item) => item.status.health?.state === 'not_configured')
      .length,
    dockerRunning: services.filter((item) => item.status.docker?.state === 'running').length,
    dockerMissing: services.reduce(
      (total, item) => total + (item.status.docker?.missing?.length || 0),
      0,
    ),
    timersKnown: services.reduce((total, item) => total + item.status.timers.length, 0),
    timersMissing: services.reduce(
      (total, item) => total + (item.status.timersMissing?.length || 0),
      0,
    ),
    systemdKnown: services.reduce(
      (total, item) => total + (item.status.systemd?.matched?.length || 0),
      0,
    ),
    systemdMissing: services.reduce(
      (total, item) => total + (item.status.systemd?.missing?.length || 0),
      0,
    ),
    traefikRoutersKnown: services.reduce(
      (total, item) => total + (item.status.traefik?.routers?.length || 0),
      0,
    ),
    traefikRoutersMissing: services.reduce(
      (total, item) =>
        total + (item.status.traefik?.missingRouters?.length || item.status.traefik?.missing?.length || 0),
      0,
    ),
    snapshotErrors: snapshot?.errors?.length || 0,
  }
  const snapshotFresh = snapshotAge !== undefined && snapshotAge <= SNAPSHOT_STALE_AFTER_SECONDS
  const ok = Boolean(snapshot) && snapshotFresh && !registry.fallback && summary.snapshotErrors === 0

  return NextResponse.json({
    ok,
    generatedAt: new Date().toISOString(),
    snapshot: {
      path: snapshotResult.path,
      loaded: Boolean(snapshot),
      generatedAt: snapshot?.generatedAt,
      ageSeconds: snapshotAge,
      staleAfterSeconds: SNAPSHOT_STALE_AFTER_SECONDS,
      fresh: snapshotFresh,
      host: snapshot?.host,
      source: snapshot?.source,
      error: snapshotResult.error,
      errors: snapshot?.errors || [],
    },
    registry: {
      version: registry.version,
      updatedAt: registry.updatedAt,
      services: registry.services.length,
      source: registry.source,
      fallback: registry.fallback,
      errors: registry.errors || [],
    },
    summary,
    services,
  })
}
