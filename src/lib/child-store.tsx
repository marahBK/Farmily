import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClaimMailbox, apiCheckMailbox, apiCheckApprovals } from "@/lib/api/mailbox";
import { apiGetChildBalance } from "@/lib/api/children";
import { apiSubmitRequest } from "@/lib/api/requests";
import { apiLogSpending } from "@/lib/api/spending";
import type { CategoryLimit } from "@/lib/farmily-store";

export type Avatar = {
  gender: "boy" | "girl";
  hair: string;
  hairColor: string;
  clothes: string;
  shoes: string;
  accessory: string;
};

export type Field = {
  id: string;
  owned: boolean;
  crop: null | { type: "corn"; plantedAt: number; ready: boolean };
};

export type ShopItem = {
  id: string;
  name: string;
  icon: string;
  price: number;
  category: "buildings" | "animals" | "crops" | "decorations" | "tools";
  levelRequired: number;
};

export type FinancialGoal = {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  status: "active" | "pending_approval" | "approved" | "rejected";
  requestId?: string;
};

export type SavingsPlan = {
  id: string;
  totalAllowance: number;
  savedAmount: number;
  status: "active" | "pending_approval" | "approved" | "rejected";
  createdAt: string;
  requestId?: string;
};

export type RewardChest = {
  type: "coins" | "xp" | "seeds" | "animal" | "decoration" | "vehicle";
  icon: string;
  label: string;
  amount: number;
};

const GOAL_VEHICLES = [
  { icon: "🚗", name: "Red Car" },
  { icon: "🚜", name: "Tractor" },
  { icon: "🏎️", name: "Race Car" },
  { icon: "🚕", name: "Yellow Taxi" },
  { icon: "🚛", name: "Big Truck" },
];

export type { CategoryLimit };

export type ChildState = {
  authed: boolean;
  childId: string;   // DB id from parent's children table
  parentId: string;  // DB parent id — needed for submitting requests
  name: string;
  categoryLimits: CategoryLimit[];
  level: number;
  xp: number;
  coins: number;
  avatar: Avatar | null;
  fields: Field[];
  inventory: Record<string, number>;
  placed: { id: string; itemId: string; icon: string; x: number; y: number }[];
  tutorialStep: number;
  seenArrival: boolean;
  walletBalance: number; // SAR received from allowances, not yet saved to a goal
  pendingAllowance: number | null;
  mailboxCount: number;
  goals: FinancialGoal[];
  savingsPlans: SavingsPlan[];
  pendingRewardChest: RewardChest | null;
};

const KEY = "farmily-child-v1";

const DEFAULT: ChildState = {
  authed: false,
  childId: "",
  parentId: "",
  name: "Ahmed",
  categoryLimits: [],
  level: 1,
  xp: 0,
  coins: 0,
  avatar: null,
  fields: [
    { id: "f1", owned: false, crop: null },
    { id: "f2", owned: false, crop: null },
    { id: "f3", owned: false, crop: null },
  ],
  inventory: {},
  placed: [],
  tutorialStep: 0,
  seenArrival: false,
  walletBalance: 0,
  pendingAllowance: null,
  mailboxCount: 0,
  goals: [],
  savingsPlans: [],
  pendingRewardChest: null,
};

// Reward pool for harvest chests
const REWARD_POOL: (RewardChest & { weight: number })[] = [
  { type: "coins", icon: "🪙", label: "+80 Coins", amount: 80, weight: 50 },
  { type: "coins", icon: "🪙", label: "+150 Bonus Coins!", amount: 150, weight: 15 },
  { type: "xp", icon: "⭐", label: "+20 XP", amount: 20, weight: 20 },
  { type: "seeds", icon: "🌻", label: "Rare Sunflower Seeds!", amount: 1, weight: 8 },
  { type: "animal", icon: "🐔", label: "Baby Chicken!", amount: 1, weight: 5 },
  { type: "decoration", icon: "🎨", label: "New Decoration!", amount: 1, weight: 2 },
];

function pickRandomReward(): RewardChest {
  const total = REWARD_POOL.reduce((s, r) => s + r.weight, 0);
  let rnd = Math.random() * total;
  for (const r of REWARD_POOL) {
    rnd -= r.weight;
    if (rnd <= 0) return { type: r.type, icon: r.icon, label: r.label, amount: r.amount };
  }
  return { type: "coins", icon: "🪙", label: "+80 Coins", amount: 80 };
}

function xpToLevel(xp: number) {
  return Math.min(10, Math.floor(xp / 100) + 1);
}

