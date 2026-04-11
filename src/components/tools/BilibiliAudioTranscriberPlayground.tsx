'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type SourceType = 'bilibili' | 'upload'
type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed'

type TaskResponse = {
  taskId: string
  status: TaskStatus
  progress: number
  text?: string
  error?: { code: string; message: string }
  meta?: { provider?: string; durationSec?: number }
}

const LAST_TASK_KEY = 'bili-transcribe-last-task-id'

export const BilibiliAudioTranscriberPlayground: React.FC = () => {
  const [sourceType, setSourceType] = useState<SourceType>('bilibili')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [lookupTaskId, setLookupTaskId] = useState('')
  const [task, setTask] = useState<TaskResponse | null>(null)
  const [busy, setBusy] = useState(false)

  const isDone = task?.status === 'succeeded' || task?.status === 'failed'

  const progressText = useMemo(() => {
    if (!task) return '待提交'
    if (task.status === 'queued') return '队列中...'
    if (task.status === 'running') return `处理中 ${task.progress}%`
    if (task.status === 'succeeded') return '已完成'
    return '处理失败'
  }, [task])

  const pollTask = async (taskId: string) => {
    const res = await fetch(`/next/transcribe/${taskId}`, { method: 'GET' })
    const data = (await res.json()) as TaskResponse | { error?: { code?: string; message?: string } }

    if (!res.ok) {
      throw new Error((data as { error?: { message?: string } }).error?.message || '任务查询失败')
    }

    const current = data as TaskResponse
    setTask(current)
    localStorage.setItem(LAST_TASK_KEY, current.taskId)
    setLookupTaskId(current.taskId)

    return current
  }

  const pollUntilDone = async (taskId: string) => {
    for (let i = 0; i < 240; i++) {
      const current = await pollTask(taskId)
      if (current.status === 'succeeded' || current.status === 'failed') return
      await new Promise((r) => setTimeout(r, 1200))
    }
    throw new Error('任务轮询超时，请稍后使用任务 ID 继续找回')
  }

  const createTask = async () => {
    setBusy(true)
    try {
      const form = new FormData()
      form.append('sourceType', sourceType)

      if (sourceType === 'bilibili') {
        if (!url.trim()) {
          alert('请输入 Bilibili 链接')
          return
        }
        form.append('url', url.trim())
      } else {
        if (!file) {
          alert('请先选择音频文件')
          return
        }
        form.append('file', file)
      }

      const res = await fetch('/next/transcribe', { method: 'POST', body: form })
      const data = (await res.json()) as TaskResponse | { error?: { message?: string } }
      if (!res.ok) {
        throw new Error((data as { error?: { message?: string } }).error?.message || '任务创建失败')
      }

      const created = data as TaskResponse
      setTask(created)
      localStorage.setItem(LAST_TASK_KEY, created.taskId)
      setLookupTaskId(created.taskId)

      await pollUntilDone(created.taskId)
    } catch (error) {
      alert(error instanceof Error ? error.message : '提交失败')
    } finally {
      setBusy(false)
    }
  }

  const restoreTask = async () => {
    if (!lookupTaskId.trim()) {
      alert('请输入任务 ID')
      return
    }
    setBusy(true)
    try {
      await pollTask(lookupTaskId.trim())
    } catch (error) {
      alert(error instanceof Error ? error.message : '找回失败')
    } finally {
      setBusy(false)
    }
  }

  const copyText = async () => {
    if (!task?.text) return
    await navigator.clipboard.writeText(task.text)
    alert('已复制转写全文')
  }

  const copyTaskId = async () => {
    if (!task?.taskId) return
    await navigator.clipboard.writeText(task.taskId)
    alert('已复制任务 ID')
  }

  const clearCache = () => {
    localStorage.removeItem(LAST_TASK_KEY)
    setLookupTaskId('')
    setTask(null)
    alert('已清理本地任务缓存')
  }

  useEffect(() => {
    const lastTaskId = localStorage.getItem(LAST_TASK_KEY)
    if (!lastTaskId) return

    setLookupTaskId(lastTaskId)
    void pollTask(lastTaskId).catch(() => {
      // ignore
    })
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article className="home-tool-card">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${sourceType === 'bilibili' ? 'bg-primary/10 text-primary border-primary/30' : 'border-white/10 text-muted-foreground'}`}
            onClick={() => setSourceType('bilibili')}
          >
            B站链接
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${sourceType === 'upload' ? 'bg-primary/10 text-primary border-primary/30' : 'border-white/10 text-muted-foreground'}`}
            onClick={() => setSourceType('upload')}
          >
            本地音频
          </button>
        </div>

        {sourceType === 'bilibili' ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground">输入 Bilibili 视频链接（10 分钟以内）</p>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.bilibili.com/video/BV..."
            />
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground">上传音频文件（10 分钟以内）</p>
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={createTask} disabled={busy} className="flex-1">
            {busy ? '处理中...' : '开始转写'}
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          <p className="text-xs text-muted-foreground">通过任务 ID 找回</p>
          <div className="flex gap-2">
            <Input
              value={lookupTaskId}
              onChange={(e) => setLookupTaskId(e.target.value)}
              placeholder="输入任务 ID"
            />
            <Button variant="outline" onClick={restoreTask} disabled={busy}>
              查询
            </Button>
            <Button variant="outline" onClick={clearCache} disabled={busy}>
              清理缓存
            </Button>
          </div>
        </div>
      </article>

      <article className="home-tool-card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold">任务状态</h3>
          {task?.taskId && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={copyTaskId}
            >
              复制任务ID
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground break-all">任务ID：{task?.taskId || '未创建'}</p>
        <p className="text-xs text-muted-foreground mt-1">状态：{task?.status || 'idle'} · {progressText}</p>

        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${task?.progress ?? 0}%` }}
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">转写结果</h4>
            {task?.text && (
              <Button variant="outline" size="sm" onClick={copyText}>
                复制全文
              </Button>
            )}
          </div>

          {task?.error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-2">
              {task.error.code} · {task.error.message}
            </div>
          )}

          <Textarea
            readOnly
            value={task?.text || ''}
            placeholder={isDone ? '当前任务无可用文本' : '提交任务后，这里会显示完整转写文本'}
            className="min-h-[320px] max-h-[420px] overflow-y-auto"
          />

          {!!task?.meta?.provider && (
            <p className="text-xs text-muted-foreground">
              Provider: {task.meta.provider}
              {typeof task.meta.durationSec === 'number' ? ` · 时长约 ${Math.round(task.meta.durationSec)}s` : ''}
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
