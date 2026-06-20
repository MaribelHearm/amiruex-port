import { createHeadlessEditor } from '@lexical/headless'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { ListNode, ListItemNode } from '@lexical/list'
import {
  $convertFromMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HEADING,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
} from '@lexical/markdown'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'

import type { Post } from '@/payload-types'

const PAYLOAD_MARKDOWN_TRANSFORMERS = [
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  LINK,
]

export type PayloadLexicalContent = Post['content']

export function createEmptyLexicalContent(): PayloadLexicalContent {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [],
          direction: null,
          format: '',
          indent: 0,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export async function markdownToPayloadLexical(markdown: string): Promise<PayloadLexicalContent> {
  if (!markdown.trim()) return createEmptyLexicalContent()

  const editor = createHeadlessEditor({
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
  })

  await new Promise<void>((resolve) => {
    editor.update(
      () => {
        $convertFromMarkdownString(markdown, PAYLOAD_MARKDOWN_TRANSFORMERS)
      },
      { discrete: true, onUpdate: resolve },
    )
  })

  return editor.getEditorState().toJSON() as PayloadLexicalContent
}
