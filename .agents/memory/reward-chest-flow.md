---
name: Reward chest flow
description: How harvest and approval rewards are delivered to the child via the RewardChestOverlay rather than direct state mutation.
---

## The rule
Never give coins/XP directly in a user-visible action. Instead, set `pendingRewardChest: RewardChest` on the child state. A `useEffect` in FarmHome watches `pendingRewardChest` and opens the `RewardChestOverlay`. When the child taps "Collect", `closeRewardChest()` applies the reward (coins / XP / seeds / animal / decoration) and clears `pendingRewardChest`.

**Why:** Creates a fun animated chest-opening moment instead of a boring number increment.

**How to apply:** `harvest` → sets `pendingRewardChest` (random from REWARD_POOL). Goal/saving approval via `checkApprovals` → sets `pendingRewardChest` with XP reward. Any future reward should follow the same pattern.
