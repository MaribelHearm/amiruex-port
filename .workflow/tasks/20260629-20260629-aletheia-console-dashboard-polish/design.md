# Design: Aletheia Console dashboard polish

## Current state evidence
- `/private/portal` server entry: `src/app/(standalone)/private/portal/page.tsx`，Payload 登录态保护，未登录 redirect `/admin`。
- Client entry: `PortalClient.tsx`，已有 Aletheia 标题、背景图、雨效、主题切换、状态 API fetch、dashboard overview、关注项、服务卡片。
- Status API: `api/status/route.ts`，登录态保护；registry + host snapshot merge；未登录 401。
- Deploy compose mounts registry + snapshot read-only。
- Design rule: `.roo/rules/design-system.md` 要求老苹果毛玻璃、Tokyo Night 霓虹、顶部彩线、不能偏 SaaS 后台。

## Proposed design
Slice 1 focuses on high-impact polish without changing core architecture:
1. Filter UX: filter tabs show counts; active filters can be cleared; visible result count always obvious.
2. Data freshness: snapshot loaded/pending/stale/fresh information appears in the overview.
3. Registry/runtime visibility: show registry version/update when API returns it; cards use API runtime fallback.
4. Category/service density: category headers and chips show ok/attention/l2/no-ui; card runtime strip shows host/compose/container/latency/router/timer/error where available.
5. Safety boundary: actions/L2 remain informational only; no execution path.

## Affected paths
- `src/app/(standalone)/private/portal/PortalClient.tsx`
- `src/app/(standalone)/private/portal/portal.css`
- `.workflow/tasks/20260629-20260629-aletheia-console-dashboard-polish/*`

## Flow
User loads `/private/portal` -> client fetches `/private/portal/api/status` -> registry/snapshot status is merged into memoized stats -> user searches/filters/categories -> dashboard and card wall update with counts and clear affordance.

## Risks
- Portal page is already production-deployed; further changes must preserve auth boundary and existing routes.
- Large inline style file increases patch risk; change one area at a time and typecheck quickly.
- More density can harm mobile readability; CSS must collapse panels cleanly.

## Rollback
- Source rollback: revert touched files in git.
- Runtime rollback: tag current/previous `amireux-portal:latest` before deployment and `docker compose up -d --force-recreate`.

## Alternatives
- Full UI rewrite was rejected because current portal style is accepted and should be extended, not replaced.
- Chart library rejected; use native strips/chips/dots to stay lightweight.
