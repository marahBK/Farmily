import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { hashText, generatePIN, pickAvatar } from "@/lib/auth";
import { apiSignUp, apiSignIn, apiGetParentData, apiLoginAsDemo } from "@/lib/api/auth";
import { apiAddChild, apiRemoveChild, apiUpdateChildBalance, apiGetAllChildren } from "@/lib/api/children";
import { apiSendAllowance } from "@/lib/api/allowances";
import { apiApproveRequest, apiRejectRequest, apiMarkAllRead } from "@/lib/api/requests";

// ── Data model ──────────────────────────────────────────────────────────────

export type Parent = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
};

export type CategoryLimit = {
  id: string;
  name: string;
  amount: number;
};

export type Child = {
  id: string;
  parentId: string;
  name: string;
  age?: number;
  username?: string;
  pinHash: string;
  avatar: string;
  balance: number;
  monthlyAllowance: number;
  categoryLimits: CategoryLimit[];
};

export type Request = {
  id: string;
  childId: string;
  childName: string;
  message: string;
  amount?: number;
  type: "goal" | "savings";
  createdAt: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  requestId?: string;
};

export type AllowanceEntry = {
  id: string;
  childId: string;
  childName: string;
  amount: number;
  note?: string;
  date: string;
};

type State = {
  parent: Parent | null;
  children: Child[];
  requests: Request[];
  notifications: Notification[];
  allowances: AllowanceEntry[];
  loading: boolean;
};

type Ctx = State & {
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  loginAsDemo: () => Promise<void>;
  addChild: (
    name: string,
    pin: string,
    opts?: { age?: number; username?: string; monthlyAllowance?: number; categoryLimits?: CategoryLimit[] }
  ) => Promise<string>;
  removeChild: (childId: string) => Promise<void>;
  updateChildBalance: (childId: string, delta: number) => Promise<void>;
  sendAllowance: (childId: string, amount: number, note?: string) => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

// ── Local session (parentId only — real data lives in DB) ─────────────────
const SESSION_KEY = "farmily-session";

function loadSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
function saveSession(id: string) {
  try { localStorage.setItem(SESSION_KEY, id); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

const empty: State = {
  parent: null, children: [], requests: [],
  notifications: [], allowances: [], loading: true,
};

const FarmilyCtx = createContext<Ctx | null>(null);

export function FarmilyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);

  // On mount: if we have a saved parentId, reload data from DB
  useEffect(() => {
    const parentId = loadSession();
    if (!parentId) { setState({ ...empty, loading: false }); return; }
    apiGetParentData({ data: { parentId } })
      .then((data) => {
        if (!data) { clearSession(); setState({ ...empty, loading: false }); return; }
        setState({ ...data, loading: false });
      })
      .catch(() => setState({ ...empty, loading: false }));
  }, []);

  const refresh = async (parentId: string) => {
    const data = await apiGetParentData({ data: { parentId } });
    if (!data) { clearSession(); setState({ ...empty, loading: false }); return; }
    setState({ ...data, loading: false });
  };

  const ctx: Ctx = {
    ...state,

    signUp: async (fullName, email, password) => {
      const passwordHash = await hashText(password);
      const id = `p${Date.now()}`;
      await apiSignUp({ data: { id, fullName: fullName.trim(), email: email.trim().toLowerCase(), passwordHash } });
      saveSession(id);
      await refresh(id);
    },

    signIn: async (email, password) => {
      const passwordHash = await hashText(password);
      const result = await apiSignIn({ data: { email: email.trim().toLowerCase(), passwordHash } });
      if (!result.ok || !result.parent) return false;
      saveSession(result.parent.id);
      await refresh(result.parent.id);
      return true;
    },

    signOut: () => {
      clearSession();
      setState({ ...empty, loading: false });
    },

    loginAsDemo: async () => {
      const passwordHash = await hashText("demo1234");
      const pin1Hash = await hashText("1234");
      const pin2Hash = await hashText("5678");
      const parentId = "demo-parent";
      await apiLoginAsDemo({
        data: {
          parent: { id: parentId, fullName: "Demo Parent", email: "demo@farmily.app", passwordHash },
          children: [
            { id: "c1", parentId, name: "Ahmed", pinHash: pin1Hash, avatar: "🦊", balance: 145 },
            { id: "c2", parentId, name: "Sara", pinHash: pin2Hash, avatar: "🐰", balance: 82 },
          ],
          requests: [{ id: "r1", childId: "c1", childName: "Ahmed", message: "I completed my savings goal.", type: "goal" }],
          notifications: [{ id: "n1", title: "New request from Ahmed", body: "Ahmed says he completed his savings goal." }],
          allowances: [
            { id: "a1", childId: "c1", childName: "Ahmed", amount: 50, note: "Weekly", date: new Date(Date.now() - 6 * 86400000).toISOString() },
            { id: "a2", childId: "c2", childName: "Sara", amount: 40, note: "Weekly", date: new Date(Date.now() - 6 * 86400000).toISOString() },
          ],
        },
      });
      saveSession(parentId);
      await refresh(parentId);
    },

    addChild: async (name, pin, opts = {}) => {
      const parentId = state.parent?.id;
      if (!parentId) throw new Error("NOT_AUTHENTICATED");
      const finalPin = pin || generatePIN();
      const pinHash = await hashText(finalPin);
      const childId = `c${Date.now()}`;
      await apiAddChild({
        data: {
          id: childId, parentId, name: name.trim(), pinHash,
          avatar: pickAvatar(state.children.length),
          age: opts.age, username: opts.username,
          monthlyAllowance: opts.monthlyAllowance ?? 0,
          categoryLimits: opts.categoryLimits ?? [],
        },
      });
      await refresh(parentId);
      return finalPin;
    },

    removeChild: async (childId) => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      await apiRemoveChild({ data: { childId, parentId } });
      setState((s) => ({ ...s, children: s.children.filter((c) => c.id !== childId) }));
    },

    updateChildBalance: async (childId, delta) => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      await apiUpdateChildBalance({ data: { childId, parentId, delta } });
      setState((s) => ({
        ...s,
        children: s.children.map((c) =>
          c.id === childId ? { ...c, balance: Math.max(0, c.balance + delta) } : c
        ),
      }));
    },

    sendAllowance: async (childId, amount, note) => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      const child = state.children.find((c) => c.id === childId);
      if (!child) return;
      const id = `a${Date.now()}`;
      const date = new Date().toISOString();
      await apiSendAllowance({ data: { id, childId, parentId, childName: child.name, amount, note, date } });
      await refresh(parentId);
    },

    approveRequest: async (id) => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      await apiApproveRequest({ data: { requestId: id, parentId } });
      setState((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) }));
      await refresh(parentId);
    },

    rejectRequest: async (id) => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      await apiRejectRequest({ data: { requestId: id, parentId } });
      setState((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) }));
    },

    markAllRead: async () => {
      const parentId = state.parent?.id;
      if (!parentId) return;
      await apiMarkAllRead({ data: { parentId } });
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      }));
    },
  };

  return <FarmilyCtx.Provider value={ctx}>{children}</FarmilyCtx.Provider>;
}

export function useFarmily() {
  const c = useContext(FarmilyCtx);
  if (!c) throw new Error("useFarmily must be used within FarmilyProvider");
  return c;
}

// Used by the child login screen — fetches all children from DB
export async function getStoredChildren(): Promise<Child[]> {
  try {
    const result = await apiGetAllChildren();
    return result.children ?? [];
  } catch {
    return [];
  }
}
