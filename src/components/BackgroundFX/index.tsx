'use client'

import React from 'react'

/**
 * BackgroundFX
 *
 * 设计原则：
 * - 背景图用 CSS background-image，不用 <img> 标签
 *   → <img> 加了 filter:blur 会创建新的层叠上下文，阻断外部元素的 backdrop-filter
 *   → CSS background-image 不创建层叠上下文，backdrop-filter 可以直接模糊它
 * - 整个层 position:fixed, z-index:0，在所有内容和 Header 之下
 * - 父级 <main> 不能有 isolation:isolate（会隔离此层，阻断 Header 的 backdrop-filter）
 */
export const BackgroundFX: React.FC = () => {
  return (
    <div className="bgfx" aria-hidden>
      {/* 背景图层：CSS background-image，不用 <img>，避免 filter 创建新层叠上下文 */}
      <div className="bgfx__photo" />
      {/* 渐变遮罩：从上到下压暗，让内容可读 */}
      <div className="bgfx__overlay" />
      {/* 彩色光晕 */}
      <span className="bgfx__glow bgfx__glow--1" />
      <span className="bgfx__glow bgfx__glow--2" />
      {/* 网格纹理 */}
      <span className="bgfx__grid" />
    </div>
  )
}
