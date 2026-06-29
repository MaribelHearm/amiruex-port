# Implementation Plan: Aletheia Console dashboard polish

## Steps
- [x] Create goal and workflow task artifacts.
- [x] Spawn read-only review subagents for UI/UX and data-chain review.
- [x] Slice 1: filter count UX, active filter summary, clear filters.
- [x] Slice 2: snapshot freshness + registry metadata display.
- [x] Slice 3: category headers and service cards with richer runtime details.
- [x] Integrate data-chain worker changes: snapshot errors/missing fields and systemd timeout.
- [x] Run typecheck/lint/build.
- [x] Integrate subagent findings that fit this slice.
- [x] Integrate final subagent QA blockers:
  - attention item click now routes L2 items to `l2`, expands the category, and avoids target disappearance;
  - timer rows are normalized from `timers || timer.units`;
  - CMS seed no longer disables user-added services;
  - registry fallback/source/errors are visible to API/UI;
  - snapshot script probes health concurrently and writes degraded snapshots on registry failure;
  - Console rollback runbook added.
- [x] Deploy after successful validation.
- [x] Update ops note / Obsidian note / handoff / quality gate.

## Paths
- `src/app/(standalone)/private/portal/PortalClient.tsx`
- `src/app/(standalone)/private/portal/portal.css`
- `src/app/(standalone)/private/portal/api/status/route.ts`
- `src/app/(standalone)/private/portal/consoleRegistry.ts`
- `src/app/(standalone)/private/portal/services.ts`
- `/data/aletheia/Aletheia-Ops/tools/aletheia-console/build-status-snapshot.py`
- `/data/aletheia/Aletheia-Ops/tools/aletheia-console/README.md`
- `/data/aletheia/Aletheia-Ops/deployments/next-portal/README.md`
- `/data/aletheia/Aletheia-Ops/systemd/aletheia-console-status-snapshot.service`
- `.workflow/tasks/20260629-20260629-aletheia-console-dashboard-polish/`

## Validation commands
- `npx tsc --noEmit --pretty false` — pass
- targeted `eslint` for portal/status/registry/services — pass
- `pnpm lint` — pass with existing 17 warnings outside this change
- `pnpm build` — pass
- `git diff --check` — pass
- `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile /data/aletheia/Aletheia-Ops/tools/aletheia-console/build-status-snapshot.py` — pass
- `python3 /data/aletheia/Aletheia-Ops/tools/aletheia-console/build-status-snapshot.py --registry /data/aletheia/Aletheia-Ops/config/aletheia-console/services.json --output /data/aletheia/data/next-portal-console/status.json` — pass, ~2.17s, `errors=[]`
- `python3 -m json.tool /data/aletheia/data/next-portal-console/status.json >/dev/null` — pass
- Docker build/deploy and post-deploy curl smoke for `/`, `/admin`, `/private/portal`, `/private/portal/api/status` — pass

## Rollback points
- Source: git diff before deployment.
- Runtime image before final deploy: `aletheia-rollback/next-portal:20260629-210858` -> `sha256:52cb3af5e9aa8a941c6edbfc7f11497105acac160172b004ff20e4e168600b1e`.
- Deployed image: `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e` after 49-service registry refresh.
- Older rollback remains available: `aletheia-rollback/next-portal:20260629-204754` -> `sha256:f1fa816f09c60a2db7d0ca903d29b7f1d6e797144ee56e9894a860f4cdfd2aa8`.

## Do-not-touch respected
- Secrets / `.env` contents not printed.
- Production DB not mutated intentionally; CMS seed behavior was made less destructive for custom services.
- Real Dockge/Traefik/systemd risky operations not implemented.
- No real L2 action path; action chips are informational/disabled.
