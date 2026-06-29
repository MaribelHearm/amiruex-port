# PRD: Aletheia Console dashboard polish

## User goal
用户认可当前视觉风格，要求继续完善到“仪表盘”应有的完成度，并明确要求开 goal、合理运用子进程。

## Requirements
- 保持门户站现有视觉：摄影背景、毛玻璃、低对比暗色、霓虹三色、彩线卡片、轻量弹簧动画。
- `/private/portal` 是 homelab 服务仪表盘，不是普通导航页，也不是另一套 SaaS 后台。
- 能快速看懂：总服务数、健康状态、需关注项、Docker/Timer/L2/无后台、snapshot 是否新鲜。
- 能快速定位：搜索、状态筛选、分类筛选、清空筛选、分类摘要。
- 服务卡片要同时能打开后台，也能看运行细节；无后台服务仍然有信息价值。
- L2/危险操作只展示安全边界，不执行。

## Constraints
- 不读取/输出 `.env` 或真实 secret 值。
- 不改生产数据库、不发邮件、不执行 Dockge restart/update/stop。
- 不新增主色系，不做 admin sidebar，不用 Chart.js 这类重组件。
- 已有本地未提交 Console MVP 改动不能 reset。

## Non-goals
- 本轮不实现真实容器重启/更新/停止。
- 本轮不重构整个 portal 为全新设计系统。
- 本轮不改 Payload admin 登录逻辑。

## Acceptance criteria
- typecheck/lint/build 通过。
- 线上 smoke：`/` 200、`/admin` 200、未登录 `/private/portal` 307、API 401。
- 视觉关键词仍是“门户站风格仪表盘”。

## Open questions
- 已授权上线；最终上线前仍按 deploy 验证闭环执行。
