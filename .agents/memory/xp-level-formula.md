---
name: XP / Level formula
description: How XP and level are calculated in the child store.
---

## Formula
`level = Math.min(10, Math.floor(xp / 100) + 1)`

So: 0–99 XP = Lv 1, 100–199 = Lv 2, … 900+ = Lv 10.

## XP sources (financial, not farming)
- Goal approved by parent: +50 XP
- Saving plan approved by parent: +30 XP

## NOT XP sources
- Harvesting, buying items, planting — these give coins or chest rewards, not XP directly (chest can roll an XP reward).

**Why:** XP is tied to financial education milestones so that level-locked shop items are gated behind real learning behavior, not just repeated harvesting.
