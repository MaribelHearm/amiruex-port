'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

/**
 * 首屏粒子氛围层
 *
 * 轻量 Canvas 实现：
 * - 40 个稀疏漂浮点，随机游走
 * - 近距离（< 120px）连细线
 * - 颜色与页面主色 (blue-purple) 对齐，但极低透明度
 * - 完全不影响交互（pointer-events: none）
 * - reduced-motion 模式下自动跳过动画帧
 */
export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animId = 0
    let particles: Particle[] = []

    const COUNT = 38
    const MAX_DIST = 130
    const SPEED = 0.22

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const spawn = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        radius: 1.2 + Math.random() * 1,
        opacity: 0.18 + Math.random() * 0.22,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 更新位置
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        // 边界反弹
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      // 连线
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!
          const b = particles[j]!
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const lineOpacity = (1 - dist / MAX_DIST) * 0.09
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(140, 160, 255, ${lineOpacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      // 粒子点
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 190, 255, ${p.opacity})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    spawn()

    if (reduceMotion) {
      // 只画一帧静态图，不持续动画
      draw()
      cancelAnimationFrame(animId)
    } else {
      draw()
    }

    const ro = new ResizeObserver(() => {
      resize()
      spawn()
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
