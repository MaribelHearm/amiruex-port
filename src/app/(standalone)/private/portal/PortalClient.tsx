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
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  name: string
  desc: string
  category: string
  internal?: string
  external?: string
}

type ThemeKey = 'storm' | 'night' | 'day'
type ViewMode = 'grid' | 'list'

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
  '核心应用': { color: '#bb9af7', glow: 'rgba(187, 154, 247, 0.3)' },
  'API 与代理': { color: '#7dcfff', glow: 'rgba(125, 207, 255, 0.3)' },
  '基础设施': { color: '#9ece6a', glow: 'rgba(158, 206, 106, 0.3)' },
  'MCP 工具': { color: '#ff9e64', glow: 'rgba(255, 158, 100, 0.3)' },
  'QQ Bot': { color: '#f7768e', glow: 'rgba(247, 118, 142, 0.3)' },
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  storm: {
    name: 'Storm', bg1: 'rgba(26, 27, 38, 0.3)', bg2: 'rgba(36, 40, 59, 0.4)',
    primary: '#7aa2f7', secondary: '#7dcfff', accent: '#bb9af7',
    text: '#c0caf5', textDim: '#9aa5ce', glow: 'rgba(125, 207, 255, 0.2)', titleColor: '#c0caf5',
  },
  night: {
    name: 'Night', bg1: 'rgba(16, 16, 30, 0.3)', bg2: 'rgba(26, 27, 38, 0.4)',
    primary: '#a9b1d6', secondary: '#7aa2f7', accent: '#bb9af7',
    text: '#a9b1d6', textDim: '#787c99', glow: 'rgba(169, 177, 214, 0.2)', titleColor: '#a9b1d6',
  },
  day: {
    name: 'Day', bg1: 'rgba(213, 214, 219, 0.2)', bg2: 'rgba(227, 228, 234, 0.3)',
    primary: '#3760bf', secondary: '#188092', accent: '#7847bd',
    text: '#343b58', textDim: '#565a6e', glow: 'rgba(55, 96, 191, 0.15)', titleColor: '#343b58',
  },
}

