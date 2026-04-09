'use client'

import { useEffect, useState, useRef } from 'react'

const PHRASES = [
  '重构首页视觉系统 v4',
  '打磨灵动岛交互细节',
  '整理工程实践笔记',
  '探索滚动叙事新玩法',
]

/** 打字速度（ms/字符） */
const TYPE_SPEED = 120
const DELETE_SPEED = 65
const PAUSE_AFTER = 2200

/**
 * 打字机动效组件
 * 循环展示「当前正在做的事」，逐字打出，短暂停留，逐字删除
 */
export function HeroTypewriter() {
  const [displayed, setDisplayed] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // prefers-reduced-motion：直接显示第一条不动
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(PHRASES[0] ?? '')
      return
    }

    const current = PHRASES[phraseIdx % PHRASES.length] ?? ''

    const tick = () => {
      if (!isDeleting) {
        if (displayed.length < current.length) {
          setDisplayed(current.slice(0, displayed.length + 1))
          timeoutRef.current = setTimeout(tick, TYPE_SPEED)
        } else {
          // 打完停留再删除
          timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER)
        }
      } else {
        if (displayed.length > 0) {
          setDisplayed((prev) => prev.slice(0, prev.length - 1))
          timeoutRef.current = setTimeout(tick, DELETE_SPEED)
        } else {
          setIsDeleting(false)
          setPhraseIdx((i) => i + 1)
        }
      }
    }

    timeoutRef.current = setTimeout(tick, isDeleting ? DELETE_SPEED : TYPE_SPEED)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [displayed, isDeleting, phraseIdx])

  return (
    <p className="home-hero__typewriter" aria-label={`当前正在做：${displayed}`}>
      <span className="home-hero__typewriter-prefix">~/portal</span>
      <span className="home-hero__typewriter-sep"> $ </span>
      <span>{displayed}</span>
      <span className="home-hero__typewriter-cursor" aria-hidden>█</span>
    </p>
  )
}
