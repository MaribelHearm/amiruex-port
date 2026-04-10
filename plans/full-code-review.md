# next-portal 全量代码审查报告

> 审查范围：`next-portal` 全仓（源码、配置、测试、基础设施）
> 审查方式：静态审查（逐模块读取 + 规则检索）
> 产出时间：2026-04-10

---

## 1. 审查结论（Executive Summary）

项目整体结构清晰，基于 Payload + Next.js App Router 的内容站点架构完整，模块分层较明确（collections/globals/front routes/components/providers）。

当前主要风险集中在以下 5 类：

1. **访问控制语义易错**：在 draft 预览相关查询处使用 `overrideAccess: draft`，存在“草稿场景反而绕过 access”的风险。
2. **基础设施配置漂移**：`Dockerfile` 与 `docker-compose` 在 Node 版本、包管理器、数据库类型上存在明显分叉。
3. **测试用例与现状不一致**：e2e 仍断言模板站点标题，和当前品牌/页面内容不符，稳定性与有效性不足。
4. **私有门户硬编码资产过多**：`PortalClient` 中内网 IP 与大量服务 URL 硬编码，维护成本高、泄露面偏大。
5. **代码质量一致性问题**：`any`/`ts-expect-error`/生成类型忽略项及部分 magic number 存在，影响长期演进。

---

## 2. 审查覆盖矩阵

| 模块                                                                | 覆盖情况 | 结果                                     |
| ------------------------------------------------------------------- | -------- | ---------------------------------------- |
| 项目规范与说明 (`AGENTS.md`, `README.md`)                           | 已审     | 有较清晰规范，实际落地存在偏差           |
| 核心配置 (`payload.config.ts`, plugins, access, hooks)              | 已审     | 架构合理，access 使用存在关键风险点      |
| Collections (`Pages/Posts/Categories/Media/Users/Photos/Fragments`) | 已审     | 模型完整，草稿与自动保存策略不一致       |
| Frontend 路由 (`src/app/(frontend)`)                                | 已审     | 页面结构完整，分页与查询策略有瑕疵       |
| API 与 endpoints (`preview/seed/markdown-to-lexical/search`)        | 已审     | 功能完备，部分输入与错误处理可增强       |
| Components / Blocks / Providers                                     | 已审     | 复用性较好，存在类型安全与可维护性改进点 |
| Utilities / Constants                                               | 已审     | 工具函数基本清晰，环境 URL 语义需统一    |
| 测试 (`vitest`, `playwright`)                                       | 已审     | 覆盖浅、断言陈旧、业务可信度有限         |
| 工程与运维 (`package.json`, Docker, compose, eslint, tsconfig)      | 已审     | 关键配置存在“文档/脚本/容器”不一致       |

---

## 3. 问题分级清单

> 分级定义：阻断（Blocker）/ 高（High）/ 中（Medium）/ 低（Low）

### 3.1 高风险（High）

#### H-01 预览草稿查询中的 `overrideAccess` 语义风险
- **位置**：
  - `src/app/(frontend)/[slug]/page.tsx`
  - `src/app/(frontend)/posts/[slug]/page.tsx`
- **现象**：查询函数中出现 `overrideAccess: draft`。
- **风险**：
  - 当 `draft = true` 时，可能绕开 collection access，导致访问控制与预期不一致。
  - 与 `AGENTS.md` 中“Local API 查询应显式 `overrideAccess: false`”原则冲突。
- **影响面**：页面预览、草稿读取链路、潜在越权可见性。
- **建议修复**：
  1. 所有 Local API 查询默认统一 `overrideAccess: false`；
  2. 通过 `draft` 参数仅控制版本/草稿读取，不参与 access override；
  3. 对 preview route 增加端到端权限测试（匿名、登录、不同角色）。
- **回归验证点**：
  - 匿名用户访问草稿 URL 不可读；
  - 有权限用户可在 preview token 生效下读取草稿；
  - 发布态页面行为不变。

