import React from 'react'

type UnderConstructionProps = {
  title?: string
  description?: string
  tag?: string
}

export const UnderConstruction: React.FC<UnderConstructionProps> = ({
  title = '模块施工中',
  description = '当前模块正在分阶段建设中，先提供可访问骨架，后续持续补齐内容与交互。',
  tag = 'Phase 1',
}) => {
  return (
    <div className="construction-card">
      <div className="construction-card__tag">{tag}</div>
      <h3 className="construction-card__title">{title}</h3>
      <p className="construction-card__description">{description}</p>
    </div>
  )
}
