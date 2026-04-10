'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createCommand, COMMAND_PRIORITY_NORMAL } from 'lexical'
import { $convertFromMarkdownString, TRANSFORMERS, CODE } from '@lexical/markdown'

// Payload 使用自己的 Block-based 代码实现，@lexical/code 的 CodeNode 未注册
// 移除 CODE block transformer 避免 "Node CodeNode has not been registered" 错误
const PAYLOAD_SAFE_TRANSFORMERS = TRANSFORMERS.filter((t) => t !== CODE)

export const OPEN_MARKDOWN_IMPORT_COMMAND = createCommand<void>('OPEN_MARKDOWN_IMPORT_COMMAND')

export function MarkdownImportPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isOpen, setIsOpen] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return editor.registerCommand(
      OPEN_MARKDOWN_IMPORT_COMMAND,
      () => {
        setIsOpen(true)
        return true
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [editor])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    } else {
      setMarkdown('')
    }
  }, [isOpen])

  const handleImport = useCallback(() => {
    if (!markdown.trim()) return
    editor.update(() => {
      $convertFromMarkdownString(markdown, PAYLOAD_SAFE_TRANSFORMERS)
    })
    setIsOpen(false)
  }, [editor, markdown])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleImport()
    },
    [handleImport],
  )

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
    >
      <div
        style={{
          background: 'var(--theme-bg, #1a1a1a)',
          border: '1px solid var(--theme-border-color, #333)',
          borderRadius: '12px',
          padding: '24px',
          width: 'min(680px, 90vw)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--theme-text, #fff)' }}>
            从 Markdown 导入
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--theme-text-muted, #888)',
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--theme-text-muted, #888)' }}>
          粘贴 Markdown 正文，点击导入后会替换当前编辑器内容。
        </p>

        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'## 标题\n\n正文段落...\n\n```typescript\n// 代码块\n```'}
          style={{
            width: '100%',
            height: '320px',
            resize: 'vertical',
            background: 'var(--theme-input-bg, #111)',
            border: '1px solid var(--theme-border-color, #333)',
            borderRadius: '8px',
            padding: '12px',
            color: 'var(--theme-text, #fff)',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--theme-border-color, #333)',
              background: 'transparent',
              color: 'var(--theme-text-muted, #888)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!markdown.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: markdown.trim() ? 'var(--theme-success, #3b82f6)' : '#333',
              color: '#fff',
              cursor: markdown.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            导入（⌘ Enter）
          </button>
        </div>
      </div>
    </div>
  )
}