#### H-02 Docker / Compose 环境严重漂移
- **位置**：`Dockerfile`, `docker-compose.yml`, `package.json`
- **现象**：
  - Dockerfile 使用 `node:22` 并按 lockfile 选择包管理器；
  - compose 使用 `node:18` + `yarn install && yarn dev`；
  - 项目 engines 与脚本主线为 Node 22 + pnpm；
  - compose 依赖 `mongo`，但项目配置已使用 postgres 方向（含迁移脚本）。
- **风险**：
  - 开发/CI/生产行为不一致，出现“本地可跑、容器不一致”问题；
  - 安装树与 lockfile 偏差导致构建不可复现；
  - 新成员接入成本高。
- **建议修复**：
  1. 统一 Node 版本（推荐 22）；
  2. 统一包管理器（建议 pnpm），compose 命令改为 `pnpm i --frozen-lockfile && pnpm dev`；
  3. 数据库栈与 payload 实际驱动统一（保留单一方案）；
  4. 在 README/DEPLOY 中同步更新。
- **回归验证点**：
  - 本机与容器 `pnpm dev` 页面一致；
  - `pnpm build` 在容器内可复现；
  - 集成测试连接数据库正常。

#### H-03 私有门户硬编码大量内网地址
- **位置**：`src/app/(standalone)/private/portal/PortalClient.tsx`
- **现象**：大量 `http://192.168.1.103:xxxx`、外网域名、门户标识直接硬编码在客户端代码。
- **风险**：
  - 配置变更需改代码并重新发布；
  - 内网拓扑信息暴露在前端构建产物中；
  - 多环境（dev/staging/prod）难切换。
- **建议修复**：
  1. 将服务列表抽离至服务端配置（Payload global / JSON 配置 / 环境变量 + server loader）；
  2. 客户端仅消费最小必要字段；
  3. 对敏感服务项增加展示白名单。
- **回归验证点**：
  - 不同环境切换无需改前端源码；
  - 构建产物中不包含不必要内网地址；
  - 门户渲染与搜索功能不退化。

---

### 3.2 中风险（Medium）

#### M-01 分页计算与查询 `limit` 不一致
- **位置**：`src/app/(frontend)/posts/page/[pageNumber]/page.tsx`
- **现象**：页面列表查询 `limit: 12`，静态参数页数计算使用 `Math.ceil(totalDocs / 10)`。
- **风险**：
  - 页码数量错误，可能出现漏页/空页；
  - SEO 与 sitemap 页链接一致性受影响。
- **建议修复**：统一分页常量（如 `POSTS_PAGE_SIZE = 12`），查询与页码计算共用。
- **回归验证点**：边界值（0、1、11、12、13、24、25）分页正确。

#### M-02 自动保存策略不一致且部分过于激进
- **位置**：`collections/Pages`, `collections/Photos`, `collections/Fragments`, `collections/Posts`
- **现象**：`autosave.interval` 在 100ms 与 2000ms 间混用。
- **风险**：
  - 高频 autosave 增加后台压力与版本噪音；
  - 编辑体验不一致。
- **建议修复**：按文档类型统一策略（例如内容型 1000~2000ms，结构型 2000ms+）。
- **回归验证点**：编辑器输入延迟、版本写入频率、数据库写负载。

#### M-03 测试断言与当前业务文案脱节
- **位置**：`tests/e2e/frontend.e2e.spec.ts`
- **现象**：仍断言 `Payload Website Template` 标题与 h1。
- **风险**：
  - 测试通过不代表业务正确；
  - 迁移后回归价值显著下降。
- **建议修复**：改为断言当前站点关键元素（品牌标题、核心导航、主要内容块）。
- **回归验证点**：首页关键可见元素、路由跳转、首屏可交互。

#### M-04 `FormBlock` 中字段渲染使用 `any`
- **位置**：`src/blocks/Form/Component.tsx`
- **现象**：`const Field: React.FC<any>`。
- **风险**：
  - 字段 schema 变更时缺少类型保护；
  - 运行时错误延后暴露。
- **建议修复**：为 `fields` 映射建立判别联合类型，移除 `any`。
- **回归验证点**：TS 编译期可捕获字段 props 不匹配。

