---
name: Cross-store channels
description: How parent store and child store communicate without a shared React context, using localStorage side-channels.
---

## The rule
The parent (farmily-store) and child (child-store) each persist to their own localStorage key (`farmily-state-v1` and `farmily-child-v1`). They are never in the same React tree at the same time. Communication uses two additional keys:

- `farmily-mailbox` — array of `{ id, amount, date }` entries. Written by `sendAllowance` in farmily-store. Read and drained by `claimAllowance` in child-store (called on mount + window focus).
- `farmily-approvals` — array of `{ id, status: "approved"|"rejected" }`. Written by `approveRequest` / `rejectRequest` in farmily-store. Read and drained by `checkApprovals` in child-store (called on mount + window focus). Matched to goals/savingsPlans by `requestId`.

**Why:** No real backend; localStorage is the only shared state between parent and child flows in the same browser session.

**How to apply:** Any new parent→child or child→parent notification must go through these keys (or add a new similarly-named key). Do NOT try to import or call across the two provider trees.
