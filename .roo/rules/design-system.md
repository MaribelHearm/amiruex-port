# Design System — Amireux Portal

> 基点：首页视觉风格。所有新 UI 必须从这里延伸，不得自创新方向。

---

## 一、视觉语言

**风格定义**：老苹果毛玻璃 × Tokyo Night 霓虹 × Apple 弹簧动画

- 背景永远是全页摄影图 + 模糊遮罩透出；卡片"从背景里长出来"，不是浮在上面
- 霓虹三色贯穿全站：玫红 `oklch(65% 0.22 320deg)` → 蓝紫 `oklch(60% 0.18 278deg)` → 青 `oklch(68% 0.16 198deg)`
- 暗色优先，light mode 仅做基础适配

---

## 二、核心 Design Token（dark mode）

```css
/* 卡片材质 */
--hp-card-bg:        rgba(16, 17, 22, 0.62);
--hp-card-bg-hover:  rgba(22, 24, 32, 0.78);
--hp-border:         rgba(255, 255, 255, 0.055);
--hp-border-hover:   rgba(255, 255, 255, 0.11);
--hp-blur:           16px;
--hp-shadow-card:    0 2px 16px -4px rgba(0,0,0,0.6), 0 0 0 1px var(--hp-border) inset;
--hp-shadow-card-hover: 0 6px 24px -6px rgba(0,0,0,0.7), 0 0 0 1px var(--hp-border-hover) inset;

/* 霓虹主色 */
--hp-glow-primary:   oklch(58% 0.14 278deg);   /* 蓝紫 */
--hp-glow-secondary: oklch(60% 0.09 208deg);   /* 青蓝 */
```

---

## 三、标准卡片模板

**每一个深色大卡片必须**：
1. 用 `--hp-card-bg` + `backdrop-filter: blur(12-16px)`
2. 边框用 `--hp-border`（几乎不可见）
3. 顶部 1.5px 霓虹彩线（`::after` 伪元素）
4. hover：`translateY(-3px)` + `--hp-card-bg-hover` + `--hp-shadow-card-hover`

```css
.your-card {
  background: var(--hp-card-bg);
  border: 1px solid var(--hp-border);
  border-radius: 0.9rem;
  backdrop-filter: blur(12px);
  box-shadow: var(--hp-shadow-card);
  position: relative;
  overflow: hidden;
  transition: transform 220ms ease, border-color 220ms ease,
              background 220ms ease, box-shadow 220ms ease;
}

.your-card:hover {
  transform: translateY(-3px);
  background: var(--hp-card-bg-hover);
  border-color: var(--hp-border-hover);
  box-shadow: var(--hp-shadow-card-hover);
}

/* 顶部霓虹彩线：必须 */
.your-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1.5px;
  background: linear-gradient(90deg,
    oklch(65% 0.22 320deg) 0%,
    oklch(60% 0.18 278deg) 50%,
    oklch(68% 0.16 198deg) 100%
  );
  pointer-events: none;
}
```

---

## 四、动画规范

**弹簧曲线（Apple 感）**：`cubic-bezier(0.16, 1, 0.3, 1)`
**液态过渡（导航/大块）**：`cubic-bezier(0.2, 0.8, 0.2, 1)`
**快速响应（hover）**：`180-220ms ease`

| 场景 | 动画 | 时长 |
|------|------|------|
| 页头卡片进场 | `translateY(-14px) → 0` + fade | 0.65s |
| 卡片/列表升起 | `translateY(18px) → 0` + fade | 0.48-0.52s |
| 文字逐行显现 | `blur(6px)→0` + `translateY(12px)→0` | 0.55-0.6s |
| Stagger 间隔 | 每项延迟 ~100ms | — |

**禁止**：
- 不用 `ease-in`（会有"拖尾"感，与苹果风相反）
- Stagger 不超过 6 项（再多截断到同一延迟）
- 不加 `animation-duration > 1s`（除导航液态过渡外）

---

## 五、排版规范

```css
/* Hero 大标题 */
font-size: clamp(2rem, 4.6vw, 3.25rem);
font-weight: 760;
letter-spacing: -0.03em;
line-height: 1.08;

/* 节区标题 */
font-size: 1.2rem;
font-weight: 650;

/* 标签/上标 */
font-size: 0.65-0.78rem;
letter-spacing: 0.06-0.12em;
text-transform: uppercase;
color: var(--muted-foreground);

/* 正文 */
line-height: 1.7;
color: var(--muted-foreground);
```

**渐变文字**（标题强调 / Logo）：
```css
background: linear-gradient(105deg,
  oklch(72% 0.18 320deg) 0%,
  oklch(65% 0.20 278deg) 45%,
  oklch(72% 0.16 198deg) 100%
);
-webkit-background-clip: text;
background-clip: text;
color: transparent;
```

---

## 六、边框 & 圆角

| 用途 | 值 |
|------|-----|
| 大卡片 | `border-radius: 0.9-1rem` |
| 页头区块 | `border-radius: 1-1.25rem` |
| 胶囊标签/按钮 | `border-radius: 999px` |
| 输入框/小卡 | `border-radius: 0.6-0.7rem` |
| 边框颜色（dark） | `rgba(255,255,255,0.055)` |
| 边框颜色（light） | `var(--border)` |

---

## 七、状态点 / 指示器

```css
/* 绿色在线点 */
background: oklch(75% 0.18 165deg);
box-shadow: 0 0 6px oklch(75% 0.18 165deg / 0.7);
animation: badge-pulse 2.2s ease-in-out infinite;

/* 霓虹彩点（标题行装饰） */
background: linear-gradient(135deg, oklch(65% 0.22 320deg), oklch(65% 0.18 278deg));
box-shadow: 0 0 6px oklch(65% 0.22 320deg / 0.5);
```

---

## 八、禁止事项

- **不加新主色**：已有玫红/蓝紫/青三色，不引入黄/橙/红
- **不用实色大面积背景**：新区块必须透明或半透明毛玻璃
- **不用 `border-radius < 0.6rem`** 在可见卡片上
- **不自创动画曲线**：只用上面三种
- **不破坏背景透出效果**：新容器谨慎使用 `overflow: hidden`

---

## 九、新组件 checklist

- [ ] dark mode 下用 `--hp-*` token
- [ ] 大卡片有顶部霓虹彩线 `::after`
- [ ] hover 有 `translateY(-2~3px)` + shadow 变化
- [ ] 进场动画用标准 keyframe + stagger
- [ ] `prefers-reduced-motion` 降级（`animation: none !important`）
- [ ] 移动端 blur 动画替换为无 blur 版（`translateY + fade`）