#### M-05 `RenderBlocks` 依赖 `@ts-expect-error`
- **位置**：`src/blocks/RenderBlocks.tsx`
- **现象**：动态 Block 渲染处以 `@ts-expect-error` 抑制类型。
- **风险**：
  - 隐藏真实类型不一致；
  - 新 block 接入容易在运行时踩雷。
- **建议修复**：建立 `blockType -> component props` 的显式映射类型。
- **回归验证点**：新增 block 时可在编译期发现参数错误。

---

### 3.3 低风险（Low）

#### L-01 ESLint 对 `no-explicit-any` 仅 warn
- **位置**：`eslint.config.mjs`
- **建议**：核心目录（`src/app`, `src/collections`, `src/blocks`）可逐步提升至 error，或采用分目录策略。

#### L-02 生成类型文件被 ESLint ignore
- **位置**：`eslint.config.mjs`
- **说明**：可接受（通常自动生成），但应在文档明确“生成文件不做 lint”。

#### L-03 私有门户文件体量过大
- **位置**：`PortalClient.tsx`（单文件 700+ 行）
- **建议**：拆分为数据、主题、视图组件、动画层、工具函数，提升可测性。

#### L-04 少量默认模板残留文案/链接
- **位置**：seed 内容、部分组件注释与外链
- **建议**：做一次内容清理，避免与品牌不一致。

---

## 4. 模块级审查备注

### 4.1 Access / Collections / Hooks
- 访问控制整体设计方向正确（`authenticatedOrPublished` 等）。
- 主要问题不在 access 定义本身，而在业务查询调用时对 `overrideAccess` 的使用方式。
- revalidate hooks 基本完整，需补充“草稿与发布态”联动测试。

### 4.2 Frontend Routes / Search / Endpoints
- 前台页面路由完整，内容展示逻辑清晰。
- 搜索、分类、分页链路可用，但分页常量与查询策略应统一。
- seed 与 markdown-to-lexical 端点功能可用，建议增加输入大小、超时与错误格式标准化。

### 4.3 Components / Blocks / Providers
- UI 组件层分层清晰，复用良好。
- 动态表单与动态 block 的类型边界仍较弱（`any`, `ts-expect-error`）。
- Theme Provider 实现简洁，建议补充 hydration 与偏好切换回归测试。

### 4.4 Tests / QA
- 当前测试更像“烟雾测试最小骨架”。
- 缺少针对关键业务风险的测试：
  - preview/draft 权限；
  - sitemap 与分页一致性；
  - private portal 配置渲染；
  - seed 后关键数据完整性。

### 4.5 Infra / DevEx
- 工程脚本主线（pnpm）与 compose（yarn）冲突需优先收敛。
- Node 版本不统一会持续制造“环境偶发现象”。

---

## 5. 建议整改优先级（行动计划）

### P0（立即）
1. 修复 preview/draft 查询的 `overrideAccess` 使用，统一为 `false`。
2. 统一容器与本地开发栈（Node / 包管理器 / DB）。
3. 私有门户服务地址配置外置，避免硬编码拓扑。

### P1（短期）
1. 修复分页常量不一致问题。
2. 更新 e2e 断言为当前业务真实页面。
3. 为动态表单与 blocks 建立类型映射，逐步消除 `any` 与 `@ts-expect-error`。

### P2（中期）
1. 统一 autosave 策略并记录在规范。
2. 拆分 `PortalClient` 大文件，增强可测试性。
3. 增补权限/预览/分页/sitemap 回归用例。

---

## 6. 回归测试建议清单

1. **权限回归**：匿名、登录用户、管理员分别验证页面/文章草稿可见性。
2. **预览回归**：`preview`/`exit-preview` 前后缓存与页面状态正确。
3. **分页回归**：边界数量文档下页码、列表、SEO 元数据一致。
4. **容器回归**：compose 启动、build、测试链路与本地一致。
5. **门户回归**：配置源切换后门户分类、搜索、链接状态正常。

---

## 7. 总体评价

`next-portal` 已具备较完整的内容站点基础能力与可扩展结构，当前问题集中在”安全语义一致性、环境一致性、测试有效性、配置外置化”四个方向。优先完成 P0/P1 后，项目稳定性与可维护性会明显提升。

