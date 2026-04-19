# Design System — Amireux Portal

> 基点：首页视觉风格。所有新 UI 必须从这里延伸，不得自创新方向。
> 本版为全站通用补充版，覆盖首页、子页面、工具页、导航与动效。
> 依据实现：`src/app/(frontend)/globals.css`

---

## 一、全站视觉总纲

**风格定义**：老苹果毛玻璃 × Tokyo Night 霓虹 × Apple 弹簧动画

- 背景永远是全页摄影图 + 模糊遮罩透出；卡片从背景里长出来，不是浮在上面
- 暗色优先，light mode 仅做基础可读适配
- 禁止新增主色系，仅允许玫红 / 蓝紫 / 青三色

### 霓虹三色（唯三主色）

| 名称 | 色值                     | 用途                   |
| ---- | ------------------------ | ---------------------- |
| 玫红 | `oklch(65% 0.22 320deg)` | 顶部彩线起点、强调点   |
| 蓝紫 | `oklch(60% 0.18 278deg)` | 顶部彩线中段、标签色   |
| 青   | `oklch(68% 0.16 198deg)` | 顶部彩线终点、次级强调 |

### 渐变文字（标题 / Logo）

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

## 二、核心 Design Token（dark mode）

> 新组件必须复用 `--hp-*`，不得自行定义主视觉令牌。

```css
/* 发光色 */
--hp-glow-primary:        oklch(58% 0.14 278deg);   /* 蓝紫，按钮/状态点 */
--hp-glow-secondary:      oklch(60% 0.09 208deg);   /* 低饱和青蓝 */

/* 卡片材质 */
--hp-card-bg:             rgba(16, 17, 22, 0.62);
--hp-card-bg-hover:       rgba(22, 24, 32, 0.78);
--hp-blur:                16px;
--hp-inner-glow:          rgba(90, 120, 200, 0.03);

/* 边框 */
--hp-border:              rgba(255, 255, 255, 0.055);
--hp-border-hover:        rgba(255, 255, 255, 0.11);

/* 阴影 */
--hp-shadow-card:         0 2px 16px -4px rgba(0,0,0,0.6), 0 0 0 1px var(--hp-border) inset;
--hp-shadow-card-hover:   0 6px 24px -6px rgba(0,0,0,0.7), 0 0 0 1px var(--hp-border-hover) inset;
```

---

## 三、标准卡片模板（强制）

**每一个深色大卡片必须**：
1. 用 `--hp-card-bg` + `backdrop-filter: blur(var(--hp-blur))`
2. 边框用 `--hp-border`（几乎不可见）
3. 顶部 1.5px 霓虹彩线（`::after` 伪元素，必须）
4. hover：`translateY(-2px~-3px)` + `--hp-card-bg-hover` + `--hp-shadow-card-hover`
5. 与彩线配套：`position: relative` + `overflow: hidden`

```css
.your-card {
  background: var(--hp-card-bg);
  border: 1px solid var(--hp-border);
  border-radius: 0.9rem;
  backdrop-filter: blur(var(--hp-blur));
  -webkit-backdrop-filter: blur(var(--hp-blur));
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

## 四、边框与圆角规范

| 用途           | 值                        |
| -------------- | ------------------------- |
| 大卡片、区块   | `0.9-1rem`                |
| 页头区块       | `1-1.25rem`               |
| 输入框、小卡   | `0.6-0.7rem`              |
| 胶囊标签/按钮  | `999px`                   |
| 最小可见圆角   | `0.6rem`（禁止更小）      |
| 边框颜色 dark  | `rgba(255,255,255,0.055)` |
| 边框颜色 light | `var(--border)`           |

---

## 五、排版规范

```css
/* Hero 大标题 */
font-size: clamp(2rem, 4.6vw, 3.25rem);
font-weight: 760;
letter-spacing: -0.03em;
line-height: 1.08;

/* 子页标题 */
font-size: clamp(1.6rem, 3.5vw, 2.4rem);
font-weight: 760;
letter-spacing: -0.02em;

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

---

## 六、动画规范

**弹簧曲线（Apple 感）**：`cubic-bezier(0.16, 1, 0.3, 1)`
**液态过渡（导航/大块）**：`cubic-bezier(0.2, 0.8, 0.2, 1)`
**快速响应（hover）**：`180-220ms ease`

