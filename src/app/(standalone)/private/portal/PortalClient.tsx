'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  ArrowUp,
  CloudRain,
  Moon,
  Cloud,
  Sun,
  List,
  Grid3X3,
  Search,
  ChevronDown,
  Sparkles,
  Activity,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'L0' | 'L1' | 'L2'
type HealthState = 'ok' | 'warn' | 'error' | 'unknown' | 'not_configured'

interface ServiceAction {
  id: string
  label: string
  kind: 'link' | 'dockge-stack' | 'timer' | 'script'
  riskLevel: RiskLevel
  requiresConfirmation?: boolean
  disabled?: boolean
  description?: string
}

interface ServiceRuntime {
  host?: string
  composeProject?: string
  dockerContainer?: string
  dockerContainers?: string[]
  traefikRouters?: string[]
  timerUnits?: string[]
  systemdUnits?: string[]
}

interface Service {
  id?: string
  name: string
  desc: string
  category: string
  internal?: string
  external?: string
  adminUrl?: string
  hasAdminUi?: boolean
  riskLevel?: RiskLevel
  runtime?: ServiceRuntime
  capabilities?: string[]
  actions?: ServiceAction[]
  docs?: string[]
  notes?: string
}

interface ConsoleServiceStatus {
  id: string
  name: string
  riskLevel: RiskLevel
  hasAdminUi: boolean
  adminUrl?: string
  runtime?: ServiceRuntime
  capabilities: string[]
  docs: string[]
  actions: ServiceAction[]
  status: {
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
    health?: { state: HealthState; status?: number; latencyMs?: number; error?: string }
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
        scope?: string
        active?: string
        next?: string
        left?: string
        last?: string
        passed?: string
      }>
    }
    timers?: Array<{
      unit: string
      scope?: string
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
}

interface ConsoleStatusResponse {
  ok: boolean
  generatedAt: string
  snapshot?: {
    loaded?: boolean
    generatedAt?: string
    ageSeconds?: number
    staleAfterSeconds?: number
    fresh?: boolean
    host?: string
    source?: string
    path?: string
    error?: string
    errors?: string[]
  }
  summary: {
    services: number
    healthOk: number
    healthWarn: number
    healthError: number
    healthUnknown?: number
    healthNotConfigured?: number
    dockerRunning: number
    dockerMissing?: number
    timersKnown: number
    timersMissing?: number
    systemdKnown?: number
    systemdMissing?: number
    traefikRoutersKnown?: number
    traefikRoutersMissing?: number
    snapshotErrors?: number
  }
  registry?: {
    version?: number
    updatedAt?: string
    services?: number
    source?: string
    fallback?: boolean
    errors?: string[]
  }
  services: ConsoleServiceStatus[]
}

type ThemeKey = 'storm' | 'night' | 'day'
type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'healthy' | 'attention' | 'no-ui' | 'l2'

interface ThemeConfig {
  name: string
  bg1: string
  bg2: string
  primary: string
  secondary: string
  accent: string
  text: string
  textDim: string
  glow: string
  titleColor: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface PortalClientProps {
  services: Service[]
  categories: string[]
  portalTagline: string
}

const CATEGORY_COLORS: Record<string, { color: string; glow: string }> = {
  核心应用: { color: '#bb9af7', glow: 'rgba(187, 154, 247, 0.3)' },
  'API 与代理': { color: '#7dcfff', glow: 'rgba(125, 207, 255, 0.3)' },
  基础设施: { color: '#9ece6a', glow: 'rgba(158, 206, 106, 0.3)' },
  'MCP 工具': { color: '#ff9e64', glow: 'rgba(255, 158, 100, 0.3)' },
  自动化任务: { color: '#e0af68', glow: 'rgba(224, 175, 104, 0.3)' },
  'QQ Bot': { color: '#f7768e', glow: 'rgba(247, 118, 142, 0.3)' },
}

const DEFAULT_CATEGORY_COLOR = { color: '#7aa2f7', glow: 'rgba(122, 162, 247, 0.3)' }

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR
}

function getServiceKey(service: Pick<Service, 'id' | 'name'>) {
  return service.id || service.name.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-')
}

function getDomIdPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item'
}

function getCategoryDomId(category: string) {
  return `console-category-${getDomIdPart(category)}`
}

function getHealthLabel(state?: HealthState) {
  switch (state) {
    case 'ok':
      return '健康'
    case 'warn':
      return '告警'
    case 'error':
      return '异常'
    case 'not_configured':
      return '未配置'
    default:
      return '未知'
  }
}

function getHealthColor(state?: HealthState) {
  switch (state) {
    case 'ok':
      return '#9ece6a'
    case 'warn':
      return '#e0af68'
    case 'error':
      return '#f7768e'
    case 'not_configured':
      return '#787c99'
    default:
      return '#7aa2f7'
  }
}

function isAttentionHealth(state?: HealthState) {
  return !state || state === 'warn' || state === 'error' || state === 'unknown'
}

function riskLabel(level?: RiskLevel) {
  if (level === 'L2') return '风险动作需确认'
  if (level === 'L1') return '安全动作'
  return '只读'
}

