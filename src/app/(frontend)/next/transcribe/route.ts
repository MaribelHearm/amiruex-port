import { createTask, startTask } from './lib'

export async function POST(req: Request): Promise<Response> {
  try {
    const form = await req.formData()

    const sourceTypeRaw = form.get('sourceType')
    if (sourceTypeRaw !== 'bilibili' && sourceTypeRaw !== 'upload') {
      return Response.json(
        {
          error: {
            code: 'UNSUPPORTED_SOURCE',
            message: 'sourceType 必须是 bilibili 或 upload',
          },
        },
        { status: 400 },
      )
    }

    let payload:
      | {
          sourceType: 'bilibili'
          url: string
        }
      | {
          sourceType: 'upload'
          fileName: string
          fileBytes: Uint8Array
        }

    if (sourceTypeRaw === 'bilibili') {
      const url = String(form.get('url') || '').trim()
      if (!url) {
        return Response.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: 'bilibili 模式必须提供 url',
            },
          },
          { status: 400 },
        )
      }

      payload = {
        sourceType: 'bilibili',
        url,
      }
    } else {
      const file = form.get('file')
      if (!(file instanceof File)) {
        return Response.json(
          {
            error: {
              code: 'INVALID_INPUT',
              message: 'upload 模式必须提供 file',
            },
          },
          { status: 400 },
        )
      }

      const bytes = new Uint8Array(await file.arrayBuffer())

      payload = {
        sourceType: 'upload',
        fileName: file.name,
        fileBytes: bytes,
      }
    }

    const task = createTask(sourceTypeRaw)
    startTask(task.taskId, payload)

    return Response.json({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
    })
  } catch (error) {
    console.error('[transcribe/create-task]', error)
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建转写任务失败',
        },
      },
      { status: 500 },
    )
  }
}
