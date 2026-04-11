# Bilibili 音频转文字模块上云 README（给 LLM 运维助手）

> 适用项目：`next-portal`
> 目标：将“B 站音频转文字（任务制）”稳定部署到云端生产环境。

---

## 1. 当前状态（可上云前提）

功能代码已完成，包含：
- B站链接下载 + 抽音 + 归一化 + 时长检测
- 任务状态机（queued/running/succeeded/failed）
- 任务 ID 恢复
- Provider 链式降级（腾讯优先）
- 腾讯 ASR 限制规避（>60s 自动切片；>3MB 自动压缩）
- 服务端任务缓存 TTL + 定时 GC

**上线阻塞点**（必须处理）：
1. 生产镜像内需有 `yt-dlp / ffmpeg / ffprobe`
2. 生产 `.env` 需补齐转写变量与密钥

---

## 2. 关键代码位置（便于运维助手定位）

- 转写主逻辑：`src/app/(frontend)/next/transcribe/lib.ts`
- 创建任务接口：`src/app/(frontend)/next/transcribe/route.ts`
- 查询任务接口：`src/app/(frontend)/next/transcribe/[taskId]/route.ts`
- 前端工具页：`src/components/tools/BilibiliAudioTranscriberPlayground.tsx`
- 工具入口配置：`src/constants/tools.ts`
- 变量模板：`.env.example`
- 现有部署文档：`DEPLOY.md`
- 镜像构建：`Dockerfile`

---

## 3. 生产环境变量（必须注入）

至少需要：

```env
# 核心
TRANSCRIBE_PROVIDER_CHAIN=tencent_asr,azure_speech_asr,openai_asr,custom_asr_http
TRANSCRIBE_MAX_MINUTES=10
TRANSCRIBE_MAX_UPLOAD_MB=30
TRANSCRIBE_TIMEOUT_MS=300000
TRANSCRIBE_TASK_GC_INTERVAL_MS=600000

# 腾讯主链路
TENCENT_ASR_SECRET_ID=***
TENCENT_ASR_SECRET_KEY=***
TENCENT_ASR_REGION=ap-guangzhou

# 可执行路径（容器内路径，建议显式配置）
TRANSCRIBE_YTDLP_PATH=/usr/bin/yt-dlp
TRANSCRIBE_FFMPEG_PATH=/usr/bin/ffmpeg
TRANSCRIBE_FFPROBE_PATH=/usr/bin/ffprobe

# 可选降级（不配会自动跳过）
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
TRANSCRIBE_API_KEY=
OPENAI_ASR_MODEL=gpt-4o-mini-transcribe
CUSTOM_ASR_ENDPOINT=
CUSTOM_ASR_TOKEN=
```

---

## 4. Docker 镜像要求（必须满足）

在运行层安装系统依赖：
- `ffmpeg`
- `yt-dlp`
- `ffprobe`（通常在 ffmpeg 包内）

> 注意：当前项目是 `node:22-alpine`，请使用 `apk add` 安装可用包；若 `yt-dlp` 在 Alpine 源不可用，改为 `pip` 方式安装，或切换 Debian 基础镜像后 `apt-get install`。

建议让运维助手做以下校验（容器内）：

```bash
which yt-dlp && yt-dlp --version
which ffmpeg && ffmpeg -version
which ffprobe && ffprobe -version
```

---

## 5. 部署步骤（home-103 现有流程）

按既有流程执行：

1. 拉取最新代码（包含转写模块）
2. 准备 build-time `.env`（数据库/站点基础配置）
3. 准备 runtime `.env`（新增转写变量）
4. 使用既有命令构建并重启容器
5. 进入容器自检三件套：`yt-dlp/ffmpeg/ffprobe`
6. 打开工具页做实测

参考现网流程文档：`DEPLOY.md`

---

## 6. 上线后验收清单（必须跑）

### A. 功能验收
- 打开 `/coding-tools/bilibili-audio-transcriber`
- 输入短视频链接（1~3 分钟）
- 观察任务：`queued -> running -> succeeded`
- 文本可复制、任务ID可复制、刷新后可找回

### B. 边界验收
- 超过 60 秒音频：可自动切片后转写
- 体积较大音频：可自动压缩后继续转写
- 未配置 Azure/OpenAI/Custom 时：不应导致链路直接失败（应被跳过）

### C. 资源验收
- 临时文件会在任务结束删除
- 任务缓存 6 小时 TTL，且有定时 GC
- 连续运行后容器内磁盘与内存无持续线性增长

---

## 7. 常见故障与处理

### 7.1 `DOWNLOAD_FAILED`
原因多为下载器环境缺失或不可达。
处理：
- 容器内确认 `yt-dlp/ffmpeg/ffprobe` 可执行
- 明确设置 `TRANSCRIBE_YTDLP_PATH` / `TRANSCRIBE_FFMPEG_PATH` / `TRANSCRIBE_FFPROBE_PATH`

### 7.2 `Data larger than 3MB`
已在代码中处理（压缩），若仍报错：
- 检查 ffmpeg 是否可用
- 检查压缩后文件是否真的落盘

### 7.3 `ErrorVoicedataTooLong (>60s)`
已在代码中处理（分段），若仍报错：
- 检查切片命令执行状态
- 检查分段文件是否生成

### 7.4 `所有 provider 失败`
- 若只配置腾讯，确认腾讯密钥有效且余额/配额正常
- 其余 provider 不配置时现在会自动跳过

---

## 8. 安全要求（必须遵守）

- `.env` 绝对不入库
- SecretId/SecretKey 不在日志中明文打印
- 发现密钥泄露立即轮换
- 生产建议最小权限 AK/SK

---

## 9. 回滚方案

若上线异常：
1. 回滚到上一个可用镜像 tag
2. 保留数据库不回滚（本次主要是工具模块，不涉及结构迁移）
3. 恢复旧 runtime `.env`
4. 重启服务并验证首页/后台可用

---

## 10. 给 LLM 运维助手的执行指令（可直接粘贴）

请按以下目标执行并输出结果：

1. 检查并补齐容器依赖：`yt-dlp/ffmpeg/ffprobe`
2. 将转写相关环境变量注入 runtime `.env`
3. 构建并重启 `next-portal` 服务
4. 容器内执行三件套版本检查并回传输出
5. 访问 `/coding-tools/bilibili-audio-transcriber` 用一个 1~3 分钟 B站链接做实测
6. 回传任务状态流转、最终 provider、文本输出是否成功

完成标准：
- 页面任务成功（succeeded）
- 文本可复制
- 无 `DOWNLOAD_FAILED`
- 无腾讯 3MB/60s 报错

---

## 11. 备注

如果后续要支持更长音频与高并发，建议下一阶段改造：
- 任务存储从内存 Map 迁移到 Redis
- 转写执行迁移到队列 Worker
- 增加速率限制与租户级配额
- 增加任务历史分页查询接口