function formatSnapshotTime(value?: string) {
  if (!value) return '等待 snapshot'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSnapshotAge(value?: string) {
  if (!value) return '未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知'
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  const hours = Math.floor(diffMinutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function formatSnapshotAgeSeconds(ageSeconds?: number, generatedAt?: string) {
  if (typeof ageSeconds === 'number') {
    if (ageSeconds < 60) return ageSeconds <= 5 ? '刚刚' : `${ageSeconds} 秒前`
    const minutes = Math.floor(ageSeconds / 60)
    if (minutes < 60) return `${minutes} 分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} 小时前`
    return `${Math.floor(hours / 24)} 天前`
  }
  return formatSnapshotAge(generatedAt)
}

function getSnapshotFreshness(snapshot?: ConsoleStatusResponse['snapshot']) {
  if (!snapshot?.loaded) return { label: 'pending', detail: '未加载', color: '#7aa2f7' }
  if (snapshot.fresh === true) {
    return {
      label: 'fresh',
      detail: formatSnapshotAgeSeconds(snapshot.ageSeconds, snapshot.generatedAt),
      color: '#9ece6a',
    }
  }
  if (snapshot.fresh === false && typeof snapshot.ageSeconds === 'number') {
    return {
      label: 'stale',
      detail: formatSnapshotAgeSeconds(snapshot.ageSeconds, snapshot.generatedAt),
      color: '#f7768e',
    }
  }
  if (!snapshot.generatedAt) return { label: 'unknown', detail: '无时间', color: '#7aa2f7' }
  const value = snapshot.generatedAt
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { label: 'unknown', detail: '时间异常', color: '#e0af68' }
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (diffMinutes <= 15) return { label: 'fresh', detail: formatSnapshotAge(value), color: '#9ece6a' }
  if (diffMinutes <= 60) return { label: 'aging', detail: formatSnapshotAge(value), color: '#e0af68' }
  return { label: 'stale', detail: formatSnapshotAge(value), color: '#f7768e' }
}

function getStatusFilterLabel(filter: StatusFilter) {
  switch (filter) {
    case 'healthy':
      return '健康'
    case 'attention':
      return '需关注'
    case 'no-ui':
      return '无后台'
    case 'l2':
      return 'L2'
    default:
      return '全部'
  }
}

function getRuntimeTags(runtime?: ServiceRuntime) {
  return [
    runtime?.host,
    runtime?.composeProject,
    runtime?.dockerContainer,
    ...(runtime?.dockerContainers || []),
    ...(runtime?.traefikRouters || []),
    ...(runtime?.timerUnits || []),
    ...(runtime?.systemdUnits || []),
  ].filter(Boolean) as string[]
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function compactText(value?: string, max = 42) {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function getAttentionReason(state?: HealthState, riskLevel?: RiskLevel) {
  if (state === 'error') return '健康检查异常'
  if (state === 'warn') return '健康检查告警'
  if (state === 'unknown') return '状态未知'
  if (state === 'not_configured') return '未配置健康检查'
  if (riskLevel === 'L2') return 'L2 高风险动作'
  return '需要确认'
}

function getAttentionRank(state?: HealthState, riskLevel?: RiskLevel) {
  if (state === 'error') return 0
  if (state === 'warn') return 1
  if (!state || state === 'unknown') return 2
  if (riskLevel === 'L2') return 3
  return 4
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  storm: {
    name: 'Storm',
    bg1: 'rgba(26, 27, 38, 0.3)',
    bg2: 'rgba(36, 40, 59, 0.4)',
    primary: '#7aa2f7',
    secondary: '#7dcfff',
    accent: '#bb9af7',
    text: '#c0caf5',
    textDim: '#9aa5ce',
    glow: 'rgba(125, 207, 255, 0.2)',
    titleColor: '#c0caf5',
  },
  night: {
    name: 'Night',
    bg1: 'rgba(16, 16, 30, 0.3)',
    bg2: 'rgba(26, 27, 38, 0.4)',
    primary: '#a9b1d6',
    secondary: '#7aa2f7',
    accent: '#bb9af7',
    text: '#a9b1d6',
    textDim: '#787c99',
    glow: 'rgba(169, 177, 214, 0.2)',
    titleColor: '#a9b1d6',
  },
  day: {
    name: 'Day',
    bg1: 'rgba(213, 214, 219, 0.2)',
    bg2: 'rgba(227, 228, 234, 0.3)',
    primary: '#3760bf',
    secondary: '#188092',
    accent: '#7847bd',
    text: '#343b58',
    textDim: '#565a6e',
    glow: 'rgba(55, 96, 191, 0.15)',
    titleColor: '#343b58',
  },
}

const THEME_ICONS: Record<
  ThemeKey,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  storm: Moon,
  night: Cloud,
  day: Sun,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalClient({ services, categories, portalTagline }: PortalClientProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories))
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [theme, setTheme] = useState<ThemeKey>('storm')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [rainEnabled, setRainEnabled] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [consoleStatus, setConsoleStatus] = useState<ConsoleStatusResponse | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [particles, setParticles] = useState<
    { x: number; y: number; size: number; opacity: number; anim: number; duration: number }[]
  >([])
  const [raindrops, setRaindrops] = useState<
    {
      x: number
      y: number
      size: number
      speed: number
      delay: number
      opacity: number
      blur: number
    }[]
  >([])

  const statusByService = useMemo(() => {
    const map = new Map<string, ConsoleServiceStatus>()
    consoleStatus?.services.forEach((item) => map.set(item.id, item))
    return map
  }, [consoleStatus])

  const refreshConsoleStatus = async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const response = await fetch('/private/portal/api/status', {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error(`status api ${response.status}`)
      }

      const payload = (await response.json()) as ConsoleStatusResponse
      setConsoleStatus(payload)
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : String(error))
    } finally {
      setStatusLoading(false)
    }
  }

  const currentTheme = THEMES[theme]

  useEffect(() => {
    setMounted(true)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotionPreference = () => {
      const shouldReduce = motionQuery.matches
      setReducedMotion(shouldReduce)
      if (shouldReduce) {
        setParticles([])
        setRaindrops([])
        return
      }
      setParticles(
        Array.from({ length: 50 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          anim: i % 3,
          duration: 15 + Math.random() * 10,
        })),
      )
      setRaindrops(
        Array.from({ length: 100 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * -50,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 1.5 + 1,
          delay: Math.random() * 5,
          opacity: Math.random() * 0.5 + 0.3,
          blur: Math.random() * 2 + 1,
        })),
      )
    }

    applyMotionPreference()
    motionQuery.addEventListener('change', applyMotionPreference)
    setCurrentTime(new Date().toLocaleTimeString('zh-CN'))
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('zh-CN')), 1000)
    return () => {
      motionQuery.removeEventListener('change', applyMotionPreference)
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    refreshConsoleStatus()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY })
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      setScrollProgress(scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0)
      setShowScrollTop(scrolled > 300)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const filteredServices = useMemo(() => {
    const searchText = search.trim().toLowerCase()
    return services.filter((s) => {
      const serviceStatus = statusByService.get(getServiceKey(s))
      const healthState = serviceStatus?.status.health?.state || 'unknown'
      const hasAdminUi =
        serviceStatus?.hasAdminUi ?? s.hasAdminUi ?? Boolean(s.adminUrl || s.external || s.internal)
      const riskLevel = serviceStatus?.riskLevel || s.riskLevel || 'L0'
      const runtime = serviceStatus?.runtime || s.runtime
      const capabilities = serviceStatus?.capabilities?.length
        ? serviceStatus.capabilities
        : s.capabilities || []
      const searchHaystack = [
        s.name,
        s.desc,
        s.category,
        ...getRuntimeTags(runtime),
        ...capabilities,
      ]
      const matchesSearch =
        searchText === '' || searchHaystack.some((value) => value.toLowerCase().includes(searchText))
      const matchesCategory = !selectedCategory || s.category === selectedCategory
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'healthy' && healthState === 'ok') ||
        (statusFilter === 'attention' && isAttentionHealth(healthState)) ||
        (statusFilter === 'no-ui' && !hasAdminUi) ||
        (statusFilter === 'l2' && riskLevel === 'L2')
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [search, selectedCategory, services, statusByService, statusFilter])

  const filterCounts = useMemo(() => {
    const base = {
      all: services.length,
      healthy: 0,
      attention: 0,
      'no-ui': 0,
      l2: 0,
    } satisfies Record<StatusFilter, number>

    services.forEach((service) => {
      const serviceStatus = statusByService.get(getServiceKey(service))
      const healthState = serviceStatus?.status.health?.state || 'unknown'
      const adminUrl =
        serviceStatus?.adminUrl || service.adminUrl || service.external || service.internal
      const hasAdminUi = serviceStatus?.hasAdminUi ?? service.hasAdminUi ?? Boolean(adminUrl)
      const riskLevel = serviceStatus?.riskLevel || service.riskLevel || 'L0'

      if (healthState === 'ok') base.healthy += 1
      if (isAttentionHealth(healthState)) base.attention += 1
      if (!hasAdminUi) base['no-ui'] += 1
      if (riskLevel === 'L2') base.l2 += 1
    })

    return base
  }, [services, statusByService])

  const groupedServices = useMemo(() => {
    const grouped: Record<string, Service[]> = {}
    filteredServices.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = []
      grouped[s.category].push(s)
    })
    return grouped
  }, [filteredServices])

  const dashboardStats = useMemo(() => {
    const healthOk =
      consoleStatus?.summary.healthOk ??
      services.filter(
        (service) => statusByService.get(getServiceKey(service))?.status.health?.state === 'ok',
      ).length
    const healthWarn =
      consoleStatus?.summary.healthWarn ??
      services.filter(
        (service) => statusByService.get(getServiceKey(service))?.status.health?.state === 'warn',
      ).length
    const healthError =
      consoleStatus?.summary.healthError ??
      services.filter(
        (service) => statusByService.get(getServiceKey(service))?.status.health?.state === 'error',
      ).length
    const unknown =
      consoleStatus?.summary.healthUnknown ??
      services.filter((service) => {
        const state = statusByService.get(getServiceKey(service))?.status.health?.state
        return !state || state === 'unknown'
      }).length
    const notConfigured =
      consoleStatus?.summary.healthNotConfigured ??
      services.filter(
        (service) =>
          statusByService.get(getServiceKey(service))?.status.health?.state === 'not_configured',
      ).length

    return {
      services: consoleStatus?.summary.services ?? services.length,
      healthOk,
      healthWarn,
      healthError,
      healthUnknown: unknown,
      healthNotConfigured: notConfigured,
      attention: healthWarn + healthError + unknown,
      dockerRunning: consoleStatus?.summary.dockerRunning ?? 0,
      dockerMissing: consoleStatus?.summary.dockerMissing ?? 0,
      timersKnown: consoleStatus?.summary.timersKnown ?? 0,
      timersMissing: consoleStatus?.summary.timersMissing ?? 0,
      systemdKnown: consoleStatus?.summary.systemdKnown ?? 0,
      systemdMissing: consoleStatus?.summary.systemdMissing ?? 0,
      traefikRoutersKnown: consoleStatus?.summary.traefikRoutersKnown ?? 0,
      traefikRoutersMissing: consoleStatus?.summary.traefikRoutersMissing ?? 0,
      snapshotErrors: consoleStatus?.summary.snapshotErrors ?? consoleStatus?.snapshot?.errors?.length ?? 0,
      noAdminUi: services.filter((service) => {
        const serviceStatus = statusByService.get(getServiceKey(service))
        return !(
          serviceStatus?.hasAdminUi ??
          service.hasAdminUi ??
          Boolean(service.adminUrl || service.external || service.internal)
        )
      }).length,
      l2: services.filter((service) => {
        const serviceStatus = statusByService.get(getServiceKey(service))
        return (serviceStatus?.riskLevel || service.riskLevel) === 'L2'
      }).length,
    }
  }, [consoleStatus, services, statusByService])

  const healthDistribution = useMemo(() => {
    const total = Math.max(dashboardStats.services, 1)
    const unknown = dashboardStats.healthUnknown
    const notConfigured = dashboardStats.healthNotConfigured

    return [
      {
        key: 'ok',
        label: '健康',
        count: dashboardStats.healthOk,
        color: '#9ece6a',
        width: `${(dashboardStats.healthOk / total) * 100}%`,
      },
      {
        key: 'warn',
        label: '告警',
        count: dashboardStats.healthWarn,
        color: '#e0af68',
        width: `${(dashboardStats.healthWarn / total) * 100}%`,
      },
      {
        key: 'error',
        label: '异常',
        count: dashboardStats.healthError,
        color: '#f7768e',
        width: `${(dashboardStats.healthError / total) * 100}%`,
      },
      {
        key: 'unknown',
        label: '未知',
        count: unknown,
        color: '#7aa2f7',
        width: `${(unknown / total) * 100}%`,
      },
      {
        key: 'not-configured',
        label: '未配置',
        count: notConfigured,
        color: '#787c99',
        width: `${(notConfigured / total) * 100}%`,
      },
    ]
  }, [dashboardStats])
  const healthDistributionText = healthDistribution
    .map((segment) => `${segment.label} ${segment.count}`)
    .join('，')

  const attentionCandidates = useMemo(() => {
    return services
      .map((service) => {
        const serviceStatus = statusByService.get(getServiceKey(service))
        const healthState = serviceStatus?.status.health?.state
        const riskLevel = serviceStatus?.riskLevel || service.riskLevel || 'L0'
        const runtime = serviceStatus?.runtime || service.runtime
        return {
          service,
          serviceStatus,
          healthState,
          riskLevel,
          runtime,
          reason: getAttentionReason(healthState, riskLevel),
          rank: getAttentionRank(healthState, riskLevel),
        }
      })
      .filter((item) => item.rank < 4)
      .sort((a, b) => a.rank - b.rank || a.service.name.localeCompare(b.service.name))
  }, [services, statusByService])
  const attentionItems = attentionCandidates.slice(0, 5)

  const operationsPulse = useMemo(
    () => [
      {
        label: '后台',
        value: dashboardStats.services - dashboardStats.noAdminUi,
        hint: '可跳转',
      },
      {
        label: '无后台',
        value: dashboardStats.noAdminUi,
        hint: '仅运行态',
      },
      {
        label: '确认门',
        value: dashboardStats.l2,
        hint: 'L2 动作',
      },
    ],
    [dashboardStats],
  )

  const categorySummaries = useMemo(() => {
    return categories
      .map((category) => {
        const items = services.filter((service) => service.category === category)
        const visible = filteredServices.filter((service) => service.category === category).length
        return {
          category,
          count: items.length,
          visible,
          ok: items.filter(
            (service) => statusByService.get(getServiceKey(service))?.status.health?.state === 'ok',
          ).length,
          attention: items.filter((service) => {
            const state = statusByService.get(getServiceKey(service))?.status.health?.state
            return isAttentionHealth(state)
          }).length,
          l2: items.filter((service) => {
            const serviceStatus = statusByService.get(getServiceKey(service))
            return (serviceStatus?.riskLevel || service.riskLevel) === 'L2'
          }).length,
          noUi: items.filter((service) => {
            const serviceStatus = statusByService.get(getServiceKey(service))
            const adminUrl =
              serviceStatus?.adminUrl || service.adminUrl || service.external || service.internal
            const hasAdminUi = serviceStatus?.hasAdminUi ?? service.hasAdminUi ?? Boolean(adminUrl)
            return !hasAdminUi
          }).length,
        }
      })
      .filter((item) => item.count > 0)
  }, [categories, filteredServices, services, statusByService])

  const snapshotFreshness = getSnapshotFreshness(consoleStatus?.snapshot)
  const activeFilters = [
    statusFilter !== 'all' ? `状态：${getStatusFilterLabel(statusFilter)}` : null,
    selectedCategory ? `分类：${selectedCategory}` : null,
    search.trim() ? `搜索：${search.trim()}` : null,
  ].filter(Boolean) as string[]
  const clearFilters = () => {
    setStatusFilter('all')
    setSelectedCategory(null)
    setSearch('')
  }

  const focusServiceGroup = (category: string, nextFilter: StatusFilter) => {
    setSelectedCategory(category)
    setStatusFilter(nextFilter)
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.add(category)
      return next
    })
    window.requestAnimationFrame(() => {
      document.getElementById(getCategoryDomId(category))?.scrollIntoView({
        block: 'start',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const linkTextColor = theme === 'day' ? '#ffffff' : '#1a1b26'
  const shouldAnimate = mounted && !reducedMotion

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Scroll progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: '3px',
          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
          boxShadow: `0 0 10px ${currentTheme.primary}`,
          zIndex: 9999,
          transition: 'width 0.1s ease-out',
        }}
      />

      {/* Background image */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/backgrounds/2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter:
            theme === 'day'
              ? 'brightness(0.9) saturate(1.2)'
              : 'brightness(0.65) saturate(1.1) hue-rotate(5deg)',
          zIndex: -2,
        }}
      />

      {/* Theme overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${currentTheme.bg1} 0%, ${currentTheme.bg2} 100%)`,
          zIndex: -1,
        }}
      />

      {/* Particles */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: currentTheme.primary,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${currentTheme.primary}`,
              animation: `float-${p.anim} ${p.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Rain */}
      {rainEnabled && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          {raindrops.map((drop, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: `${drop.size}px`,
                height: `${drop.size * 4}px`,
                borderRadius: '50%',
                background: `linear-gradient(180deg, ${currentTheme.primary}${Math.floor(drop.opacity * 100)}, ${currentTheme.secondary}40)`,
                filter: `blur(${drop.blur}px)`,
                animation: `global-raindrop ${5 / drop.speed}s linear ${drop.delay}s infinite`,
                opacity: drop.opacity,
              }}
            />
          ))}
        </div>
      )}

      {/* Mouse glow */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${currentTheme.glow}, transparent 40%)`,
          transition: 'background 0.05s ease-out',
        }}
      />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          type="button"
	          aria-label="回到页面顶部"
	          onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            padding: '1rem',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            border: 'none',
            borderRadius: '50%',
            color: '#1a1b26',
            cursor: 'pointer',
            boxShadow: `0 0 20px ${currentTheme.primary}80`,
            zIndex: 1000,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowUp size={24} />
        </button>
      )}

      {/* Main content */}
      <div className="portal-main-shell" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '3rem',
              paddingBottom: '2rem',
              borderBottom: `1px solid ${currentTheme.primary}33`,
            }}
          >
            {/* Controls row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: currentTheme.textDim,
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                {currentTime}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Rain toggle */}
                <button
                  className="control-btn"
                  type="button"
                  onClick={() => setRainEnabled((v) => !v)}
                  title={rainEnabled ? '关闭雨效' : '开启雨效'}
                  aria-label={rainEnabled ? '关闭雨效' : '开启雨效'}
                  aria-pressed={rainEnabled}
                  style={{
                    padding: '0.5rem',
                    background: rainEnabled
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                      : currentTheme.bg1,
                    border: `1px solid ${rainEnabled ? currentTheme.secondary : currentTheme.primary}40`,
                    borderRadius: '0.5rem',
                    color: rainEnabled ? '#1a1b26' : currentTheme.primary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: rainEnabled ? `0 0 15px ${currentTheme.primary}66` : 'none',
                  }}
                >
                  <CloudRain size={16} />
                </button>

                {/* Theme buttons */}
                {(Object.keys(THEMES) as ThemeKey[]).map((tk) => {
                  const t = THEMES[tk]
                  const ThemeIcon = THEME_ICONS[tk]
                  const active = theme === tk
                  return (
                    <button
                      key={tk}
                      className="control-btn"
                      type="button"
                      onClick={() => setTheme(tk)}
                      title={t.name}
                      aria-label={`切换主题：${t.name}`}
                      aria-pressed={active}
                      style={{
                        padding: '0.5rem',
                        background: active
                          ? `linear-gradient(135deg, ${t.primary}, ${t.secondary})`
                          : t.bg1,
                        border: `1px solid ${active ? t.secondary : t.primary}40`,
                        borderRadius: '0.5rem',
                        color: active ? '#1a1b26' : t.primary,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: active ? `0 0 15px ${t.primary}66` : 'none',
                      }}
                    >
                      <ThemeIcon size={16} />
                    </button>
                  )
                })}

                {/* View mode toggle */}
                <button
                  className="control-btn"
                  type="button"
                  onClick={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
                  title={viewMode === 'grid' ? '切换列表视图' : '切换网格视图'}
                  aria-label={viewMode === 'grid' ? '切换列表视图' : '切换网格视图'}
                  aria-pressed={viewMode === 'list'}
                  style={{
                    padding: '0.5rem',
                    background: currentTheme.bg1,
                    border: `1px solid ${currentTheme.primary}40`,
                    borderRadius: '0.5rem',
                    color: currentTheme.primary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {viewMode === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                className="title-decoration"
                style={{
                  position: 'absolute',
                  left: '-120px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '100px',
                  height: '2px',
                  background: `linear-gradient(90deg, transparent, ${currentTheme.primary})`,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '-3px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentTheme.primary,
                    boxShadow: `0 0 10px ${currentTheme.primary}`,
                    animation: shouldAnimate ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                  }}
                />
              </div>

              <h1
                className="portal-title"
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 900,
                  color: currentTheme.titleColor,
                  marginBottom: '0.5rem',
                  textShadow: `0 0 40px ${currentTheme.primary}80, 0 0 80px ${currentTheme.secondary}60`,
                  filter: `drop-shadow(0 0 20px ${currentTheme.secondary}80)`,
                  letterSpacing: '0.1em',
                }}
              >
                {'Aletheia'.split('').map((char, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      animation: shouldAnimate ? `letter-appear 0.5s ease-out ${i * 0.1}s both` : 'none',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </h1>

              <div
                className="title-decoration"
                style={{
                  position: 'absolute',
                  right: '-120px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '100px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${currentTheme.primary}, transparent)`,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '-3px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentTheme.primary,
                    boxShadow: `0 0 10px ${currentTheme.primary}`,
                    animation: shouldAnimate ? 'pulse-dot 2s ease-in-out infinite 0.5s' : 'none',
                  }}
                />
              </div>
            </div>

            <p
              style={{
                color: currentTheme.primary,
                fontSize: '0.9rem',
                letterSpacing: '0.15em',
                textShadow: `0 0 10px ${currentTheme.primary}80`,
                animation: shouldAnimate ? 'fade-in 1s ease-out 0.8s both' : 'none',
              }}
            >
              {portalTagline}
            </p>
          </div>

          {/* Console status summary */}
          <section
            className="console-status-shell"
            style={{ animation: shouldAnimate ? 'slide-up 0.6s ease-out 0.9s both' : 'none' }}
          >
            <div
              className="console-status-card"
              style={{ borderColor: `${currentTheme.primary}33` }}
            >
              <div className="console-dashboard-overview">
                <div className="console-dashboard-copy">
                  <p className="console-eyebrow" style={{ color: currentTheme.primary }}>
                    HOMELAB DASHBOARD
                  </p>
                  <h2 className="console-status-title" style={{ color: currentTheme.text }}>
                    Aletheia Console
                  </h2>
                  <p className="console-status-desc" style={{ color: currentTheme.textDim }}>
                    这是门户站里的运维仪表盘：配置驱动服务登记，聚合 Docker / Traefik /
                    systemd / health snapshot；有后台直接跳转，没后台展示运行信息，L2
                    动作保持二次确认。
                  </p>

                  <div className="console-health-panel">
                    <div className="console-health-strip" aria-label="服务健康分布">
                      {healthDistribution.map((segment) => (
                        <span
                          key={segment.key}
                          title={`${segment.label}: ${segment.count}`}
                          style={{
                            width: segment.count > 0 ? segment.width : '0%',
                            minWidth: segment.count > 0 ? '0.2rem' : 0,
                            background: `linear-gradient(90deg, ${segment.color}, ${segment.color}bb)`,
                            boxShadow:
                              segment.count > 0 ? `0 0 14px ${segment.color}55` : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <div className="console-health-legend">
                      {healthDistribution.map((segment) => (
                        <span key={segment.key} style={{ color: currentTheme.textDim }}>
                          <i style={{ background: segment.color, boxShadow: `0 0 8px ${segment.color}` }} />
                          {segment.label} {segment.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

	                <aside className="console-snapshot-panel" aria-label="当前快照">
                  <div className="console-snapshot-grid">
                    <div>
                      <span style={{ color: currentTheme.textDim }}>snapshot</span>
                      <strong style={{ color: snapshotFreshness.color }}>
                        {snapshotFreshness.label}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: currentTheme.textDim }}>age</span>
                      <strong style={{ color: currentTheme.text }}>
                        {snapshotFreshness.detail}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: currentTheme.textDim }}>registry</span>
                      <strong style={{ color: currentTheme.text }}>
                        {consoleStatus?.registry?.version
                          ? `v${consoleStatus.registry.version} · ${consoleStatus.registry.services ?? dashboardStats.services}`
                          : 'unknown'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: currentTheme.textDim }}>visible</span>
                      <strong style={{ color: currentTheme.text }}>
                        {filteredServices.length}/{dashboardStats.services}
                      </strong>
                    </div>
                  </div>
	                  <button
                    className="console-refresh-btn"
                    type="button"
                    onClick={refreshConsoleStatus}
                    disabled={statusLoading}
	                    aria-label="刷新 Console 状态快照"
	                    aria-busy={statusLoading}
                    style={{
                      color: currentTheme.primary,
                      borderColor: `${currentTheme.primary}55`,
                    }}
                  >
                    <RefreshCw size={16} className={statusLoading ? 'console-spin' : undefined} />
                    刷新状态
                  </button>
                </aside>
              </div>

              <div className="console-metrics console-metrics--dashboard">
                {[
                  ['服务', String(dashboardStats.services), 'registry'],
                  ['健康', String(dashboardStats.healthOk), 'health ok'],
                  ['需关注', String(dashboardStats.attention), 'warn/error/unknown'],
                  ['Docker', String(dashboardStats.dockerRunning), `${dashboardStats.dockerMissing} missing`],
                  ['Traefik', String(dashboardStats.traefikRoutersKnown), `${dashboardStats.traefikRoutersMissing} missing`],
                  ['Timers', String(dashboardStats.timersKnown), `${dashboardStats.timersMissing} missing`],
                  ['Systemd', String(dashboardStats.systemdKnown), `${dashboardStats.systemdMissing} missing`],
                  ['L2', String(dashboardStats.l2), '需确认'],
                ].map(([label, value, hint]) => (
                  <div className="console-metric console-metric--dense" key={label}>
                    <span style={{ color: currentTheme.textDim }}>{label}</span>
                    <strong style={{ color: currentTheme.text }}>{value}</strong>
                    <small style={{ color: currentTheme.textDim }}>{hint}</small>
                  </div>
                ))}
	              </div>

	              {(dashboardStats.snapshotErrors > 0 || consoleStatus?.snapshot?.error || consoleStatus?.registry?.fallback) && (
	                <div className="console-snapshot-alert" role="alert" style={{ color: '#f7768e' }}>
	                  snapshot 采集有异常：
	                  {consoleStatus?.snapshot?.error ||
	                    consoleStatus?.snapshot?.errors?.slice(0, 2).join('；') ||
	                    consoleStatus?.registry?.errors?.slice(0, 2).join('；') ||
	                    'registry fallback'}
	                </div>
	              )}

              <div className="console-dashboard-panels">
                <section className="console-panel console-attention-panel">
                  <div className="console-panel-head">
                    <div>
                      <p className="console-eyebrow" style={{ color: currentTheme.primary }}>
                        ATTENTION
                      </p>
                      <h3 style={{ color: currentTheme.text }}>关注项</h3>
                    </div>
	                    <span style={{ color: currentTheme.textDim }}>
	                      {attentionCandidates.length > attentionItems.length
	                        ? `${attentionItems.length}/${attentionCandidates.length} 项`
	                        : `${attentionItems.length} 项`}
	                    </span>
                  </div>

                  <div className="console-attention-list">
                    {attentionItems.length > 0 ? (
                      attentionItems.map((item) => {
                        const healthColor = getHealthColor(item.healthState)
                        return (
                          <button
                            type="button"
                            className="console-attention-item"
                            key={getServiceKey(item.service)}
                            aria-label={`查看关注项：${item.service.name}`}
	                            onClick={() =>
	                              focusServiceGroup(
	                                item.service.category,
	                                item.riskLevel === 'L2' ? 'l2' : 'attention',
	                              )
	                            }
                          >
                            <span
                              className="console-attention-orb"
                              style={{
                                background: healthColor,
                                boxShadow: `0 0 12px ${healthColor}`,
                              }}
                            />
                            <span>
                              <strong style={{ color: currentTheme.text }}>
                                {item.service.name}
                              </strong>
                              <small style={{ color: currentTheme.textDim }}>
                                {item.reason}
                                {item.runtime?.composeProject
                                  ? ` · ${item.runtime.composeProject}`
                                  : ''}
                              </small>
                            </span>
                            <em style={{ color: getCategoryColor(item.service.category).color }}>
                              {item.service.category}
                            </em>
                          </button>
                        )
                      })
                    ) : (
                      <div className="console-attention-empty" style={{ color: currentTheme.textDim }}>
                        当前没有异常服务；高风险操作仍只展示确认门，不在仪表盘里直接执行。
                      </div>
                    )}
                  </div>
                </section>

                <section className="console-panel console-ops-panel">
                  <div className="console-panel-head">
                    <div>
                      <p className="console-eyebrow" style={{ color: currentTheme.secondary }}>
                        CONTROL SURFACE
                      </p>
                      <h3 style={{ color: currentTheme.text }}>操作面</h3>
                    </div>
                    <span style={{ color: currentTheme.textDim }}>只读优先</span>
                  </div>
                  <div className="console-pulse-list">
                    {operationsPulse.map((item) => (
                      <div className="console-pulse-item" key={item.label}>
                        <span style={{ color: currentTheme.textDim }}>{item.label}</span>
                        <strong style={{ color: currentTheme.text }}>{item.value}</strong>
                        <small style={{ color: currentTheme.textDim }}>{item.hint}</small>
                      </div>
                    ))}
                  </div>
                  <p className="console-dashboard-hint" style={{ color: currentTheme.textDim }}>
                    第一版先把基础数据、跳转入口和风险分层铺清楚；后续接 Dockge / Traefik
                    API 时，只在用户勾选确认后执行。
                  </p>
                </section>
              </div>

              <div className="console-category-ribbon">
                {categorySummaries.map((item) => {
                  const cc = getCategoryColor(item.category)
                  const active = selectedCategory === item.category
                  return (
                    <button
                      className={`console-category-chip ${active ? 'is-active' : ''}`}
                      key={item.category}
                      type="button"
                      onClick={() => setSelectedCategory(active ? null : item.category)}
                      aria-pressed={active}
                      style={
                        {
                          color: active ? linkTextColor : cc.color,
                          borderColor: `${cc.color}55`,
                          background: active
                            ? `linear-gradient(135deg, ${cc.color}, ${currentTheme.secondary})`
                            : undefined,
                          boxShadow: active ? `0 0 18px ${cc.glow}` : undefined,
                        } as React.CSSProperties
                      }
                    >
                      <span>{item.category}</span>
                      <strong>
                        {selectedCategory || statusFilter !== 'all' || search
                          ? `${item.visible}/${item.count}`
                          : item.count}
                      </strong>
                      <small>{item.ok} ok · {item.attention} 关注</small>
                    </button>
                  )
                })}
              </div>

              <div className="console-status-foot" style={{ color: currentTheme.textDim }}>
                <span>
                  snapshot: {snapshotFreshness.label} · {snapshotFreshness.detail}
                </span>
	              {consoleStatus?.snapshot?.generatedAt && <span>{formatSnapshotTime(consoleStatus.snapshot.generatedAt)}</span>}
	                {consoleStatus?.snapshot?.host && <span>{consoleStatus.snapshot.host}</span>}
	                {consoleStatus?.snapshot?.source && <span>{consoleStatus.snapshot.source}</span>}
	                {consoleStatus?.registry?.updatedAt && <span>registry {consoleStatus.registry.updatedAt}</span>}
	                {statusError && <span className="console-error">{statusError}</span>}
	                <span className="console-sr-only" aria-live="polite">
	                  {statusLoading
	                    ? '正在刷新 Console 状态'
	                    : `Console 状态：${healthDistributionText}，当前显示 ${filteredServices.length} 个服务`}
	                </span>
	              </div>
            </div>
          </section>

          {/* Search + category filters */}
          <div
            style={{
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              animation: shouldAnimate ? 'slide-up 0.6s ease-out 1s both' : 'none',
            }}
          >
            <div style={{ position: 'relative' }}>
              <label className="console-sr-only" htmlFor="console-service-search">
                搜索服务
              </label>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: currentTheme.primary,
                  filter: `drop-shadow(0 0 4px ${currentTheme.primary}99)`,
                }}
              />
              <input
                className="console-search-input"
                id="console-service-search"
                type="text"
                placeholder="搜索服务..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: currentTheme.bg1,
                  border: `1px solid ${currentTheme.primary}40`,
                  borderRadius: '0.75rem',
                  color: currentTheme.text,
                  fontSize: '1rem',
                  backdropFilter: 'blur(15px)',
                  outline: 'none',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

	            <div className="console-filter-tabs" role="group" aria-label="服务状态筛选">
              {([
                ['all', '全部'],
                ['healthy', '健康'],
                ['attention', '需关注'],
                ['no-ui', '无后台'],
                ['l2', 'L2'],
              ] as Array<[StatusFilter, string]>).map(([key, label]) => {
                const active = statusFilter === key
                return (
                  <button
                    className={active ? 'is-active' : undefined}
                    key={key}
                    type="button"
	                    aria-pressed={active}
                    onClick={() => setStatusFilter(key)}
                    style={{
                      color: active ? linkTextColor : currentTheme.primary,
                      borderColor: active ? currentTheme.secondary : `${currentTheme.primary}40`,
                      background: active
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                        : currentTheme.bg1,
                      boxShadow: active ? `0 0 16px ${currentTheme.primary}66` : undefined,
                    }}
                  >
                    <span>{label}</span>
                    <strong>{filterCounts[key]}</strong>
                  </button>
                )
              })}
            </div>

            <div className="console-filter-summary" style={{ color: currentTheme.textDim }}>
              <span>
                当前显示 <strong style={{ color: currentTheme.text }}>{filteredServices.length}</strong> /{' '}
                {dashboardStats.services} 个服务
              </span>
              {activeFilters.length > 0 ? (
                <span className="console-active-filters">
                  {activeFilters.map((item) => (
                    <em key={item}>{item}</em>
                  ))}
                </span>
              ) : (
                <span>未设置额外筛选</span>
              )}
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  className="console-clear-filters"
                  onClick={clearFilters}
                  style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}55` }}
                >
                  清空筛选
                </button>
              )}
            </div>
          </div>

          {/* Service groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map((category, catIndex) => {
              const services = groupedServices[category]
              if (!services) return null
              const isExpanded = expandedCategories.has(category)
              const cc = getCategoryColor(category)
              const categoryDomId = getCategoryDomId(category)

              return (
                <div
                  key={category}
                  style={{
                    animation: shouldAnimate
                      ? `slide-up 0.6s ease-out ${1.2 + catIndex * 0.1}s both`
                      : 'none',
                  }}
                >
                  <button
                    className="console-category-toggle"
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-expanded={isExpanded}
                    aria-controls={categoryDomId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '1rem',
                      background: currentTheme.bg1,
                      border: `1px solid ${cc.color}40`,
                      borderRadius: '0.75rem',
                      color: cc.color,
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      transition: 'all 0.3s',
                      marginBottom: '1rem',
                      backdropFilter: 'blur(15px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <ChevronDown
                      size={20}
                      style={{
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s',
                        filter: `drop-shadow(0 0 4px ${cc.color})`,
                      }}
                    />
                    <span>{category}</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: currentTheme.textDim,
                        fontSize: '0.9rem',
                      }}
                    >
                      ({services.length})
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      id={categoryDomId}
                      style={{
                        display: viewMode === 'grid' ? 'grid' : 'flex',
                        gridTemplateColumns:
                          viewMode === 'grid'
                            ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
                            : undefined,
                        flexDirection: viewMode === 'list' ? 'column' : undefined,
                        gap: '1rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {services.map((service, serviceIndex) => {
                        const serviceStatus = statusByService.get(getServiceKey(service))
                        const healthState = serviceStatus?.status.health?.state
                        const healthColor = getHealthColor(healthState)
                        const docker = serviceStatus?.status.docker
                        const health = serviceStatus?.status.health
                        const traefik = serviceStatus?.status.traefik
                        const timers = serviceStatus?.status.timers || []
                        const dockerState = docker?.state
                        const dockerMissing = docker?.missing?.length || 0
                        const traefikMissing =
                          traefik?.missingRouters?.length || traefik?.missing?.length || 0
                        const timerMissing =
                          serviceStatus?.status.timersMissing?.length ||
                          serviceStatus?.status.timer?.missing?.length ||
                          0
                        const systemd = serviceStatus?.status.systemd
                        const systemdMissing = systemd?.missing?.length || 0
                        const timerCount = timers.length
                        const adminUrl =
                          serviceStatus?.adminUrl ||
                          service.adminUrl ||
                          service.external ||
                          service.internal
                        const hasAdminUi =
                          serviceStatus?.hasAdminUi ?? service.hasAdminUi ?? Boolean(adminUrl)
                        const runtime = serviceStatus?.runtime || service.runtime
                        const capabilities = serviceStatus?.capabilities?.length
                          ? serviceStatus.capabilities
                          : service.capabilities || []
                        const actions = serviceStatus?.actions?.length
                          ? serviceStatus.actions
                          : service.actions || []
                        const pendingActions = actions.filter(
                          (action) =>
                            action.disabled ||
                            action.requiresConfirmation ||
                            action.kind !== 'link' ||
                            action.riskLevel === 'L2',
                        )
                        const riskLevel = serviceStatus?.riskLevel || service.riskLevel
                        const runtimeRows = uniqueStrings([
                          runtime?.host ? `host · ${runtime.host}` : undefined,
                          runtime?.composeProject ? `compose · ${runtime.composeProject}` : undefined,
                          runtime?.dockerContainer ? `container · ${runtime.dockerContainer}` : undefined,
                          docker?.health ? `docker health · ${docker.health}` : undefined,
                          docker?.image ? `image · ${docker.image}` : undefined,
                          docker?.ports ? `ports · ${compactText(docker.ports)}` : undefined,
                          health?.status ? `http · ${health.status}` : undefined,
                          health?.latencyMs !== undefined ? `latency · ${health.latencyMs}ms` : undefined,
                          health?.error ? `health error · ${compactText(health.error)}` : undefined,
                          traefik?.routers?.length ? `router · ${traefik.routers.join(', ')}` : undefined,
                          traefikMissing > 0 ? `router missing · ${traefikMissing}` : undefined,
                          timers[0]?.next ? `next timer · ${timers[0].unit} · ${timers[0].next}` : undefined,
                          timerMissing > 0 ? `timer missing · ${timerMissing}` : undefined,
                          systemd?.units?.[0]?.active
                            ? `systemd · ${systemd.units[0].unit} · ${systemd.units[0].active}`
                            : undefined,
                          systemdMissing > 0 ? `systemd missing · ${systemdMissing}` : undefined,
                        ]).slice(0, 9)
                        return (
                          <div
                            key={service.name}
                            className={`service-card console-service-card ${
                              viewMode === 'list'
                                ? 'console-service-card--list'
                                : 'console-service-card--grid'
                            }`}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              background: currentTheme.bg1,
                              backdropFilter: 'blur(15px)',
                              border: `1px solid ${cc.color}26`,
                              borderRadius: '1rem',
                              padding: viewMode === 'list' ? '1rem' : '1.5rem',
                              transition: 'all 0.3s',
                              cursor: 'default',
                              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                              display: viewMode === 'list' ? 'flex' : 'block',
                              alignItems: viewMode === 'list' ? 'center' : undefined,
                              gap: viewMode === 'list' ? '1rem' : undefined,
                              animation: shouldAnimate
                                ? `card-appear 0.4s ease-out ${serviceIndex * 0.05}s both`
                                : 'none',
                            }}
                          >
                            {/* Corner dots */}
                            {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
                              const posStyles = {
                                tl: { top: '8px', left: '8px' },
                                tr: { top: '8px', right: '8px' },
                                bl: { bottom: '8px', left: '8px' },
                                br: { bottom: '8px', right: '8px' },
                              }
                              return (
                                <div
                                  key={pos}
                                  className="corner-dot"
                                  style={{
                                    position: 'absolute',
                                    ...posStyles[pos],
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: cc.color,
                                    boxShadow: `0 0 8px ${cc.color}`,
                                    opacity: 0,
                                    transition: 'opacity 0.3s',
                                  }}
                                />
                              )
                            })}

                            {/* Border glow */}
                            <div
                              className="border-glow"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: `linear-gradient(90deg, transparent, ${cc.color}66, transparent)`,
                                opacity: 0,
                                transition: 'opacity 0.3s',
                              }}
                            />

                            {/* Scan line */}
                            <div
                              className="scan-line"
                              style={{
                                position: 'absolute',
                                top: '-100%',
                                left: 0,
                                width: '100%',
                                height: '2px',
                                background: `linear-gradient(90deg, transparent, ${currentTheme.secondary}, transparent)`,
                                boxShadow: `0 0 10px ${currentTheme.secondary}`,
                                opacity: 0,
                                transition: 'opacity 0.3s',
                              }}
                            />

                            {/* Card content */}
                            <div style={{ position: 'relative', zIndex: 1 }}>
                              <h3
                                style={{
                                  fontSize: '1.1rem',
                                  fontWeight: 700,
                                  marginBottom: viewMode === 'list' ? 0 : '0.5rem',
                                  color: currentTheme.text,
                                  textShadow: `0 0 10px ${currentTheme.text}50`,
                                }}
                              >
                                {service.name}
                              </h3>
                              {viewMode === 'grid' && (
                                <p
                                  style={{
                                    fontSize: '0.85rem',
                                    color: currentTheme.textDim,
                                    marginBottom: '1rem',
                                    lineHeight: '1.6',
                                  }}
                                >
                                  {service.desc}
                                </p>
                              )}
                            </div>

                            {viewMode === 'list' && (
                              <p
                                style={{
                                  fontSize: '0.85rem',
                                  color: currentTheme.textDim,
                                  flex: 2,
                                  position: 'relative',
                                  zIndex: 1,
                                  lineHeight: '1.6',
                                }}
                              >
                                {service.desc}
                              </p>
                            )}

                            <div
                              className="console-card-meta"
                              style={{ color: currentTheme.textDim }}
                            >
                              <span
                                className="console-pill"
                                style={{ borderColor: `${healthColor}66`, color: healthColor }}
                              >
                                <Activity size={12} /> {getHealthLabel(healthState)}
                              </span>
                              {(dockerState || dockerMissing > 0) && (
                                <span
                                  className="console-pill"
                                  style={{
                                    borderColor: `${dockerMissing > 0 ? '#f7768e' : currentTheme.primary}55`,
                                    color: dockerMissing > 0 ? '#f7768e' : currentTheme.primary,
                                  }}
                                >
                                  Docker {dockerMissing > 0 ? `${dockerMissing} missing` : dockerState}
                                </span>
                              )}
                              {traefik?.status && (
                                <span
                                  className="console-pill"
                                  style={{
                                    borderColor: `${traefikMissing > 0 ? '#f7768e' : currentTheme.secondary}55`,
                                    color: traefikMissing > 0 ? '#f7768e' : currentTheme.secondary,
                                  }}
                                >
                                  Traefik {traefikMissing > 0 ? `${traefikMissing} missing` : traefik.status}
                                </span>
                              )}
                              {(timerCount > 0 || timerMissing > 0) && (
                                <span
                                  className="console-pill"
                                  style={{
                                    borderColor: `${timerMissing > 0 ? '#f7768e' : '#e0af68'}55`,
                                    color: timerMissing > 0 ? '#f7768e' : '#e0af68',
                                  }}
                                >
                                  Timer {timerMissing > 0 ? `${timerMissing} missing` : timerCount}
                                </span>
                              )}
                              <span
                                className="console-pill"
                                style={{
                                  borderColor: `${currentTheme.textDim}44`,
                                  color: currentTheme.textDim,
                                }}
                              >
                                <ShieldCheck size={12} />{' '}
                                {riskLabel(riskLevel)}
                              </span>
                            </div>

                            {viewMode === 'grid' && capabilities.length > 0 ? (
                              <div
                                className="console-capabilities"
                                style={{ color: currentTheme.textDim }}
                              >
                                {capabilities.slice(0, 4).map((capability) => (
                                  <span key={capability}>#{capability}</span>
                                ))}
                              </div>
                            ) : null}

                            {viewMode === 'grid' && runtimeRows.length > 0 && (
                              <div
                                className="console-card-runtime"
                                style={{ color: currentTheme.textDim }}
                              >
                                {runtimeRows.map((row) => (
                                  <span key={row} title={row}>{row}</span>
                                ))}
                              </div>
                            )}

                            {viewMode === 'grid' && pendingActions.length > 0 && (
                              <div className="console-action-chips" style={{ color: currentTheme.textDim }}>
                                {pendingActions.slice(0, 3).map((action) => (
                                  <span key={action.id} title={action.description}>
                                    {action.label} · {action.riskLevel}
                                    {action.requiresConfirmation ? ' · 需确认' : ''}
                                    {action.disabled ? ' · 预留' : ' · 待接线'}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Links */}
                            <div
                              className="console-card-links"
                              style={{
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                position: 'relative',
                                zIndex: 1,
                              }}
                            >
                              {adminUrl && hasAdminUi !== false && (
                                <a
                                  href={adminUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`打开 ${service.name} 后台`}
                                  style={{
                                    flex: viewMode === 'list' ? '0 0 auto' : 1,
                                    minWidth: '96px',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                                    color: linkTextColor,
                                    border: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: `0 0 20px ${currentTheme.primary}66`,
                                    fontFamily: 'inherit',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.35rem',
                                  }}
                                >
                                  后台 <ExternalLink size={12} />
                                </a>
                              )}
                              {service.internal && (hasAdminUi === false || service.internal !== adminUrl) && (
                                <a
                                  href={service.internal}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`打开 ${service.name} 内网地址`}
                                  style={{
                                    flex: viewMode === 'list' ? '0 0 auto' : 1,
                                    minWidth: '80px',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    background: currentTheme.bg2,
                                    color: currentTheme.primary,
                                    border: `1px solid ${currentTheme.primary}40`,
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  内网
                                </a>
                              )}
                              {service.external && service.external !== adminUrl && (
                                <a
                                  href={service.external}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`打开 ${service.name} 外网地址`}
                                  style={{
                                    flex: viewMode === 'list' ? '0 0 auto' : 1,
                                    minWidth: '80px',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.5rem',
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                                    color: linkTextColor,
                                    border: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: `0 0 20px ${currentTheme.primary}66`,
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  外网
                                </a>
                              )}
                              {!hasAdminUi && (
                                <span
                                  className="console-no-ui"
                                  style={{ color: currentTheme.textDim }}
                                >
                                  无后台 · 显示运行信息
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {filteredServices.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                color: currentTheme.textDim,
                animation: shouldAnimate ? 'fade-in 0.6s ease-out' : 'none',
              }}
            >
              <Sparkles
                size={48}
                style={{
                  color: currentTheme.primary,
                  marginBottom: '1rem',
                  filter: `drop-shadow(0 0 10px ${currentTheme.primary})`,
                  display: 'block',
                  margin: '0 auto 1rem',
                }}
              />
              <p style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                未找到匹配的服务
              </p>
	              <p style={{ fontSize: '0.95rem', marginTop: '0.5rem', opacity: 0.8 }}>
	                尝试调整搜索关键词、分类或状态筛选
	              </p>
	              {activeFilters.length > 0 && (
	                <button
	                  type="button"
	                  className="console-clear-filters"
	                  onClick={clearFilters}
	                  style={{
	                    marginTop: '1rem',
	                    marginLeft: 0,
	                    color: currentTheme.primary,
	                    borderColor: `${currentTheme.primary}55`,
	                  }}
	                >
	                  清空筛选
	                </button>
	              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