| 场景          | 动画                               | 时长                  |
| ------------- | ---------------------------------- | --------------------- |
| 页头卡片进场  | `translateY(-14px) → 0` + fade     | `0.65s`               |
| 卡片/列表升起 | `translateY(18px) → 0` + fade      | `0.48-0.52s`          |
| 文字逐行显现  | `blur(6px)→0 + translateY(12px)→0` | `0.55-0.6s`（仅桌面） |
| Stagger 间隔  | 每项 +100ms，超过 6 项截断         | —                     |

**禁止**：
- 不用 `ease-in` 作为主过渡曲线
- 不加 `animation-duration > 1s`（导航液态过渡除外）
- 移动端不使用 `filter: blur()` 动画，改为无 blur 版位移 + 淡入

### Reduced Motion（必须）

```css
@media (prefers-reduced-motion: reduce) {
  .your-element {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 七、导航系统规范

- 桌面端：顶部透明，滚动后收缩为毛玻璃岛态（`data-scrolled=true`）
- 移动端：`site-header__inner` 默认即岛态，不与桌面完全同逻辑
- 导航交互强调液态过渡，不做硬切
- 移动端下拉面板与岛态使用同一材质参数（background / blur / border / shadow）

---

## 八、层级系统（z-index）

> 新功能如需覆盖层必须遵守以下分层，不得任意抢层。

| 层                   | z-index      | 说明                          |
| -------------------- | ------------ | ----------------------------- |
| `.bgfx` 背景层       | `0`          | 背景图、光晕、网格            |
| 页面内容区           | 不设 z-index | 避免创建层叠上下文干扰 header |
| `.site-header` 导航  | `100`        | 固定顶部                      |
| 移动端导航面板       | `130`        | 浮于导航之上                  |
| Modal / Overlay 预留 | `200+`       | 未来覆盖层                    |

**重要**：`position: relative + z-index` 会创建层叠上下文，可能阻断 header 的 `backdrop-filter`。

---

## 九、响应式断点

```css
--breakpoint-sm:  40rem;  /* 640px  */
--breakpoint-md:  48rem;  /* 768px  */
--breakpoint-lg:  64rem;  /* 1024px */
--breakpoint-xl:  80rem;  /* 1280px */
--breakpoint-2xl: 86rem;  /* 1376px */
```

- 移动端逻辑阈值：`max-width: 48rem`
- 导航折叠阈值：`max-width: 48rem`
- 双列布局展开：`min-width: 64rem`

---

## 十、新页面实现套路

### 10.1 固定结构模板

```tsx
export default function YourPage() {
  return (
    <main className="home-shell home-root-shell">
      <BackgroundFX />

      <section className="secondary-header container">
        <div className="secondary-header__card">
          <p className="secondary-header__tag">Section Label</p>
          <h1 className="secondary-header__title">页面标题</h1>
          <p className="secondary-header__description">简短说明，max 52ch</p>
        </div>
      </section>

      <section className="container pb-24">
        {/* 内容区 */}
      </section>
    </main>
  )
}
```

### 10.2 首页新增 section

```tsx
<section className="home-reveal-section container mt-20">
  <div className="home-section-head mb-6">
    <h2 className="home-section-title">区块标题</h2>
    <Link className="home-inline-link" href="/xxx">查看全部 →</Link>
  </div>
  {/* 内容 */}
