'use client'

import { useEffect } from 'react'

/**
 * 首页滚动可逆进度控制器 V4.1
 *
 * 策略：
 * 1. 不再使用 IntersectionObserver 单次触发
 * 2. 通过 scroll + rAF 实时计算每个 .home-reveal-section 在视口中的进度
 * 3. 写入 CSS 变量 --reveal-progress（0~1）到各 section 元素上
 * 4. CSS 侧直接用 CSS 变量做 opacity/translateY，可逆感由进度值决定
 * 5. 额外：根据滚动进度驱动背景遮罩收缩（--overlay-retreat 写到 documentElement）
 *
 * 遮罩收缩逻辑：
 * - 首屏静止时 retreat=0：遮罩全覆盖（底部完全不透明）
 * - 滚动超过首屏高度时 retreat=1：遮罩仅剩顶部轻薄层，底部完全消失
 * - 使用 CSS 变量控制 .bgfx__overlay 的渐变截止位置，实现视差收缩感
 *
 * 性能保障：
 * - 节流：rAF 确保每帧最多更新一次
 * - 退出时清理事件
 * - SSR 安全：useEffect 内部运行，不在服务端执行
 */
export function HomeScrollRevealController() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.home-reveal-section'),
    )

    const root = document.documentElement

    // prefers-reduced-motion 时直接完全显示，遮罩也完全收起
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((el) => {
        el.style.setProperty('--reveal-progress', '1')
      })
      root.style.setProperty('--overlay-retreat', '1')
      return
    }

    let rafId = 0

    const update = () => {
      const vh = window.innerHeight
      const scrollY = window.scrollY

      // ── 遮罩收缩进度 ──
      // 滚动 0 → 1*vh 对应 retreat 0 → 1
      // 超过首屏高度后遮罩已完全退去
      const overlayRetreat = Math.min(1, Math.max(0, scrollY / vh))
      root.style.setProperty('--overlay-retreat', overlayRetreat.toFixed(3))

      // ── section reveal 进度 ──
      if (sections.length) {
        sections.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const enterY = vh * 0.95 // 底边在这里时 progress=0
          const doneY = vh * 0.55  // 顶边在这里时 progress=1
          const raw = 1 - (rect.top - doneY) / (enterY - doneY)
          const progress = Math.min(1, Math.max(0, raw))
          el.style.setProperty('--reveal-progress', String(progress.toFixed(3)))
        })
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // 初始化执行一次（页面刷新时，某些 section 可能已在视口内）
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return null
}