type Ctx = ChildState & {
  signIn: (name: string, childId: string, parentId: string, categoryLimits?: CategoryLimit[], dbBalance?: number) => void;
  logSpending: (categoryId: string, categoryName: string, amount: number, note?: string) => Promise<void>;
  signOut: () => void;
  saveAvatar: (a: Avatar) => void;
  giveWelcomeGift: () => void;
  markArrivalSeen: () => void;
  advanceTutorial: (to?: number) => void;
  buy: (item: ShopItem) => boolean;
  plantCorn: (fieldId: string) => boolean;
  harvest: (fieldId: string) => boolean;
  setState: (patch: Partial<ChildState>) => void;
  // Allowance
  claimAllowance: () => Promise<number | null>;
  refreshWalletBalance: () => Promise<void>;
  checkApprovals: () => Promise<void>;
  pollMailbox: () => Promise<void>;
  // Goals
  createGoal: (data: { name: string; icon: string; targetAmount: number; targetDate?: string }, allowanceAmount?: number) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  submitGoalComplete: (goalId: string) => Promise<void>;
  // Savings
  createSavingsPlan: (totalAllowance: number, savedAmount: number) => void;
  submitSavingDone: (planId: string) => Promise<void>;
  // Rewards
  gainXP: (amount: number) => void;
  openRewardChest: (chest: RewardChest) => void;
  closeRewardChest: () => void;
};

const C = createContext<Ctx | null>(null);

