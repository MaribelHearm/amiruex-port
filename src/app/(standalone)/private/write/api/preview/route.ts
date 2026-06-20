import { renderWriterMarkdown } from '@/lib/writer/markdown'
import { requireWriterUser, unauthenticatedResponse } from '@/lib/writer/auth'

export const dynamic = 'force-dynamic'

type PreviewRequest = {
  markdown?: unknown
}

export async function POST(req: Request) {
  try {
    await requireWriterUser()
    const body = (await req.json()) as PreviewRequest

    if (typeof body.markdown !== 'string') {
      return Response.json({ error: 'markdown is required' }, { status: 400 })
    }

    const result = await renderWriterMarkdown(body.markdown)
    return Response.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return unauthenticatedResponse()
    }

    console.error('[writer-preview]', error)
    return Response.json({ error: '预览渲染失败' }, { status: 500 })
  }
}
