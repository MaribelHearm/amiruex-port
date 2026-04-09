'use client'

import React, { useMemo, useState } from 'react'

const toList = (input: string) =>
  input
    .split(/\n|,|，/g)
    .map((item) => item.trim())
    .filter(Boolean)

export const ProfileCardPlayground: React.FC = () => {
  const [nickname, setNickname] = useState('子湛')
  const [headline, setHeadline] = useState('正在构建一个有内容也有可玩性的个人主站。')
  const [skillsText, setSkillsText] = useState('Next.js, Payload CMS, TypeScript')

  const skills = useMemo(() => toList(skillsText), [skillsText])

  const markdown = useMemo(() => {
    const skillLines = skills.length > 0 ? skills.map((skill) => `- ${skill}`).join('\n') : '- （待补充）'

    return `# ${nickname}\n\n> ${headline}\n\n## Skills\n${skillLines}`
  }, [headline, nickname, skills])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      alert('已复制 Markdown 到剪贴板')
    } catch {
      alert('复制失败，请手动复制')
    }
  }

  return (
    <div className="tool-playground-grid">
      <div className="tool-form-card">
        <label>
          昵称
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="输入昵称" />
        </label>

        <label>
          一句话介绍
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={3}
            placeholder="输入一句自我介绍"
          />
        </label>

        <label>
          技能（逗号或换行分隔）
          <textarea
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            rows={4}
            placeholder="例如：React, Node.js, UX"
          />
        </label>

        <button type="button" className="home-btn home-btn--primary" onClick={handleCopy}>
          复制 Markdown
        </button>
      </div>

      <div className="tool-preview-card">
        <p className="tool-preview-title">实时预览</p>
        <pre>{markdown}</pre>
      </div>
    </div>
  )
}
