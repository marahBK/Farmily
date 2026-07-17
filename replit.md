# Farmily

A gamified family financial education app. Parents supervise; kids build a virtual farm while learning about money.

## Stack
- **Framework**: TanStack Start (React + SSR) with TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4 with custom CSS variables (farm colour palette)
- **State**: React Context + localStorage (farmily-store for parents, child-store for kids)
- **UI components**: shadcn/ui (Radix primitives)
- **Build tool**: Vite 8 + Bun

## Running the app
```bash
bun run dev
```
App runs on port 5173 in development.

## Project structure
```
src/
  routes/          # File-based TanStack Router pages
    index.tsx            # Landing page (I'm a Parent / I'm a Child)
    parent.*.tsx         # Parent flow (login, signup, dashboard, allowances, requests, notifications)
    child.tsx            # Child layout (wraps ChildProvider)
    child.index.tsx      # Child login
    child.create.tsx     # Character creation (step wizard)
    child.arrival.tsx    # Onboarding animation (truck + child walking)
    child.farm.tsx       # Main farm game (4-tab app)
  components/      # Shared components (MobileFrame, TopBar, ChildAvatar, shadcn/ui)
  lib/
    farmily-store.tsx    # Parent state (auth, children, allowances, requests, notifications)
    child-store.tsx      # Child state (avatar, fields, coins, inventory, tutorial progress)
    utils.ts             # cn() helper
  styles.css       # Tailwind + farm colour palette (primary green, sky blue, sand, sun)
```

## Child flow
1. `/child` → Login with Child ID + Password
2. `/child/create` → Step-by-step character creation (gender → hair → outfit → accessories)
3. `/child/arrival` → Onboarding animation (truck arrives, child walks onto farm)
4. `/child/farm` → Main game (Farm | Goals | Shop | Character tabs)
   - Tutorial: Farmer Benny guides through buying a field → seeds → planting → harvesting
   - Shop: Buildings, Animals, Crops, Decorations, Tools (level-locked items)

## Parent flow
1. `/parent/login` or `/parent/signup` → Auth
2. `/parent` → Dashboard (family balance, child overview)
3. `/parent/allowance`, `/parent/requests`, `/parent/notifications`, `/parent/child/:id`

## User preferences
- Keep the parent flow exactly as-is — do not redesign or restructure it.
- Use the farm colour palette from styles.css (greens, sky, sand, sun, berry).
- Mobile-first layout using MobileFrame wrapper (max-w-md centred on desktop).
- Fonts: Fraunces (display/headings) + Nunito (body).
- Do not add backend/database; state is persisted in localStorage.