export function ChildProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<ChildState>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (s.authed) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s]);

  const setState = (patch: Partial<ChildState>) => set((p) => ({ ...p, ...patch }));

  const ctx: Ctx = {
    ...s,
    setState,

    signIn: (name, childId, parentId, categoryLimits = [], dbBalance = 0) =>
      set((p) => ({
        ...p,
        authed: true,
        name: name || p.name,
        childId,
        parentId,
        categoryLimits,
        // Seed wallet from DB balance so parent-added funds are immediately available.
        // Keep any higher local balance (from recently claimed allowances not yet saved).
        walletBalance: Math.max(p.walletBalance, dbBalance),
      })),

    logSpending: async (categoryId, categoryName, amount, note) => {
      const { childId, parentId, name } = s;
      if (!childId || !parentId) return;
      await apiLogSpending({
        data: {
          id: `sp${Date.now()}`,
          childId, parentId, childName: name,
          categoryId, categoryName, amount, note,
        },
      });
    },

    signOut: () => {
      localStorage.removeItem(KEY);
      set(DEFAULT);
    },
    saveAvatar: (a) => set((p) => ({ ...p, avatar: a })),
    giveWelcomeGift: () =>
      set((p) => (p.coins === 0 && p.tutorialStep === 0 ? { ...p, coins: 1000 } : p)),
    markArrivalSeen: () => set((p) => ({ ...p, seenArrival: true })),
    advanceTutorial: (to) => set((p) => ({ ...p, tutorialStep: to ?? p.tutorialStep + 1 })),

    buy: (item) => {
      let ok = false;
      set((p) => {
        if (p.coins < item.price || p.level < item.levelRequired) return p;
        ok = true;
        const next = { ...p, coins: p.coins - item.price };
        if (item.id === "field") {
          const idx = next.fields.findIndex((f) => !f.owned);
          if (idx === -1) return p;
          next.fields = next.fields.map((f, i) => (i === idx ? { ...f, owned: true } : f));
        } else if (item.category === "crops") {
          next.inventory = { ...next.inventory, [item.id]: (next.inventory[item.id] ?? 0) + 1 };
        } else {
          next.placed = [
            ...next.placed,
            { id: `p${Date.now()}`, itemId: item.id, icon: item.icon, x: 15 + Math.random() * 70, y: 10 + Math.random() * 60 },
          ];
        }
        return next;
      });
      return ok;
    },

    plantCorn: (fieldId) => {
      let ok = false;
      set((p) => {
        const seeds = p.inventory["corn-seeds"] ?? 0;
        if (seeds < 1) return p;
        const field = p.fields.find((f) => f.id === fieldId);
        if (!field?.owned || field.crop) return p;
        ok = true;
        return {
          ...p,
          inventory: { ...p.inventory, "corn-seeds": seeds - 1 },
          fields: p.fields.map((f) =>
            f.id === fieldId ? { ...f, crop: { type: "corn", plantedAt: Date.now(), ready: true } } : f,
          ),
        };
      });
      return ok;
    },

    harvest: (fieldId) => {
      let ok = false;
      set((p) => {
        const field = p.fields.find((f) => f.id === fieldId);
        if (!field?.crop) return p;
        ok = true;
        const reward = pickRandomReward();
        return {
          ...p,
          fields: p.fields.map((f) => (f.id === fieldId ? { ...f, crop: null } : f)),
          pendingRewardChest: p.pendingRewardChest ?? reward,
        };
      });
      return ok;
    },

    // ── Allowance (DB-backed) ──────────────────────────────
    pollMailbox: async () => {
      const childId = s.childId;
      if (!childId) return;
      try {
        const { count } = await apiCheckMailbox({ data: { childId } });
        set((p) => ({ ...p, mailboxCount: count }));
      } catch {}
    },

    refreshWalletBalance: async () => {
      const childId = s.childId;
      if (!childId) return;
      try {
        const { balance } = await apiGetChildBalance({ data: { childId } });
        // Always sync wallet to at least what the DB says the child has
        set((p) => ({ ...p, walletBalance: Math.max(p.walletBalance, balance) }));
      } catch {}
    },

    claimAllowance: async () => {
      const childId = s.childId;
      if (!childId) return null;
      try {
        const { amount } = await apiClaimMailbox({ data: { childId } });
        if (amount != null) {
          set((p) => ({
            ...p,
            walletBalance: p.walletBalance + amount,
            pendingAllowance: (p.pendingAllowance ?? 0) + amount,
            mailboxCount: Math.max(0, p.mailboxCount - 1),
          }));
          return amount;
        }
      } catch {}
      return null;
    },

    checkApprovals: async () => {
      const pending = [
        ...s.goals.filter((g) => g.status === "pending_approval" && g.requestId).map((g) => g.requestId!),
        ...s.savingsPlans.filter((sp) => sp.status === "pending_approval" && sp.requestId).map((sp) => sp.requestId!),
      ];
      if (!pending.length) return;
      try {
        const { approvals } = await apiCheckApprovals({ data: { requestIds: pending } });
        if (!approvals.length) return;
        set((p) => {
          let ns = { ...p, goals: [...p.goals], savingsPlans: [...p.savingsPlans] };
          for (const approval of approvals) {
            const gi = ns.goals.findIndex((g) => g.requestId === approval.requestId && g.status === "pending_approval");
            const si = ns.savingsPlans.findIndex((sp) => sp.requestId === approval.requestId && sp.status === "pending_approval");
            if (gi >= 0) {
              ns.goals = ns.goals.map((g, i) =>
                i === gi ? { ...g, status: approval.status } : g
              );
              if (approval.status === "approved") {
                const newXP = ns.xp + 50;
                const vehicle = GOAL_VEHICLES[Math.floor(Math.random() * GOAL_VEHICLES.length)];
                ns = {
                  ...ns,
                  xp: newXP,
                  level: xpToLevel(newXP),
                  pendingRewardChest: ns.pendingRewardChest ?? {
                    type: "vehicle",
                    icon: vehicle.icon,
                    label: `You earned a ${vehicle.name} for your farm! 🎉`,
                    amount: 1,
                  },
                };
              }
            } else if (si >= 0) {
              ns.savingsPlans = ns.savingsPlans.map((sp, i) =>
                i === si ? { ...sp, status: approval.status } : sp
              );
              if (approval.status === "approved") {
                const newXP = ns.xp + 30;
                ns = { ...ns, xp: newXP, level: xpToLevel(newXP), pendingRewardChest: ns.pendingRewardChest ?? { type: "xp", icon: "⭐", label: "Savings Approved! +30 XP", amount: 30 } };
              }
            }
          }
          return ns;
        });
      } catch {}
    },

    // ── Goals ──────────────────────────────────────────────
    createGoal: (data, allowanceAmount) => {
      const contribution = allowanceAmount ?? 0;
      set((p) => ({
        ...p,
        goals: [
          ...p.goals,
          {
            id: `g${Date.now()}`,
            name: data.name,
            icon: data.icon,
            targetAmount: data.targetAmount,
            currentAmount: contribution,
            targetDate: data.targetDate,
            status: "active" as const,
          },
        ],
        walletBalance: Math.max(0, p.walletBalance - contribution),
        pendingAllowance: allowanceAmount != null ? null : p.pendingAllowance,
      }));
    },

    contributeToGoal: (goalId, amount) => {
      set((p) => ({
        ...p,
        walletBalance: Math.max(0, p.walletBalance - amount),
        goals: p.goals.map((g) =>
          g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
        ),
      }));
    },

    submitGoalComplete: async (goalId) => {
      const goal = s.goals.find((g) => g.id === goalId);
      if (!goal || !s.childId || !s.parentId) return;
      const requestId = `req-g${Date.now()}`;
      try {
        await apiSubmitRequest({
          data: {
            id: requestId,
            childId: s.childId,
            parentId: s.parentId,
            childName: s.name,
            message: `I completed my goal: "${goal.name}"! 🎯`,
            type: "goal",
          },
        });
      } catch {}
      set((p) => ({
        ...p,
        goals: p.goals.map((g) =>
          g.id === goalId ? { ...g, status: "pending_approval", requestId } : g
        ),
      }));
    },

    // ── Savings ────────────────────────────────────────────
    createSavingsPlan: (totalAllowance, savedAmount) => {
      set((p) => ({
        ...p,
        savingsPlans: [
          ...p.savingsPlans,
          { id: `s${Date.now()}`, totalAllowance, savedAmount, status: "active" as const, createdAt: new Date().toISOString() },
        ],
        walletBalance: Math.max(0, p.walletBalance - savedAmount),
        pendingAllowance: null,
      }));
    },

    submitSavingDone: async (planId) => {
      const plan = s.savingsPlans.find((sp) => sp.id === planId);
      if (!plan || !s.childId || !s.parentId) return;
      const requestId = `req-s${Date.now()}`;
      try {
        await apiSubmitRequest({
          data: {
            id: requestId,
            childId: s.childId,
            parentId: s.parentId,
            childName: s.name,
            message: `I saved ${plan.savedAmount} SAR! 💰`,
            type: "savings",
            amount: plan.savedAmount,
          },
        });
      } catch {}
      set((p) => ({
        ...p,
        savingsPlans: p.savingsPlans.map((sp) =>
          sp.id === planId ? { ...sp, status: "pending_approval", requestId } : sp
        ),
      }));
    },

    // ── Rewards ────────────────────────────────────────────
    gainXP: (amount) => {
      set((p) => {
        const newXP = p.xp + amount;
        return { ...p, xp: newXP, level: xpToLevel(newXP) };
      });
    },

    openRewardChest: (chest) => set((p) => ({ ...p, pendingRewardChest: chest })),

    closeRewardChest: () => {
      set((p) => {
        if (!p.pendingRewardChest) return { ...p, pendingRewardChest: null };
        const chest = p.pendingRewardChest;
        let ns = { ...p, pendingRewardChest: null };
        switch (chest.type) {
          case "coins":
            ns.coins = ns.coins + chest.amount;
            break;
          case "xp": {
            const newXP = ns.xp + chest.amount;
            ns = { ...ns, xp: newXP, level: xpToLevel(newXP) };
            break;
          }
          case "seeds":
            ns.inventory = { ...ns.inventory, "sunflower-seeds": (ns.inventory["sunflower-seeds"] ?? 0) + chest.amount };
            break;
          case "animal":
            ns.placed = [...ns.placed, { id: `p${Date.now()}`, itemId: "chicken-reward", icon: "🐔", x: 20 + Math.random() * 60, y: 10 + Math.random() * 50 }];
            break;
          case "decoration":
            ns.placed = [...ns.placed, { id: `p${Date.now()}`, itemId: "flower-reward", icon: "🌸", x: 20 + Math.random() * 60, y: 10 + Math.random() * 50 }];
            break;
          case "vehicle":
            ns.placed = [...ns.placed, { id: `p${Date.now()}`, itemId: `vehicle-reward-${Date.now()}`, icon: chest.icon, x: 10 + Math.random() * 55, y: 10 + Math.random() * 55 }];
            break;
        }
        return ns;
      });
    },
  };

  return <C.Provider value={ctx}>{children}</C.Provider>;
}

