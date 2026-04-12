# Tools Module — Development Workflow

> 工具模块的开发规范。每个新工具的本地开发流程和上云配合要求。

---

## 一、工具模块结构

每个工具定义在 `src/constants/tools.ts` 的 `TOOLS` 数组中：

```ts
{
  id: 'tool-id',
  name: '工具名称',
  description: '简短描述',
  icon: LucideIcon,
  href: '/tools/tool-id',       // 或外部链接
  badge: 'New' | '热门' | ...,  // 可选
  category: 'media' | 'text' | 'ai' | ...,
}
```

UI 入口：`src/app/(frontend)/tools/` 或嵌入首页工具区块。

---

## 二、本地开发流程

### 纯前端工具（无需后端）

1. 在 `tools.ts` 注册工具定义
2. 创建 `src/app/(frontend)/tools/<tool-id>/page.tsx`
3. UI 遵循 design-system.md（毛玻璃卡片、霓虹三色、弹簧动画）
4. 本地 `npm run dev` 验证

### 需要后端 API 的工具

1. 创建 `src/app/api/<tool-id>/route.ts`
2. 所有外部服务调用通过环境变量注入（不硬编码密钥）
3. 新增环境变量**必须同步更新 `.env.example`**
4. 在 `plans/<tool-id>-cloud-readme.md` 记录云端依赖（见第三节）

### 需要系统依赖的工具（如 yt-dlp、ffmpeg）

1. 在 `Dockerfile` runner 阶段的 `apk add` 行补充安装命令
2. 可执行文件路径通过 env var 注入（如 `TOOL_BIN_PATH`），方便多环境覆盖
3. 更新 `.env.example` 添加路径占位符

---

## 三、上云配合 checklist（每个新工具必须完成）

在提交 PR 前，先通过“开发者人工验收”，再确认以下三项全部就绪，否则 `/ops:menhu` 的 pre-flight 检查会拦截部署：

- [ ] **开发者人工验收已通过（强制）**：由开发者本人完成本地手工检查（功能正确、UI 正确、关键路径无明显 bug）
- [ ] **`.env.example` 已更新**：新工具所有环境变量都有占位符和注释
- [ ] **`Dockerfile` 已更新**：新的系统依赖已加入（如有）
- [ ] **`Dockerfile` builder stage 已声明 `ARG`**：若新变量需在 `next build` 阶段访问（DB URL、服务端 API 密钥等），必须在 `builder` stage 加 `ARG VAR` + `ENV VAR=$VAR`。`.env` 被 `.dockerignore` 排除，不声明 `ARG` 则 `--build-arg` 传入无效，变量为空且构建不报错（静默失败）
- [ ] **`plans/<tool-id>-cloud-readme.md` 已创建**：记录以下内容：
  - 工具功能简述
  - 新增环境变量列表（含用途、从哪里获取）
  - 新增系统依赖（含版本要求）
  - 上云验证方法（用什么请求/响应确认工具正常）

---

## 三-B、build-time 变量 vs runtime 变量

`.env` 被 `.dockerignore` 排除，build 阶段无法读取文件，只能通过 `--build-arg` 注入。

| 类型 | 使用时机 | 配置位置 | 提取方式 |
| ---- | -------- | -------- | -------- |
| **build-time** | `next build` 阶段（Payload 初始化、DB 连接、静态页生成） | Dockerfile `ARG`+`ENV` + build-time `.env`（`127.0.0.1`） | `cut -d= -f2-`（含 `=` 的值必须用） |
| **runtime** | 容器运行阶段 | `deployments/next-portal/.env`（容器名） | — |

**如何判断是否需要 build-time 声明**：`next build` 期间若有代码调用 Payload/DB（静态页 `generateStaticParams`、集合查询），该变量就需要 build-time 声明。纯前端工具（无 SSG、无 Payload 查询）通常只需 runtime。

---

## 四、cloud-readme 模板

路径：`plans/<tool-id>-cloud-readme.md`

```markdown
# <Tool Name> — 上云说明

## 功能
<一句话描述>

## 新增环境变量
| 变量名      | 用途          | 获取方式       |
| ----------- | ------------- | -------------- |
| FOO_API_KEY | 调用 Foo 服务 | foo.com 控制台 |

## 新增系统依赖
| 包名   | 版本 | 安装方式       |
| ------ | ---- | -------------- |
| ffmpeg | ≥6.0 | apk add ffmpeg |

## 验证
curl -X POST https://amireux.chat/api/<tool-id> -d '{"test":true}'
期望：{"ok":true}
```

---

## 五、已有工具的云端信息

| 工具               | 关键 env var                                                                                                         | 系统依赖                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 转录（transcribe） | `TENCENT_ASR_*`, `AZURE_SPEECH_*`, `TRANSCRIBE_YTDLP_PATH=/usr/bin/yt-dlp`, `TRANSCRIBE_FFMPEG_PATH=/usr/bin/ffmpeg` | ffmpeg, yt-dlp（Alpine apk） |

> 完整 env 见 `/data/aletheia/Aletheia-Ops/deployments/next-portal/.env.example`

---

## 六、禁止事项

- **不在代码里硬编码 API 密钥或服务地址**
- **不跳过 `.env.example` 更新**（会被 pre-flight 检查拦截）
- **不在 PR 里提交 `.env` 文件**（已在 `.dockerignore` 和 `.gitignore` 中排除）
- **系统依赖不要装在 builder stage**（只装在 runner stage，减小镜像体积）
- **不用 `cut -d= -f2` 提取 env 值**（URL query 参数、base64 含 `=` 会被截断）；统一用 `cut -d= -f2-`
- **新增 build-time 变量后不忘在 Dockerfile `builder` stage 声明 `ARG`**（否则 `--build-arg` 传入无效，变量为空，构建静默失败）
