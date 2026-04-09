# 项目进度总览 · amireux.chat

> 最后更新：2026-04-10
> 目标：个人数字门户，Next.js 15 + Payload CMS 4，自托管 Docker on home-103

---

## 当前状态：🟡 待部署上线

代码已推送 GitHub，尚未在生产环境完成首次部署与验收。

---

## 一、已完成模块

### 1.1 基础框架
- [x] Next.js 15 App Router + Payload CMS 4 完整接入
- [x] MongoDB 数据库配置（内网 192.168.1.103）
- [x] 多主题支持（暗色/亮色，`prefers-color-scheme` 自动降级）
- [x] 全局 CSS 变量系统（`globals.css`）
- [x] `output: 'standalone'` 配置，Dockerfile 多阶段构建就绪

### 1.2 首页（`/`）
- [x] Hero 区：打字机动效（`HeroTypewriter`）+ 粒子背景（`HeroParticles`）
- [x] 站点状态面板（GitHub、博客、工具数量统计）
- [x] 精选文章卡片（CMS 数据驱动，featured 字段）
- [x] 最新文章列表（最近 3 篇）
- [x] Wandering 漫游模块入口卡片
- [x] 工具导航卡片列表（来自 `constants/tools.ts`）
- [x] 底部向下箭头滚动提示（可见性已增强：glow + 透明度 0.55）
- [x] Scroll Reveal 滚动渐入效果（`HomeScrollRevealController`）

### 1.3 导航栏（灵动岛）
- [x] Blog / Tools / About 固定文字链接
- [x] CMS 动态导航项（`navItems` Global）
- [x] 🛡 ShieldCheck 图标 → `/private/portal`（hover tooltip：基础设施门户）
- [x] 📊 LayoutDashboard 图标 → `/admin`（hover tooltip：管理后台/登录）
- [x] 🔍 Search 图标 → `/search`

### 1.4 博客系统（`/posts`）
- [x] 文章列表页（分页）
- [x] 文章详情页（Lexical 富文本渲染）
- [x] 分类（Categories）
- [x] 分区归类（Section）：aletheia-infra / coding-tools / guides-docs / visual-cos-craft / about
- [x] 草稿预览（Draft Preview）
- [x] On-demand Revalidation

### 1.5 工具页（`/coding-tools`）
- [x] 工具列表页（`TOOL_ITEMS` 静态数据）
- [x] 个人资料卡生成器（`profile-card-generator`）：实时预览 + 一键复制 Markdown ✅
- [x] Prompt 文本整理器（`prompt-polisher`）：四段式结构化生成 ✅
- [ ] 人格特质小测试（`personality-quiz-lite`）：🚧 施工中

### 1.6 其他页面
- [x] `/about` 关于页（静态内容）
- [x] `/wandering` 漫游随笔页（静态内容 + `FRAGMENTS` 常量驱动）
- [x] `/search` 全文搜索（Payload Search Plugin）
- [x] `/visual-cos-craft` 占位页（UnderConstruction 组件）
- [x] 404 页（`not-found.tsx`，全局兜底）

### 1.7 私有门户（`/private/portal`）
- [x] 静态 HTML 迁入 `src/app/(frontend)/private/portal/portal.html`
- [x] 背景图替换为本地 `/assets/backgrounds/2.png`
- [x] Auth-gated 路由（`route.ts`）：`payload.auth` 鉴权，未登录返回 403
- [x] 防止直接 URL 访问（HTML 在 `src/` 而非 `public/`）

### 1.8 基础设施
- [x] Dockerfile（node:22.17.0-alpine 多阶段，`npm install` 兼容 npm v10）
- [x] `DEPLOY.md` 完整运维手册（home-103 + Cloudflare Tunnel + Traefik）
- [x] `.gitignore` 覆盖 `.env`（密钥不入库）
- [x] GitHub 仓库：`git@github.com:MaribelHearm/amiruex-port.git`

---

## 二、待完成 / 优化积压

### 🔴 P0 — 上线阻塞

| 项目                 | 说明                                                        |
| -------------------- | ----------------------------------------------------------- |
| **首次生产部署**     | home-103 `git clone` + `docker build` + `docker compose up` |
| **管理员账号初始化** | 访问 `/admin` 创建第一个 Admin 用户                         |
| **回归验收**         | 按 DEPLOY.md 第六节逐项验证（403 门控、背景图、箭头、图标） |

