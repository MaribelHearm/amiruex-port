'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

type WriterContentEnhancerProps = {
  className?: string
  fallbackHtml?: string
  html: string | null | undefined
}

type LightboxImage = {
  alt: string
  caption: string
  src: string
}

function imageFromElement(image: HTMLImageElement): LightboxImage {
  return {
    alt: image.alt || '图片',
    caption: image.dataset.caption || image.title || image.alt || '',
    src: image.currentSrc || image.src,
  }
}

export function WriterContentEnhancer({ className, fallbackHtml, html }: WriterContentEnhancerProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const lightboxOpen = lightboxImages.length > 0

  const closeLightbox = useCallback(() => {
    setLightboxImages([])
    setLightboxIndex(0)
  }, [])

  const moveLightbox = useCallback((delta: number) => {
    setLightboxIndex((current) => {
      const total = lightboxImages.length
      if (!total) return 0
      return (current + delta + total) % total
    })
  }, [lightboxImages.length])

  useEffect(() => {
    if (!lightboxOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') moveLightbox(-1)
      if (event.key === 'ArrowRight') moveLightbox(1)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeLightbox, lightboxOpen, moveLightbox])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const revealSpoiler = (spoiler: HTMLElement) => {
      spoiler.dataset.revealed = 'true'
      spoiler.setAttribute('aria-label', '隐藏内容已显示')
    }

    const toggleFade = (fade: HTMLElement) => {
      const nextExpanded = fade.dataset.expanded !== 'true'
      fade.dataset.expanded = String(nextExpanded)
      const toggle = fade.querySelector<HTMLButtonElement>('.forum-fade__toggle')
      if (toggle) toggle.textContent = nextExpanded ? '收起' : '展开全文'
    }

    const openGridImage = (image: HTMLImageElement) => {
      const grid = image.closest<HTMLElement>('.forum-grid')
      const images = Array.from(grid?.querySelectorAll<HTMLImageElement>('img') ?? [image])
      const index = Math.max(0, images.indexOf(image))
      setLightboxImages(images.map(imageFromElement))
      setLightboxIndex(index)
    }

    const handleActionTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false

      const fadeToggle = target.closest<HTMLElement>('.forum-fade__toggle')
      if (fadeToggle) {
        const fade = fadeToggle.closest<HTMLElement>('.forum-fade')
        if (fade) toggleFade(fade)
        return true
      }

      const gridImage = target.closest<HTMLImageElement>('.forum-grid img')
      if (gridImage) {
        openGridImage(gridImage)
        return true
      }

      const spoiler = target.closest<HTMLElement>('.forum-spoiler')
      if (spoiler && spoiler.dataset.revealed !== 'true') {
        revealSpoiler(spoiler)
        return true
      }

      return false
    }

    const onClick = (event: MouseEvent) => {
      if (handleActionTarget(event.target)) event.preventDefault()
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (handleActionTarget(event.target)) event.preventDefault()
    }

    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKeyDown)

    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const currentImage = lightboxImages[lightboxIndex]

  return (
    <>
      <article
        ref={rootRef}
        className={cn('writer-content-enhanced', className)}
        dangerouslySetInnerHTML={{ __html: html || fallbackHtml || '' }}
      />
      {currentImage && (
        <div className="forum-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" onClick={closeLightbox}>
          <button className="forum-lightbox__close" type="button" onClick={closeLightbox} aria-label="关闭图片预览">
            ×
          </button>
          {lightboxImages.length > 1 && (
            <button
              className="forum-lightbox__nav forum-lightbox__nav--prev"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                moveLightbox(-1)
              }}
              aria-label="上一张图片"
            >
              ‹
            </button>
          )}
          <figure className="forum-lightbox__figure" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentImage.src} alt={currentImage.alt} />
            {currentImage.caption && <figcaption>{currentImage.caption}</figcaption>}
          </figure>
          {lightboxImages.length > 1 && (
            <button
              className="forum-lightbox__nav forum-lightbox__nav--next"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                moveLightbox(1)
              }}
              aria-label="下一张图片"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