</section>
```

> `home-reveal-section` 由滚动进度变量 `--reveal-progress` 驱动，自动支持正向和反向滚动。

### 10.3 列表卡片 Stagger 模板

```css
.your-card:nth-child(1) { animation: sp-item-rise 0.48s 0.20s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(2) { animation: sp-item-rise 0.48s 0.30s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(3) { animation: sp-item-rise 0.48s 0.40s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(4) { animation: sp-item-rise 0.48s 0.50s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(5) { animation: sp-item-rise 0.48s 0.58s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(6) { animation: sp-item-rise 0.48s 0.64s cubic-bezier(0.16, 1, 0.3, 1) both; }
.your-card:nth-child(n+7) { animation: sp-item-rise 0.48s 0.70s cubic-bezier(0.16, 1, 0.3, 1) both; }

@media (prefers-reduced-motion: reduce) {
  .your-card { animation: none !important; }
}
```

---

## 十一、按钮规范

> 两套按钮体系，不要混用。

| 套件                   | 用途                          | 位置                           |
| ---------------------- | ----------------------------- | ------------------------------ |
| `.home-btn + modifier` | 首页 Hero、毛玻璃背景前景按钮 | `globals.css`                  |
| `<Button variant=...>` | 通用 UI、表单、工具页内部     | `src/components/ui/button.tsx` |

- 首页风格按钮统一用 `.home-btn`
- 通用业务按钮统一用 `<Button>` 变体体系：`default` / `outline` / `ghost` / `secondary` / `destructive` / `link`

---

## 十二、工具页规范

- 工具入口卡：`home-tool-card`（必须含 dark token + 顶部彩线）
- 工具详情头：`secondary-header__card`
- 工作台布局：`tool-playground-grid`（单列到双列）
- 双卡结构：`tool-form-card` / `tool-preview-card`，视觉权重均衡

> 历史页面若存在 inline 颜色类视为存量债务。新增工具不得继续扩散 inline 色值写法。

---

## 十三、首页背景层规范

首页必须保留四层背景体系，不得省略：

| 层       | 类名                       | 作用                                  |
| -------- | -------------------------- | ------------------------------------- |
| 背景图   | `.bgfx__photo::before`     | 摄影图 + `blur(5px)`                  |
| 渐变遮罩 | `.bgfx__overlay + ::after` | 随滚动收缩，JS 写 `--overlay-retreat` |
| 彩色光晕 | `.bgfx__glow--1/2`         | 蓝紫、青蓝漂浮光斑                    |
| 网格纹理 | `.bgfx__grid`              | 36px 网格，低透明度                   |

组件入口统一使用 `<BackgroundFX />`，不重复造轮子。

---

## 十四、存量技术债（已知不完全合规）

> 以下为已知历史样式债务。新功能不受此影响，但不得照抄。

| 类名                       | 问题                                                    | 位置          |
| -------------------------- | ------------------------------------------------------- | ------------- |
| `.home-entry-card`（dark） | 缺 `position:relative + overflow:hidden + ::after` 彩线 | `globals.css` |
| `.extensions-card`（dark） | 未完全使用 `--hp-*`，无彩线                             | `globals.css` |
| `.wandering-card`（dark）  | 未完全使用 `--hp-*`，无彩线                             | `globals.css` |

---

## 十五、新组件 Checklist

添加任何新的卡片、区块或页面前，逐条勾选：

- [ ] dark mode 下使用 `--hp-*` token
- [ ] 大卡具备顶部 1.5px 霓虹彩线 `::after`
- [ ] hover 包含 `translateY(-2~-3px)` + 阴影与边框增强
- [ ] 使用 `position: relative` + `overflow: hidden` 与彩线配套
- [ ] 进场动画使用标准 keyframe（`sp-item-rise` / `sp-header-drop` / `sp-block-emerge`）
- [ ] Stagger 超过 6 项时延迟截断
- [ ] 提供 `prefers-reduced-motion` 降级
- [ ] 移动端去除 blur 动画，改位移+淡入
- [ ] 首页新 section 接入 `home-reveal-section`
- [ ] 子页面使用 `secondary-header + secondary-header__card`
- [ ] 页面主容器使用 `home-shell home-root-shell` + `<BackgroundFX />`
- [ ] 不新增主色系

---

## 十六、禁止事项

- **不加新主色**：仅用玫红 / 蓝紫 / 青三色
- **不用实色大面积背景**：新区块必须透明或半透明毛玻璃
- **不用 `border-radius < 0.6rem`** 在可见卡片上
- **不自创动画曲线**：仅允许三种规范曲线
- **不使用 `ease-in` 作为主过渡**
- **不缺失 `prefers-reduced-motion` 降级**
- **不在页面内容层设置 z-index**（避免破坏 header 模糊）
- **不在首页主内容容器滥加层叠上下文**
- **彩线不使用 `border-image` 或 inline 方案**，统一 `::after`