export function useChild() {
  const c = useContext(C);
  if (!c) throw new Error("useChild must be inside ChildProvider");
  return c;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "field", name: "New Field", icon: "🟫", price: 200, category: "buildings", levelRequired: 1 },
  { id: "barn", name: "Barn", icon: "🏚️", price: 800, category: "buildings", levelRequired: 2 },
  { id: "silo", name: "Silo", icon: "🏗️", price: 1200, category: "buildings", levelRequired: 3 },
  { id: "chicken", name: "Chicken", icon: "🐔", price: 300, category: "animals", levelRequired: 1 },
  { id: "cow", name: "Cow", icon: "🐄", price: 900, category: "animals", levelRequired: 2 },
  { id: "sheep", name: "Sheep", icon: "🐑", price: 700, category: "animals", levelRequired: 2 },
  { id: "corn-seeds", name: "Corn Seeds", icon: "🌽", price: 50, category: "crops", levelRequired: 1 },
  { id: "wheat-seeds", name: "Wheat Seeds", icon: "🌾", price: 80, category: "crops", levelRequired: 1 },
  { id: "carrot-seeds", name: "Carrot Seeds", icon: "🥕", price: 120, category: "crops", levelRequired: 2 },
  { id: "flower", name: "Flowers", icon: "🌸", price: 80, category: "decorations", levelRequired: 1 },
  { id: "tree", name: "Apple Tree", icon: "🌳", price: 250, category: "decorations", levelRequired: 1 },
  { id: "fountain", name: "Fountain", icon: "⛲", price: 1500, category: "decorations", levelRequired: 4 },
  { id: "watering-can", name: "Watering Can", icon: "🪣", price: 100, category: "tools", levelRequired: 1 },
  { id: "tractor", name: "Tractor", icon: "🚜", price: 2000, category: "tools", levelRequired: 3 },
];
