import { createHeadlessEditor } from '@lexical/headless'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import {
  $convertFromMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  HEADING,
  QUOTE,
  LINK,
  UNORDERED_LIST,
  ORDERED_LIST,
} from '@lexical/markdown'

// 只保留 Payload 编辑器已注册节点对应的 transformer
// 排除 CODE / CodeHighlightNode（Payload 用自己的 BlocksFeature Code block，不用 @lexical/code）
const PAYLOAD_TRANSFORMERS = [
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

export async function POST(req: Request) {
  try {
    const { markdown } = await req.json()
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return Response.json({ error: 'markdown is required' }, { status: 400 })
    }

    const editor = createHeadlessEditor({
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    })

    await new Promise<void>((resolve) => {
      editor.update(
        () => { $convertFromMarkdownString(markdown, PAYLOAD_TRANSFORMERS) },
        { discrete: true, onUpdate: resolve },
      )
    })

    const json = editor.getEditorState().toJSON()
    return Response.json({ lexical: json })
  } catch (err) {
    console.error('[markdown-to-lexical]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
