# Validation: Aletheia Console dashboard polish

## Acceptance checklist
- [x] Core behavior lands on the real entry path.
- [x] Validation commands cover the nearest risk.
- [x] Diff scope matches the task.
- [x] Handoff is current.
- [x] Production deploy completed with rollback tag.
- [x] Ops note and Obsidian usage note updated.
- [x] Subagent QA blockers resolved and revalidated.

## Commands run
| Command | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit --pretty false` | pass | no output / exit 0 |
| `npx eslint 'src/app/(standalone)/private/portal/PortalClient.tsx' 'src/app/(standalone)/private/portal/api/status/route.ts' 'src/app/(standalone)/private/portal/consoleRegistry.ts' 'src/app/(standalone)/private/portal/services.ts' --no-warn-ignored` | pass | no output / exit 0 |
| `pnpm lint` | pass | 0 errors; 17 existing warnings outside portal changes |
| `pnpm build` | pass | `/private/portal` and `/private/portal/api/status` built as dynamic routes |
| `git diff --check` | pass | no whitespace errors |
| `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile /data/aletheia/Aletheia-Ops/tools/aletheia-console/build-status-snapshot.py` | pass | no output / exit 0 |
| `python3 /data/aletheia/Aletheia-Ops/tools/aletheia-console/build-status-snapshot.py --registry /data/aletheia/Aletheia-Ops/config/aletheia-console/services.json --output /data/aletheia/data/next-portal-console/status.json` | pass | snapshot regenerated in ~2.17s; `errors=[]` |
| `python3 -m json.tool /data/aletheia/data/next-portal-console/status.json >/dev/null` | pass | JSON valid |
| `systemctl --user status aletheia-console-status-snapshot.service/timer` | pass | service last run `status=0/SUCCESS`; timer active |
| `docker build --network=host --build-arg PAYLOAD_SECRET --build-arg DATABASE_URL -t amireux-portal:latest .` | pass | final image `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e` |
| `docker compose up -d --force-recreate` | pass | `aletheia-core-next-portal` Up; logs show Next.js `Ready in 0ms` |

## Final production smoke
- `https://amireux.chat/` -> `200 text/html; charset=utf-8`
- `https://amireux.chat/admin` -> `200 text/html; charset=utf-8`
- `https://amireux.chat/private/portal` unauth -> `307` redirect to `/admin`
- `https://amireux.chat/private/portal/api/status` unauth -> `401 {"error":"Unauthorized"}`
- Container mount/readback:
  - image `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e`
  - registry mount read-only: `/data/aletheia/Aletheia-Ops/config/aletheia-console/services.json -> /app/config/console/services.json:ro`
  - snapshot mount read-only: `/data/aletheia/data/next-portal-console -> /app/config/console-runtime:ro`
  - `registry=49`
  - `services=49`
  - `source=/data/aletheia/Aletheia-Ops/config/aletheia-console/services.json`
  - `errors=0`
  - `dockerMissing=0`
  - `dockerRunning=41`
  - `healthOk=40`
  - `healthWarn=0`
  - `healthError=0`
  - `healthUnknown=0`
  - `healthNotConfigured=9`
  - `systemdKnown=3`
  - `systemdMissing=0`
  - `traefikRoutersMissing=0`
  - `timersMissing=0`
- Runtime image: `sha256:f3bd5b6b0d0d03943a908be10e5ad82247b68bf3cb7fcaebf6f698d94625a13e`
- Rollback tag: `aletheia-rollback/next-portal:20260629-210858` -> `sha256:52cb3af5e9aa8a941c6edbfc7f11497105acac160172b004ff20e4e168600b1e`

## Anti-slop checklist
- [x] No placeholder on core path: L2 action chips are explicitly non-executing safety boundary, not fake execution.
- [x] No mock-only delivery: status API consumes real registry and host-generated snapshot.
- [x] Snapshot source does not grant Docker socket/systemd permissions to the Next Portal container.
- [x] Registry fallback/source/errors are visible instead of silently masking broken mounts.
- [x] Snapshot script writes degraded snapshot on registry failure and probes health concurrently.
- [x] No human-text timer parsing remains for timer UI fields; legacy `timer.units` is normalized.
- [x] HTTP health probes do not auto-follow redirects; expected redirect statuses are explicit in registry.
- [x] Services without health probes are `not_configured`, not false attention items.
- [x] Attention item click does not hide the target service and expands the relevant category.
- [x] CMS seed no longer disables user-added custom services.
- [x] New files are referenced by real workflow or documented as operational assets.
- [x] Risks and rollback are written.

## Remaining risk
- Authenticated visual inspection of `/private/portal` was not performed in browser because no production login session was used; code/build/runtime smoke passed and auth boundary is verified.
- Aletheia-Ops repo has many pre-existing unrelated diffs; this task only changed targeted Aletheia Console / next-portal paths.
- Real Dockge/Traefik/L2 action execution remains intentionally unimplemented; needs separate confirm-gated action runner + audit log design.
