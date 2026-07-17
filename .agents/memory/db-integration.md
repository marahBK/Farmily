---
name: Database integration approach
description: How Farmily's PostgreSQL backend is wired up — what works, what doesn't, session strategy
---

## What's backed by PostgreSQL
Tables: `parents`, `children`, `allowances`, `requests`, `notifications`, `mailbox`, `approvals`

Server functions in `src/lib/api/` (auth, children, allowances, requests, mailbox).
Each function uses `pool` from `src/lib/db.ts` (pg Pool, `DATABASE_URL` env var).

## What stays in localStorage
- Child farm game state (`farmily-child-v1`) — coins, crops, inventory, level, XP
- Parent session ID only (`farmily-session`) — a single string, not full state

## Session strategy (no vinxi/cookies)
**Do NOT use `vinxi/http`** — `vinxi` is not directly importable in this project's dev environment (ERR_MODULE_NOT_FOUND even though TanStack Start uses it internally).

Instead: store `parentId` in `localStorage` under `farmily-session` key. All server functions that need auth receive `parentId` as an explicit input parameter.

**Why:** Simpler, avoids the vinxi resolution issue entirely. Fine for an educational app with no real money.

## createServerFn pattern
- Import from `@tanstack/react-start`
- Validate with `zod`
- Access DB directly via `pool` — no cookie/session middleware
- During SSR, server functions run directly on the server; during client render, they make HTTP POST calls to `/api/` endpoints automatically

## Cross-store communication (parent ↔ child)
- Allowances: parent writes to `mailbox` table → child polls `apiCheckMailbox` (count) every 8s, claims via `apiClaimMailbox` on mailbox tap
- Goal/savings requests: child writes via `apiSubmitRequest` → parent sees in `requests` table on next `apiGetParentData` refresh
- Approvals: parent writes to `approvals` table → child polls `apiCheckApprovals` with pending `requestIds`

## Polling intervals
- `pollMailbox` (count check): every 8s in child farm — DB-backed, so no need to hammer
- `checkApprovals`: every 8s in child farm
- Old localStorage polling at 1.5s was removed
