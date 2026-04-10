import { createHeadlessEditor } from '@lexical/headless'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { CodeNode, CodeHighlightNode } from '@lexical/code'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'

export async function POST(req: Request) {
  try {
    const { markdown } = await req.json()
    if (typeof markdown !== 'string' || !markdown.trim()) {
      return Response.json({ error: 'markdown is required' }, { status: 400 })
    }

    const editor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
      ],
    })

    await new Promise<void>((resolve) => {
      editor.update(
        () => {
          $convertFromMarkdownString(markdown, TRANSFORMERS)
        },
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