const THEME_ICONS: Record<ThemeKey, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  storm: Moon,
  night: Cloud,
  day: Sun,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalClient({ services, categories, portalTagline }: PortalClientProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(categories))
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [theme, setTheme] = useState<ThemeKey>('storm')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [rainEnabled, setRainEnabled] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; opacity: number; anim: number; duration: number }[]>([])
  const [raindrops, setRaindrops] = useState<{ x: number; y: number; size: number; speed: number; delay: number; opacity: number; blur: number }[]>([])

  const currentTheme = THEMES[theme]

  useEffect(() => {
    setMounted(true)
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
    setCurrentTime(new Date().toLocaleTimeString('zh-CN'))
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('zh-CN')), 1000)
    return () => clearInterval(timer)
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
    return services.filter((s) => {
      const matchesSearch =
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !selectedCategory || s.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, services])

  const groupedServices = useMemo(() => {
    const grouped: Record<string, Service[]> = {}
    filteredServices.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = []
      grouped[s.category].push(s)
    })
    return grouped
  }, [filteredServices])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(category) ? next.delete(category) : next.add(category)
      return next
    })
  }

  const linkTextColor = theme === 'day' ? '#ffffff' : '#1a1b26'

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Scroll progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: `${scrollProgress}%`, height: '3px',
        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
        boxShadow: `0 0 10px ${currentTheme.primary}`, zIndex: 9999, transition: 'width 0.1s ease-out',
      }} />

      {/* Background image */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url(/assets/backgrounds/2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        filter: theme === 'day'
          ? 'brightness(0.9) saturate(1.2)'
          : 'brightness(0.65) saturate(1.1) hue-rotate(5deg)',
        zIndex: -2,
      }} />

      {/* Theme overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: `linear-gradient(135deg, ${currentTheme.bg1} 0%, ${currentTheme.bg2} 100%)`,
        zIndex: -1,
      }} />

      {/* Particles */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {particles.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%',
            background: currentTheme.primary, opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${currentTheme.primary}`,
            animation: `float-${p.anim} ${p.duration}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Rain */}
      {rainEnabled && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {raindrops.map((drop, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${drop.x}%`, top: `${drop.y}%`,
              width: `${drop.size}px`, height: `${drop.size * 4}px`, borderRadius: '50%',
              background: `linear-gradient(180deg, ${currentTheme.primary}${Math.floor(drop.opacity * 100)}, ${currentTheme.secondary}40)`,
              filter: `blur(${drop.blur}px)`,
              animation: `global-raindrop ${5 / drop.speed}s linear ${drop.delay}s infinite`,
              opacity: drop.opacity,
            }} />
          ))}
        </div>
      )}

      {/* Mouse glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${currentTheme.glow}, transparent 40%)`,
        transition: 'background 0.05s ease-out',
      }} />

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            border: 'none', borderRadius: '50%', color: '#1a1b26', cursor: 'pointer',
            boxShadow: `0 0 20px ${currentTheme.primary}80`, zIndex: 1000, transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowUp size={24} />
        </button>
      )}

      {/* Main content */}
      <div style={{ padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            textAlign: 'center', marginBottom: '3rem', paddingBottom: '2rem',
            borderBottom: `1px solid ${currentTheme.primary}33`,
          }}>
            {/* Controls row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem',
            }}>
              <div style={{ fontSize: '0.85rem', color: currentTheme.textDim, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {currentTime}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Rain toggle */}
                <button
                  className="control-btn"
                  onClick={() => setRainEnabled((v) => !v)}
                  title={rainEnabled ? '关闭雨效' : '开启雨效'}
                  style={{
                    padding: '0.5rem',
                    background: rainEnabled ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` : currentTheme.bg1,
                    border: `1px solid ${rainEnabled ? currentTheme.secondary : currentTheme.primary}40`,
                    borderRadius: '0.5rem',
                    color: rainEnabled ? '#1a1b26' : currentTheme.primary,
                    cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                      onClick={() => setTheme(tk)}
                      title={t.name}
                      style={{
                        padding: '0.5rem',
                        background: active ? `linear-gradient(135deg, ${t.primary}, ${t.secondary})` : t.bg1,
                        border: `1px solid ${active ? t.secondary : t.primary}40`,
                        borderRadius: '0.5rem',
                        color: active ? '#1a1b26' : t.primary,
                        cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                  onClick={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
                  title={viewMode === 'grid' ? '切换列表视图' : '切换网格视图'}
                  style={{
                    padding: '0.5rem', background: currentTheme.bg1,
                    border: `1px solid ${currentTheme.primary}40`, borderRadius: '0.5rem',
                    color: currentTheme.primary, cursor: 'pointer', transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                  position: 'absolute', left: '-120px', top: '50%', transform: 'translateY(-50%)',
                  width: '100px', height: '2px',
                  background: `linear-gradient(90deg, transparent, ${currentTheme.primary})`,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                }}
              >
                <div style={{
                  position: 'absolute', right: 0, top: '-3px', width: '8px', height: '8px',
                  borderRadius: '50%', background: currentTheme.primary,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
              </div>

              <h1
                className="portal-title"
                style={{
                  fontSize: '3.5rem', fontWeight: 900, color: currentTheme.titleColor,
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
                      animation: mounted ? `letter-appear 0.5s ease-out ${i * 0.1}s both` : 'none',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </h1>

              <div
                className="title-decoration"
                style={{
                  position: 'absolute', right: '-120px', top: '50%', transform: 'translateY(-50%)',
                  width: '100px', height: '2px',
                  background: `linear-gradient(90deg, ${currentTheme.primary}, transparent)`,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: '-3px', width: '8px', height: '8px',
                  borderRadius: '50%', background: currentTheme.primary,
                  boxShadow: `0 0 10px ${currentTheme.primary}`,
                  animation: 'pulse-dot 2s ease-in-out infinite 0.5s',
                }} />
              </div>
            </div>

            <p style={{
              color: currentTheme.primary, fontSize: '0.9rem', letterSpacing: '0.15em',
              textShadow: `0 0 10px ${currentTheme.primary}80`,
              animation: mounted ? 'fade-in 1s ease-out 0.8s both' : 'none',
            }}>
              {portalTagline}
            </p>
          </div>

          {/* Search + category filters */}
          <div style={{
            marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem',
            animation: mounted ? 'slide-up 0.6s ease-out 1s both' : 'none',
          }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                  color: currentTheme.primary, filter: `drop-shadow(0 0 4px ${currentTheme.primary}99)`,
                }}
              />
              <input
                type="text"
                placeholder="搜索服务..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                  background: currentTheme.bg1, border: `1px solid ${currentTheme.primary}40`,
                  borderRadius: '0.75rem', color: currentTheme.text, fontSize: '1rem',
                  backdropFilter: 'blur(15px)', outline: 'none', transition: 'all 0.3s',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="category-btn"
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: '0.5rem 1rem',
                  background: !selectedCategory
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`
                    : currentTheme.bg1,
                  border: `1px solid ${!selectedCategory ? currentTheme.secondary : currentTheme.primary}40`,
                  borderRadius: '0.5rem',
                  color: !selectedCategory ? '#1a1b26' : currentTheme.primary,
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)', fontFamily: 'inherit',
                  boxShadow: !selectedCategory ? `0 0 20px ${currentTheme.primary}80` : 'none',
                }}
              >
                全部
              </button>
              {categories.map((cat) => {
                const cc = CATEGORY_COLORS[cat]
                const active = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    className="category-btn"
                    onClick={() => setSelectedCategory(active ? null : cat)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: active
                        ? `linear-gradient(135deg, ${cc.color}, ${currentTheme.secondary})`
                        : currentTheme.bg1,
                      border: `1px solid ${active ? cc.color : currentTheme.primary}40`,
                      borderRadius: '0.5rem',
                      color: active ? '#1a1b26' : currentTheme.primary,
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                      backdropFilter: 'blur(10px)', fontFamily: 'inherit',
                      boxShadow: active ? `0 0 20px ${cc.glow}` : 'none',
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Service groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {categories.map((category, catIndex) => {
              const services = groupedServices[category]
              if (!services) return null
              const isExpanded = expandedCategories.has(category)
              const cc = CATEGORY_COLORS[category]

              return (
                <div
                  key={category}
                  style={{ animation: mounted ? `slide-up 0.6s ease-out ${1.2 + catIndex * 0.1}s both` : 'none' }}
                >
                  <button
                    onClick={() => toggleCategory(category)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      width: '100%', padding: '1rem',
                      background: currentTheme.bg1, border: `1px solid ${cc.color}40`,
                      borderRadius: '0.75rem', color: cc.color, cursor: 'pointer',
                      fontSize: '1.1rem', fontWeight: 700, transition: 'all 0.3s', marginBottom: '1rem',
                      backdropFilter: 'blur(15px)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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
                    <span style={{ marginLeft: 'auto', color: currentTheme.textDim, fontSize: '0.9rem' }}>
                      ({services.length})
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{
                      display: viewMode === 'grid' ? 'grid' : 'flex',
                      gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : undefined,
                      flexDirection: viewMode === 'list' ? 'column' : undefined,
                      gap: '1rem', marginBottom: '1rem',
                    }}>
                      {services.map((service, serviceIndex) => (
                        <div
                          key={service.name}
                          className="service-card"
                          style={{
                            position: 'relative', overflow: 'hidden',
                            background: currentTheme.bg1, backdropFilter: 'blur(15px)',
                            border: `1px solid ${cc.color}26`, borderRadius: '1rem',
                            padding: viewMode === 'list' ? '1rem' : '1.5rem',
                            transition: 'all 0.3s', cursor: 'default',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                            display: viewMode === 'list' ? 'flex' : 'block',
                            alignItems: viewMode === 'list' ? 'center' : undefined,
                            gap: viewMode === 'list' ? '1rem' : undefined,
                            animation: `card-appear 0.4s ease-out ${serviceIndex * 0.05}s both`,
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
                                  position: 'absolute', ...posStyles[pos],
                                  width: '4px', height: '4px', borderRadius: '50%',
                                  background: cc.color, boxShadow: `0 0 8px ${cc.color}`,
                                  opacity: 0, transition: 'opacity 0.3s',
                                }}
                              />
                            )
                          })}

                          {/* Border glow */}
                          <div
                            className="border-glow"
                            style={{
                              position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                              background: `linear-gradient(90deg, transparent, ${cc.color}66, transparent)`,
                              opacity: 0, transition: 'opacity 0.3s',
                            }}
                          />

                          {/* Scan line */}
                          <div
                            className="scan-line"
                            style={{
                              position: 'absolute', top: '-100%', left: 0, width: '100%', height: '2px',
                              background: `linear-gradient(90deg, transparent, ${currentTheme.secondary}, transparent)`,
                              boxShadow: `0 0 10px ${currentTheme.secondary}`,
                              opacity: 0, transition: 'opacity 0.3s',
                            }}
                          />

                          {/* Card content */}
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <h3 style={{
                              fontSize: '1.1rem', fontWeight: 700,
                              marginBottom: viewMode === 'list' ? 0 : '0.5rem',
                              color: currentTheme.text,
                              textShadow: `0 0 10px ${currentTheme.text}50`,
                            }}>
                              {service.name}
                            </h3>
                            {viewMode === 'grid' && (
                              <p style={{ fontSize: '0.85rem', color: currentTheme.textDim, marginBottom: '1rem', lineHeight: '1.6' }}>
                                {service.desc}
                              </p>
                            )}
                          </div>

                          {viewMode === 'list' && (
                            <p style={{ fontSize: '0.85rem', color: currentTheme.textDim, flex: 2, position: 'relative', zIndex: 1, lineHeight: '1.6' }}>
                              {service.desc}
                            </p>
                          )}

                          {/* Links */}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                            {service.internal && (
                              <a
                                href={service.internal}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: viewMode === 'list' ? '0 0 auto' : 1,
                                  minWidth: '80px', padding: '0.6rem 1rem', borderRadius: '0.5rem',
                                  textDecoration: 'none', textAlign: 'center', fontSize: '0.85rem',
                                  fontWeight: 600, background: currentTheme.bg2, color: currentTheme.primary,
                                  border: `1px solid ${currentTheme.primary}40`, transition: 'all 0.2s',
                                  fontFamily: 'inherit',
                                }}
                              >
                                内网
                              </a>
                            )}
                            {service.external && (
                              <a
                                href={service.external}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: viewMode === 'list' ? '0 0 auto' : 1,
                                  minWidth: '80px', padding: '0.6rem 1rem', borderRadius: '0.5rem',
                                  textDecoration: 'none', textAlign: 'center', fontSize: '0.85rem',
                                  fontWeight: 600,
                                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                                  color: linkTextColor,
                                  border: 'none', transition: 'all 0.2s',
                                  boxShadow: `0 0 20px ${currentTheme.primary}66`,
                                  fontFamily: 'inherit',
                                }}
                              >
                                外网
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {filteredServices.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '4rem 1rem', color: currentTheme.textDim,
              animation: 'fade-in 0.6s ease-out',
            }}>
              <Sparkles
                size={48}
                style={{
                  color: currentTheme.primary, marginBottom: '1rem',
                  filter: `drop-shadow(0 0 10px ${currentTheme.primary})`,
                  display: 'block', margin: '0 auto 1rem',
                }}
              />
              <p style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                未找到匹配的服务
              </p>
              <p style={{ fontSize: '0.95rem', marginTop: '0.5rem', opacity: 0.8 }}>
                尝试调整搜索关键词或选择不同的分类
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
