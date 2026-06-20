'use client'

import React, { useMemo, useState } from 'react'

function getPostIDFromPath(pathname: string) {
  const match = pathname.match(/\/admin\/collections\/posts\/([^/?#]+)/)
  if (!match?.[1] || match[1] === 'create') return ''
  return decodeURIComponent(match[1])
}

export function WriterOpenField() {
  const [postID] = useState(() => {
    if (typeof window === 'undefined') return ''
    return getPostIDFromPath(window.location.pathname)
  })

  const writerHref = useMemo(() => {
    if (!postID) return '/private/write'
    return `/private/write?id=${encodeURIComponent(postID)}`
  }, [postID])

  return (
    <div
      style={{
        border: '1px solid color-mix(in srgb, var(--theme-elevation-150) 70%, #8b5cf6 30%)',
        borderRadius: 12,
        marginBottom: 18,
        padding: 16,
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--theme-elevation-50) 84%, #8b5cf6 16%), var(--theme-elevation-50))',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ minWidth: 260, flex: '1 1 360px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            推荐正文编辑器：Writer 工作台
          </div>
          <div style={{ color: 'var(--theme-elevation-500)', fontSize: 12, lineHeight: 1.55 }}>
            Payload 自带富文本保留给旧文章兼容。粘贴 AI
            Markdown、拖拽图片、论坛块、右侧预览和本地历史，优先用 Writer
            工作台；保存后会回写当前文章。
          </div>
        </div>
        <a
          href={writerHref}
          target="_blank"
          rel="noreferrer"
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            borderRadius: 999,
            color: '#fff',
            display: 'inline-flex',
            fontSize: 13,
            fontWeight: 700,
            gap: 8,
            lineHeight: 1,
            minHeight: 38,
            padding: '0 16px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
          title={postID ? '在 Writer 工作台中编辑当前文章' : '打开 Writer 工作台新建文章'}
        >
          {postID ? '打开当前文章的 Writer 工作台' : '打开 Writer 工作台'} ↗
        </a>
      </div>
      {!postID && (
        <div style={{ color: 'var(--theme-warning-500)', fontSize: 12, marginTop: 10 }}>
          当前是未保存的新建页面；如果想绑定这篇 Payload 文档，请先保存一次，再打开 Writer。
        </div>
      )}
    </div>
  )
}
