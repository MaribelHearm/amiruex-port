# HANDOFF: Aletheia Console dashboard polish

## Status
complete

## Objective
把 `/private/portal` 打磨成高完成度 Aletheia Console dashboard，同时保持原门户站照片背景 / 毛玻璃 / 霓虹风格，并完成真实部署、运行时 snapshot、文档和回滚闭环。

## Completed
- Frontend dashboard:
  - 态势总览、health 分布、snapshot freshness、registry version/count。
  - Docker / Traefik / Timer / health / runtime rows 展示。
  - 搜索、状态筛选、分类 ribbon、清空筛选、关注项。
  - 服务卡片保留门户 glass/neon 风格，并补齐 focus-visible、reduced-motion、稳定 aria id、移动端窄屏、重复链接防护、空态清筛选、live region。
  - 关注项点击会展开对应分类；L2 关注项切到 `l2` 筛选，不会因 `not_configured`/attention 规则让目标消失。
  - L2/action chips 只展示未来确认门，不执行真实动作。
- Runtime/API:
  - 新增 authenticated `/private/portal/api/status`。
  - Next Portal 容器只读挂载 registry + snapshot，不挂 Docker socket/systemd。
  - Host snapshot 脚本采集 Docker、Traefik、systemd user timers、HTTP health。
  - Health probe 禁止自动 follow redirect；合法 301/302/307/308 写在 registry `expectStatus`。
  - Timer 字段用 `systemctl show` + `list-timers --output=json`，不再 split 人类文本；API 归一化 `timers || timer.units`。
  - 无 health 配置的服务标记 `not_configured`，不计入“需关注”。
  - Registry source/fallback/errors 显式返回；broken mount 不再被静默 DEFAULT_REGISTRY 掩盖。
  - Snapshot 脚本并发 health probe，registry 解析失败时写 degraded snapshot。
- CMS/data:
  - `seedPortalDataIfEmpty` 不再禁用用户在 CMS 添加的自定义服务。
- Ops/deploy:
  - user timer `aletheia-console-status-snapshot.timer` active。
  - final image deployed: `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e`。
  - rollback tag: `aletheia-rollback/next-portal:20260629-210858` -> `sha256:52cb3af5e9aa8a941c6edbfc7f11497105acac160172b004ff20e4e168600b1e`。
- Documentation:
  - Ops note: `/data/aletheia/Aletheia-Ops/ops-notes/2026-06-29-next-portal-console-dashboard-deploy.md`
  - Deployment README updated: `/data/aletheia/Aletheia-Ops/deployments/next-portal/README.md`
  - Snapshot README updated: `/data/aletheia/Aletheia-Ops/tools/aletheia-console/README.md`
  - Layout rule updated for `/data/aletheia/data/next-portal-console`.
  - Obsidian note: `/DATA/Documents/Obsidian/Aletheia-Memory/10-项目记忆/Aletheia Console/2026-06-29 Aletheia Console 运作说明.md`

## Key files changed
Next Portal repo `/data/aletheia/build/next-portal`:
- `src/app/(standalone)/private/portal/PortalClient.tsx`
- `src/app/(standalone)/private/portal/portal.css`
- `src/app/(standalone)/private/portal/services.ts`
- `src/app/(standalone)/private/portal/api/status/route.ts`
- `src/app/(standalone)/private/portal/consoleRegistry.ts`
- `.workflow/tasks/20260629-20260629-aletheia-console-dashboard-polish/`

Aletheia-Ops repo `/data/aletheia/Aletheia-Ops`:
- `config/aletheia-console/services.json`
- `tools/aletheia-console/build-status-snapshot.py`
- `tools/aletheia-console/README.md`
- `systemd/aletheia-console-status-snapshot.service`
- `systemd/aletheia-console-status-snapshot.timer`
- `deployments/next-portal/docker-compose.yml`
- `deployments/next-portal/README.md`
- `LAYOUT_RULES.md`
- `ops-notes/2026-06-29-next-portal-console-dashboard-deploy.md`

## Final validation
- `npx tsc --noEmit --pretty false` pass.
- targeted `eslint` for portal client + status route + registry + services pass.
- `pnpm lint` pass with existing 17 warnings outside this change.
- `pnpm build` pass.
- `git diff --check` pass.
- Snapshot script `py_compile` pass.
- Snapshot JSON valid; manual run completed in ~2.17s with `errors=[]`.
- systemd user service: `status=0/SUCCESS`, timer active.
- Final online smoke:
  - `/` -> 200
  - `/admin` -> 200
  - unauth `/private/portal` -> 307 `/admin`
  - unauth `/private/portal/api/status` -> 401
- Container snapshot readback:
  - registry=49, services=49, errors=0
  - 49 services / 41 docker running / 40 health ok / 0 warn / 0 error / 9 not configured / 4 timers / 3 systemd units / 14 Traefik routers / errors=[]
  - dockerMissing=0, systemdMissing=0, traefikRoutersMissing=0, timersMissing=0

## Rollback
```bash
cd /data/aletheia/Aletheia-Ops/deployments/next-portal
docker tag aletheia-rollback/next-portal:20260629-210858 amireux-portal:latest
docker compose up -d --force-recreate
```

To disable only Console snapshot:
```bash
systemctl --user disable --now aletheia-console-status-snapshot.timer
systemctl --user daemon-reload
```
Then roll back/remove the Console env + read-only mounts in `deployments/next-portal/docker-compose.yml` and recreate the container.

## Known remaining risk
- Authenticated browser visual check was not done from CLI because no production browser login session was used. Build/runtime/auth-boundary smoke passed.
- Real Dockge/Traefik/L2 action execution remains intentionally unimplemented; needs confirm-gated action runner + audit log design.
- Aletheia-Ops repo has many unrelated pre-existing diffs outside this task; do not treat whole repo status as this task’s diff.

## Next safest action if reopened
- If user wants visual QA, log into `https://amireux.chat/admin`, open `/private/portal`, check desktop/mobile screenshots.
- If user wants action execution, design a separate L2 action runner with explicit confirmation, audit log, allowlist, timeout and rollback before coding.
