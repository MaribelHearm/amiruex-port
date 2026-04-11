import { getTask } from '../lib'

type Args = {
  params: Promise<{
    taskId: string
  }>
}

export async function GET(_req: Request, { params: paramsPromise }: Args): Promise<Response> {
  const { taskId } = await paramsPromise
  const task = getTask(taskId)

  if (!task) {
    return Response.json(
      {
        error: {
          code: 'TASK_NOT_FOUND',
          message: '任务不存在或已过期',
        },
      },
      { status: 404 },
    )
  }

  return Response.json({
    taskId: task.taskId,
    status: task.status,
    progress: task.progress,
    text: task.text,
    error: task.error,
    meta: task.meta,
  })
}
