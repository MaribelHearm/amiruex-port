'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const PromptPolisherPlayground: React.FC = () => {
  const [role, setRole] = useState('')
  const [context, setContext] = useState('')
  const [task, setTask] = useState('')
  const [format, setFormat] = useState('')
  const [result, setResult] = useState('')

  const generatePrompt = () => {
    let prompt = ''
    if (role) prompt += `## Role\n${role}\n\n`
    if (context) prompt += `## Context\n${context}\n\n`
    if (task) prompt += `## Task\n${task}\n\n`
    if (format) prompt += `## Output Format\n${format}\n\n`

    setResult(prompt.trim())
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
    alert('已复制到剪贴板')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="space-y-2">
          <Label htmlFor="role">角色设定 (Role)</Label>
          <Input
            id="role"
            placeholder="例如：资深前端工程师、专业翻译官..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-black/20 border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="context">背景信息 (Context)</Label>
          <Textarea
            id="context"
            placeholder="提供必要的背景知识或限制条件..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="bg-black/20 border-white/10 min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task">具体任务 (Task)</Label>
          <Textarea
            id="task"
            placeholder="描述你希望 AI 完成的具体工作..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="bg-black/20 border-white/10 min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">输出要求 (Format)</Label>
          <Input
            id="format"
            placeholder="例如：Markdown 表格、JSON、简洁的段落..."
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="bg-black/20 border-white/10"
          />
        </div>

        <Button onClick={generatePrompt} className="w-full">生成结构化 Prompt</Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">预览结果</h3>
          {result && (
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              复制全部
            </Button>
          )}
        </div>
        <div className="p-6 rounded-2xl border border-white/10 bg-black/40 min-h-[400px] whitespace-pre-wrap font-mono text-sm">
          {result || <span className="text-muted-foreground italic">在左侧输入内容并点击生成...</span>}
        </div>
      </div>
    </div>
  )
}