### 🟡 P1 — 近期优化

| 项目                       | 类别 | 说明                                                                    |
| -------------------------- | ---- | ----------------------------------------------------------------------- |
| **Wandering 页内容填充**   | 内容 | `FRAGMENTS` 目前是占位数据，补充真实随笔条目                            |
| **人格特质小测试完成**     | 功能 | `personality-quiz-lite` 题库结构 + 结果页                               |
| **视觉一致性：子模块分区** | 视觉 | 博客列表各 Section 风格差异较大，需统一卡片样式                         |
| **About 页内容深化**       | 内容 | 当前为静态占位文本，补充真实自我介绍                                    |
| **Visual/Cos/Craft 页**    | 功能 | 目前是 UnderConstruction，待内容策划后实现                              |
| **MongoDB 清库**           | 运维 | 本地 `mongosh` 不可用，需在 Compass 或 NAS SSH 执行 `db.dropDatabase()` |

### 🟢 P2 — 长期规划

| 项目                            | 类别 | 说明                                                   |
| ------------------------------- | ---- | ------------------------------------------------------ |
| **RSS Feed**                    | 功能 | `/feed.xml` 输出博客 RSS                               |
| **阅读时间估算**                | 功能 | 文章页显示预计阅读时间                                 |
| **图片 gallery 支持**           | 功能 | Visual/Cos 页支持图集浏览                              |
| **站点统计接入**                | 运维 | Umami 或 Plausible 自托管                              |
| **更多 Tools 实现**             | 功能 | 扩充 `TOOL_ITEMS`，补充新工具                          |
| **私有门户 portal.html 模块化** | 重构 | 当前为单文件 vanilla JS，可考虑迁移为 Next.js 页面组件 |
| **E2E 测试补充**                | 测试 | `/private/portal` 403 场景、工具页交互                 |

---

## 三、路由地图

| 路由                                   | 类型      | 状态          |
| -------------------------------------- | --------- | ------------- |
| `/`                                    | 首页      | ✅             |
| `/posts`                               | 博客列表  | ✅             |
| `/posts/[slug]`                        | 博客详情  | ✅             |
| `/[slug]`                              | CMS Pages | ✅             |
| `/coding-tools`                        | 工具列表  | ✅             |
| `/coding-tools/profile-card-generator` | 工具详情  | ✅             |
| `/coding-tools/prompt-polisher`        | 工具详情  | ✅             |
| `/coding-tools/personality-quiz-lite`  | 工具详情  | 🚧             |
| `/about`                               | 关于      | ✅             |
| `/wandering`                           | 漫游      | ✅（内容待填） |
| `/search`                              | 搜索      | ✅             |
| `/visual-cos-craft`                    | 视觉      | 🚧 占位        |
| `/private/portal`                      | 私有门户  | ✅（需登录）   |
| `/admin`                               | CMS 后台  | ✅             |
| `/api/next/seed`                       | Seed 接口 | ✅             |

---

## 四、技术栈快查

| 层级   | 技术                                                              |
| ------ | ----------------------------------------------------------------- |
| 框架   | Next.js 15 App Router                                             |
| CMS    | Payload CMS 4                                                     |
| 数据库 | MongoDB 7（内网 NAS）                                             |
| 样式   | Tailwind CSS v4 + 自定义 CSS 变量                                 |
| 组件库 | shadcn/ui（部分） + lucide-react 图标                             |
| 部署   | Docker standalone → home-103 → Cloudflare Tunnel → `amireux.chat` |
| 包管理 | npm（pnpm lock 备用）                                             |
| 语言   | TypeScript 5                                                      |

---

## 五、开发约定

- **新功能分支**：`feat/xxx`，完成后合并 main 并推 GitHub
- **生产更新命令**（在 home-103）：
  ```bash
  cd /data/aletheia/build/next-portal && git pull && \
  docker build --network=host -t amireux-portal:latest . && \
  cd /data/aletheia/Aletheia-Ops/deployments/next-portal && \
  docker compose up -d --force-recreate
  ```
- **本地开发**：`npm run dev:lite`（无 admin bundle，启动快）
- **密钥管理**：`.env` 本地保留不入库，生产环境在 NAS 路径单独维护

---

> 下次对话开始时，告知 LLM 读取此文件（`plans/PROJECT_STATUS.md`）以快速恢复上下文。
