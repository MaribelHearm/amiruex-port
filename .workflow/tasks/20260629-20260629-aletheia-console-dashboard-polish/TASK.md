# TASK: Aletheia Console dashboard polish

## Status
complete

## Objective
把 `/private/portal` 从可用仪表盘继续打磨到高完成度，同时保持现有门户站毛玻璃 / Tokyo Night 霓虹 / Apple 弹簧动画风格。

## Scope
- next-portal `/private/portal` 客户端 UI 与交互
- console status API 数据在仪表盘里的呈现
- 服务卡片、分类、搜索、筛选、关注项、响应式体验
- 验证、部署、回滚和运维记录

## Acceptance
- [x] 门户站风格保持一致，不引入 SaaS/admin sidebar 壳。
- [x] 信息架构清晰：态势总览、关注项、筛选搜索、分类服务墙各司其职。
- [x] 状态展示完整：health/docker/traefik/timer/runtime/registry/snapshot freshness 能被理解。
- [x] 交互细节可用：筛选带数量、可清空、分类 header 有摘要、服务卡片有运行细节与安全边界。
- [x] 移动端基础可用；typecheck/lint/build/smoke 通过。
- [x] 上线和回滚路径明确；文档/运维记录更新。
- [x] 子进程 QA 的阻断项已收口：关注项过滤、timer legacy 归一化、CMS 自定义服务不再被自动禁用、Console 回滚 runbook。

## Current step
Done: deployed image `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e` with rollback tag `aletheia-rollback/next-portal:20260629-210858` -> `sha256:52cb3af5e9aa8a941c6edbfc7f11497105acac160172b004ff20e4e168600b1e`; registry refreshed to 49 services.

## Next safest action
If continuing, do an authenticated browser visual pass of `/private/portal` from a logged-in Payload session, or start a separate design for confirm-gated L2 action runner.

## Links
- PRD: `prd.md`
- Design: `design.md`
- Implementation: `implement.md`
- Validation: `validation.md`
- Handoff: `HANDOFF.md`
- Ledger: `ledger.jsonl`
