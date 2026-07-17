---
name: Auth model
description: How parent and child auth works — data shapes, storage keys, hashing approach
---

## Parent data model
```
Parent { id, fullName, email, passwordHash }
Child  { id, parentId, name, pinHash, avatar, balance }
```
Stored together in `farmily-state-v2` (localStorage). Old key `farmily-state-v1` is obsolete.

## Hashing
SHA-256 via `crypto.subtle.digest` (browser-native, async). Utility in `src/lib/auth.ts`:
- `hashText(text): Promise<string>` — used for both passwords and PINs
- `generatePIN(): string` — random 4-digit string e.g. "3871"
- `pickAvatar(index): string` — emoji avatar from AVATARS array

## Auth API (farmily-store.tsx)
- `signUp(fullName, email, password): Promise<void>` — hashes password, stores
- `signIn(email, password): Promise<boolean>` — verifies hash, returns true on success
- `addChild(name): Promise<string>` — generates PIN, hashes, stores, RETURNS plain PIN (shown once to parent)
- `loginAsDemo(): Promise<void>` — seeds demo state with known credentials (demo@farmily.app / demo1234, Ahmed PIN 1234, Sara PIN 5678)
- `removeChild(childId)`, `updateChildBalance(childId, delta)` — parent-only actions

## Child login flow
1. `getStoredChildren()` (exported from farmily-store) reads `farmily-state-v2` directly — no parent session needed
2. Child picks profile → enters PIN on numpad
3. `hashText(pin) === child.pinHash` → `child.signIn(name)` from child-store → navigate to `/child/farm`

## Why: security
Passwords/PINs must never be plain-text even in localStorage (spec requirement).
async signIn/signUp means event handlers calling them must be async too — see demo.tsx `ensureParent`.