---

## 8. 上云部署实录（2026-04-10）

> 本节记录将项目部署至 home-103（自托管 Docker + Cloudflare Tunnel）过程中实际遭遇的问题及处理结果，与上方审查结论对照。

### 8.1 与 H-02 相关——构建环境问题

**实际触发：**
- `npm ci` 在 Docker build 中失败（`yjs`、`monaco-editor` 等 peer dep 不在 lock file）。
- 根因与 H-02 一致：npm v10 不再将 peer dependencies 写入 lock file，`npm ci` 要求完整 lock file，两者不兼容。

**已修复（commit `f977440`）：**
- `Dockerfile` 中将 `npm ci` 改为 `npm install`，绕过 lock file 严格校验。

**遗留问题（对应 H-02 建议）：**
- 项目根 `docker-compose.yml`（开发用模板）仍为 `node:18 + yarn`，与生产 Dockerfile（`node:22 + npm`）不一致。
- 生产部署不走该文件，但新成员接入时容易混淆，建议后续统一或在文件头注明”仅本地开发用”。

**额外发现的构建时 TS 错误（同批修复）：**

| 文件 | 错误 | 修复 |
|------|------|------|
| `SectionPostsPage.tsx` | `select` 缺 `excerpt` 字段，类型不满足 `CardPostData[]` | 补加 `excerpt: true` |
| `search/page.tsx` | `as CardPostData[]` 类型重叠不足 | 改为 `as unknown as CardPostData[]` |
| `Posts/index.ts` | `slugField overrides.admin` 不在 `RowField` 类型中 | 移除 `overrides.admin` |
| `seed/index.ts` | `About` global 无 `navItems`，`updateGlobal` 类型检查失败 | 改为 `data: { navItems: [] } as any` |
| `payload-types.ts` | 本地已生成含 `About` 的新类型，未提交到 GitHub | 补 commit |
| `src/features/MarkdownImport/` | 整个目录存在于本地，未加入 git | 补 commit |

### 8.2 与 H-03 相关——内网地址暴露

**现状：**
- `PortalClient.tsx` 含 25 处 `192.168.1.103:xxxx` 硬编码，编译进公开 JS bundle。
- 路由保护正确（服务端 `payload.auth()` + redirect），未登录用户无法看到页面。
- 但 Next.js client chunk 本身可被公开下载（URL 为哈希值，每次 build 变更）。

**风险评估（上云场景）：**
- 内网 IP 对公网访问者无实际攻击价值（无法路由到内网）。
- 外网域名（`ai.amireux.chat` 等）本身非保密信息。
- 当前风险：低。不阻塞上云，但属于信息卫生问题。

**后续建议（对应 H-03 建议）：**
- 将服务列表迁移至 Payload Global（后台可配置），`PortalClient` 改为接收 props，不再硬编码。
- 迁移后内网地址不进入前端 bundle，配置变更也无需重新发布。

### 8.3 新增运维注意事项（审查时未覆盖）

| 问题 | 说明 |
|------|------|
| **媒体上传权限** | 容器以 uid 1001（nextjs）运行，`/app/public/media` 在镜像中归 root，首次上传报 `EACCES`。需挂载宿主机卷并设置 `chown 1001:1001`。已在 IaC compose 中修复。 |
| **build 时需 `--network=host`** | Payload CMS 在 `next build` 阶段连接 MongoDB 做静态页生成，builder 容器需通过 `127.0.0.1:27017` 访问宿主机 MongoDB。不加此参数 build 直接失败。 |
| **build-time vs runtime `.env` 分离** | 构建目录 `.env` 用 `127.0.0.1:27017`；IaC 部署目录 `.env` 用容器名 `aletheia-core-mongodb-nextportal:27017`。两者用途不同，不可混用。 |
| **git pull 冲突恢复** | 首次部署用 scp 手动 patch 了若干文件，导致后续 `git pull` 冲突。恢复命令：`git reset --hard HEAD && git clean -fd src/features/ && git pull`。 |
