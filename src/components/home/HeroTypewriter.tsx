'use client'

import { useEffect, useRef, useState } from 'react'

const PHRASES = [
  '重构首页视觉系统 v4',
  '打磨灵动岛交互细节',
  '整理工程实践笔记',
  '探索滚动叙事新玩法',
]

/** 星号循环帧：从简单到复杂再回来，营造旋转/脉动感 */
const STAR_FRAMES = ['✦', '✧', '⊹', '✱', '✲', '✳', '✴', '✵', '✳', '✱', '⊹', '✧']

const TYPE_SPEED    = 140    // 打字速度，更从容
const DELETE_SPEED  = 75     // 删除速度
const PAUSE_AFTER   = 2800   // 展示停留更久
const THINK_FIRST   = 4200   // 首次 thinking 仪式感更强
const THINK_REPEAT  = 2400   // 后续 thinking 也不急
const DOT_TICK      = 520    // 省略号更慢，像在沉思
const STAR_TICK     = 200    // 星号切换慢一些，像轻微脉动

type Phase = 'thinking' | 'typing' | 'paused' | 'deleting'

export function HeroTypewriter() {
  const [phase, setPhase]       = useState<Phase>('thinking')
  const [displayed, setDisplayed] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [dotCount, setDotCount] = useState(0)
  const [starIdx, setStarIdx]   = useState(0)

  const mainTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dotTimer    = useRef<ReturnType<typeof setInterval> | null>(null)
  const starTimer   = useRef<ReturnType<typeof setInterval> | null>(null)

  // 点号 + 星号动画：仅在 thinking 阶段运行
  useEffect(() => {
    if (phase === 'thinking') {
      setDotCount(0)
      setStarIdx(0)

      dotTimer.current = setInterval(() => {
        setDotCount((d) => (d + 1) % 4)
      }, DOT_TICK)

      starTimer.current = setInterval(() => {
        setStarIdx((s) => (s + 1) % STAR_FRAMES.length)
      }, STAR_TICK)
    } else {
      clearInterval(dotTimer.current ?? undefined)
      clearInterval(starTimer.current ?? undefined)
      dotTimer.current  = null
      starTimer.current = null
    }

    return () => {
      clearInterval(dotTimer.current ?? undefined)
      clearInterval(starTimer.current ?? undefined)
    }
  }, [phase])

  // 主状态机
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('typing')
      setDisplayed(PHRASES[0] ?? '')
      return
    }

    const clear = () => {
      if (mainTimer.current) clearTimeout(mainTimer.current)
    }

    if (phase === 'thinking') {
      const duration = phraseIdx === 0 ? THINK_FIRST : THINK_REPEAT
      mainTimer.current = setTimeout(() => setPhase('typing'), duration)

    } else if (phase === 'typing') {
      const target = PHRASES[phraseIdx % PHRASES.length] ?? ''
      if (displayed.length < target.length) {
        mainTimer.current = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          TYPE_SPEED,
        )
      } else {
        setPhase('paused')
      }

    } else if (phase === 'paused') {
      mainTimer.current = setTimeout(() => setPhase('deleting'), PAUSE_AFTER)

    } else if (phase === 'deleting') {
      if (displayed.length > 0) {
        mainTimer.current = setTimeout(
          () => setDisplayed((prev) => prev.slice(0, -1)),
          DELETE_SPEED,
        )
      } else {
        setPhraseIdx((i) => i + 1)
        setPhase('thinking')
      }
    }

    return clear
  }, [phase, displayed, phraseIdx])

  const star = STAR_FRAMES[starIdx] ?? '✦'
  const dots = '.'.repeat(dotCount)

  if (phase === 'thinking') {
    return (
      <p className="home-hero__typewriter" aria-live="polite" aria-label="正在思考">
        <span className="home-hero__thinking-star">{star}</span>
        <span className="home-hero__thinking-label"> Thinking</span>
        <span className="home-hero__thinking-dots">{dots}</span>
      </p>
    )
  }

  return (
    <p className="home-hero__typewriter" aria-label={`当前正在做：${displayed}`}>
      <span className="home-hero__typewriter-prefix">~/portal</span>
      <span className="home-hero__typewriter-sep"> $ </span>
      <span>{displayed}</span>
      <span className="home-hero__typewriter-cursor" aria-hidden>█</span>
    </p>
  )
}
