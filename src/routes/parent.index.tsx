import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useFarmily, type Child, type CategoryLimit } from "@/lib/farmily-store";
import { toast } from "sonner";
import {
  Bell, Send, LineChart, LogOut, Sprout, Users, Wallet,
  ChevronRight, CircleAlert, Plus, X, Loader2, Copy, Check, Trash2, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/parent/")({
  head: () => ({ meta: [{ title: "Family Dashboard — Farmily" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { parent, children, requests, allowances, notifications, signOut, addChild, removeChild, updateChildBalance, approveRequest, rejectRequest } = useFarmily();
  const navigate = useNavigate();
  const [showAddChild, setShowAddChild] = useState(false);
  const [generatedPIN, setGeneratedPIN] = useState<{ name: string; pin: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!parent) navigate({ to: "/parent/login" });
  }, [parent, navigate]);

  if (!parent) return null;

  const unread = notifications.filter((n) => !n.read).length;
  const weekAgo = Date.now() - 7 * 86400000;
  const weeklySent = allowances
    .filter((a) => new Date(a.date).getTime() >= weekAgo)
    .reduce((s, a) => s + a.amount, 0);

  const handleAddChild = async (
    name: string,
    pin: string,
    opts: { age?: number; username?: string; monthlyAllowance?: number; categoryLimits?: CategoryLimit[] }
  ) => {
    try {
      const finalPin = await addChild(name, pin, opts);
      setGeneratedPIN({ name: name.trim(), pin: finalPin });
      setShowAddChild(false);
      toast.success(`${name.trim()} added!`);
    } catch {
      toast.error("Something went wrong. Try again.");
    }
  };

  const copyPIN = async (pin: string) => {
    await navigator.clipboard.writeText(pin).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileFrame>
      <div className="pb-24">
        {/* Header */}
        <div className="farm-gradient pt-8 pb-6 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shrink-0">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">Farmily</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/parent/notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full bg-background shadow-card"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-berry border-2 border-background" />
                )}
              </Link>
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="grid h-10 w-10 place-items-center rounded-full bg-background shadow-card"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold mt-0.5">{parent.fullName.split(" ")[0]} 👋</h1>
          </div>
        </div>

        {/* Summary */}
        <div className="px-5 -mt-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Users className="h-4 w-4" />} tone="primary" label="Children" value={children.length} />
            <StatCard icon={<CircleAlert className="h-4 w-4" />} tone="berry" label="Pending Requests" value={requests.length} />
            <StatCard icon={<Wallet className="h-4 w-4" />} tone="sky" label="Sent This Week" value={`${weeklySent} SAR`} small />
            <StatCard icon={<Bell className="h-4 w-4" />} tone="sun" label="Unread Alerts" value={unread} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 mt-6">
          <div className="grid grid-cols-3 gap-3">
            <QuickAction to="/parent/allowance" label="Send Allowance" icon={<Send className="h-5 w-5" />} tone="primary" />
            <QuickAction to="/parent/reports" label="View Reports" icon={<LineChart className="h-5 w-5" />} tone="sky" />
            <QuickAction to="/parent/notifications" label="Alerts" icon={<Bell className="h-5 w-5" />} tone="sun" badge={unread} />
          </div>
        </div>

        {/* Pending requests */}
        {requests.length > 0 && (
          <div className="px-5 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold">Pending Requests</h2>
              {requests.length > 2 && (
                <Link to="/parent/requests" className="text-sm text-primary font-medium flex items-center gap-0.5">
                  See all ({requests.length}) <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {requests.slice(0, 3).map((r) => {
                const isSavings = r.type === "savings";
                const childAvatar = children.find((c) => c.id === r.childId)?.avatar ?? "🧒";
                return (
                  <div key={r.id} className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl shrink-0 text-xl"
                          style={{ background: isSavings ? "linear-gradient(135deg,#fffde7,#ffd54f)" : "linear-gradient(135deg,#e8f5e9,#a5d6a7)" }}>
                          {isSavings ? "🐷" : "🎯"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm">
                            {childAvatar} {r.childName} — {isSavings ? "Savings" : "Goal completed"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-secondary px-3.5 py-2.5 text-sm italic text-muted-foreground mb-2">
                        "{r.message}"
                      </div>
                      {r.amount != null && (
                        <div className="text-xs font-semibold text-primary">
                          💰 {r.amount} SAR saved
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 border-t border-border">
                      <button
                        onClick={() => { rejectRequest(r.id); toast("Request declined."); }}
                        className="flex items-center justify-center gap-1.5 py-3.5 font-semibold text-sm text-red-500 hover:bg-red-50 active:scale-[0.98] transition"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                      <button
                        onClick={() => {
                          approveRequest(r.id);
                          toast.success(isSavings ? "💰 Saving confirmed!" : "🎯 Goal approved!");
                        }}
                        className="flex items-center justify-center gap-1.5 py-3.5 font-semibold text-sm text-primary hover:bg-primary/5 border-l border-border active:scale-[0.98] transition"
                      >
                        <CheckCircle2 className="h-4 w-4" /> {isSavings ? "Confirm" : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Children list ── */}
        <div className="px-5 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">My Children</h2>
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-bold shadow-soft"
            >
              <Plus className="h-3.5 w-3.5" /> Add Child
            </button>
          </div>

          {children.length === 0 ? (
            <div
              className="rounded-2xl border-2 border-dashed border-primary/30 p-8 text-center cursor-pointer hover:bg-primary/5 transition"
              onClick={() => setShowAddChild(true)}
            >
              <div className="text-3xl mb-2">👶</div>
              <div className="text-sm font-semibold">No children yet</div>
              <div className="text-xs text-muted-foreground mt-1">Tap to add your first child</div>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((c) => (
                <ChildCard
                  key={c.id}
                  child={c}
                  allowances={allowances.filter((a) => a.childId === c.id)}
                  onRemove={() => removeChild(c.id)}
                  onAdjustBalance={(delta) => updateChildBalance(c.id, delta)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 px-8">
          Parents supervise; only children can build and decorate their own farms.
        </p>
      </div>

      {/* ── Add Child multi-step flow ── */}
      {showAddChild && (
        <AddChildFlow
          onAdd={handleAddChild}
          onClose={() => setShowAddChild(false)}
        />
      )}

      {/* ── PIN reveal modal ── */}
      {generatedPIN && (
        <PINRevealModal
          name={generatedPIN.name}
          pin={generatedPIN.pin}
          copied={copied}
          onCopy={() => copyPIN(generatedPIN.pin)}
          onClose={() => setGeneratedPIN(null)}
        />
      )}
    </MobileFrame>
  );
}

// ── Child card ───────────────────────────────────────────────────────────────

function ChildCard({
  child, allowances, onRemove, onAdjustBalance,
}: {
  child: Child;
  allowances: import("@/lib/farmily-store").AllowanceEntry[];
  onRemove: () => void;
  onAdjustBalance: (delta: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const lastSent = allowances[0];

  return (
    <div className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
      <div className="flex gap-3 p-4">
        {/* Avatar */}
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-3xl shrink-0">
          {child.avatar}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold truncate">{child.name}</div>
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="text-muted-foreground hover:text-foreground text-xs font-bold px-2 py-0.5 rounded-full bg-secondary"
            >
              ···
            </button>
          </div>
          <div className="text-2xl font-display font-bold mt-1">{child.balance} <span className="text-sm font-semibold text-muted-foreground">SAR</span></div>
          {lastSent && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Last: {lastSent.amount} SAR · {new Date(lastSent.date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="border-t border-border bg-secondary/40 flex divide-x divide-border">
          <Link
            to="/parent/allowance"
            className="flex-1 py-2.5 text-center text-xs font-semibold text-primary hover:bg-primary/5"
          >
            💸 Send Allowance
          </Link>
          <button
            onClick={() => { onAdjustBalance(-10); setShowMenu(false); toast("−10 SAR adjusted."); }}
            className="flex-1 py-2.5 text-center text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            −10 SAR
          </button>
          <button
            onClick={() => { if (confirm(`Remove ${child.name}?`)) onRemove(); setShowMenu(false); }}
            className="flex-1 py-2.5 text-center text-xs font-semibold text-berry hover:bg-berry/10"
          >
            🗑 Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ── Add Child multi-step flow ─────────────────────────────────────────────────

const DEFAULT_CATEGORIES: CategoryLimit[] = [
  { id: "savings", name: "Mandatory savings", amount: 0 },
  { id: "shopping", name: "General shopping", amount: 0 },
  { id: "snacks", name: "Snacks & meals", amount: 0 },
];

function AddChildFlow({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, pin: string, opts: { age?: number; username?: string; monthlyAllowance?: number; categoryLimits?: CategoryLimit[] }) => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  // Step 2 fields
  const [monthlyAllowance, setMonthlyAllowance] = useState("");

  // Step 3 fields
  const [categories, setCategories] = useState<CategoryLimit[]>(DEFAULT_CATEGORIES);
  const [newCatName, setNewCatName] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  const catTotal = categories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const monthly = Number(monthlyAllowance) || 0;

  const canStep1 = name.trim().length > 0;
  const pinValid = pin === "" || (pin.length === 4 && /^\d{4}$/.test(pin));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStep1) return;
    if (!pinValid) { return; }
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd(name, pin, {
      age: age ? Number(age) : undefined,
      username: username.trim() || undefined,
      monthlyAllowance: monthly,
      categoryLimits: categories.filter((c) => Number(c.amount) > 0),
    });
    setLoading(false);
  };

  const updateCatAmount = (id: string, val: string) => {
    setCategories((cats) => cats.map((c) => c.id === id ? { ...c, amount: Number(val) || 0 } : c));
  };

  const addCustomCategory = () => {
    if (!newCatName.trim()) return;
    setCategories((cats) => [...cats, { id: `custom-${Date.now()}`, name: newCatName.trim(), amount: 0 }]);
    setNewCatName("");
    setShowAddCat(false);
  };

  const removeCategory = (id: string) => {
    setCategories((cats) => cats.filter((c) => c.id !== id));
  };

  const stepLabel = ["Child info", "Monthly allowance", "Category limits"][step - 1];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl"
        style={{ background: "white", maxHeight: "92dvh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">Add a Child</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{stepLabel} · Step {step} of 3</p>
            </div>
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-all"
                style={{ background: s <= step ? "var(--color-primary)" : "#e5e7eb" }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pb-10 pt-5">
          {/* ── Step 1: Child info ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Child's name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Age</label>
                <input
                  type="number"
                  min={1} max={18}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Login username <span className="normal-case font-normal">(optional)</span></label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={name && age ? `${name.toLowerCase().replace(/\s+/g, "")}${age}` : "e.g. alex10"}
                  className="w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Login PIN <span className="normal-case font-normal">(4 digits — leave blank to auto-generate)</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4 digits"
                  className={`w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-base tracking-widest font-mono ${pin && !pinValid ? "ring-2 ring-red-400" : ""}`}
                />
                {pin && !pinValid && <p className="text-xs text-red-500 mt-1">PIN must be exactly 4 digits</p>}
              </div>
              <button
                type="submit"
                disabled={!canStep1 || !pinValid}
                className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                Next →
              </button>
            </form>
          )}

          {/* ── Step 2: Monthly allowance ── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="font-semibold text-base mb-1">Monthly allowance</h4>
                <p className="text-sm text-muted-foreground mb-4">The base that gets split into your category limits.</p>
                <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5">
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    value={monthlyAllowance}
                    onChange={(e) => setMonthlyAllowance(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent outline-none text-2xl font-display font-bold"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">SAR</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl border border-border py-3.5 font-semibold text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-[2] rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold"
                >
                  Next →
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Category limits ── */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-base">Category limits</h4>
                  {monthly > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total:</div>
                      <div className={`text-sm font-bold ${catTotal > monthly ? "text-red-500" : "text-foreground"}`}>
                        {catTotal} SAR
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">Going over any limit affects the farm (crops wilt, coins lost).</p>

                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
                      <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          value={cat.amount || ""}
                          onChange={(e) => updateCatAmount(cat.id, e.target.value)}
                          placeholder="0"
                          className="w-16 bg-white rounded-xl px-2.5 py-1.5 text-sm text-right outline-none font-semibold border border-border"
                        />
                        <span className="text-xs text-muted-foreground">SAR</span>
                        {!["savings", "shopping", "snacks"].includes(cat.id) && (
                          <button type="button" onClick={() => removeCategory(cat.id)} className="text-muted-foreground hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add custom category */}
                  {showAddCat ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 rounded-2xl bg-secondary px-3 py-2.5 text-sm outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                      />
                      <button type="button" onClick={addCustomCategory} className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold">Add</button>
                      <button type="button" onClick={() => setShowAddCat(false)} className="rounded-2xl bg-secondary px-3 py-2.5 text-sm">✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCat(true)}
                      className="w-full rounded-2xl border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary/70 hover:border-primary/60 hover:text-primary transition"
                    >
                      + Add custom category
                    </button>
                  )}
                </div>

                {monthly > 0 && catTotal > monthly && (
                  <p className="text-xs text-red-500 mt-3 font-medium">⚠️ Category total ({catTotal} SAR) exceeds monthly allowance ({monthly} SAR)</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-2xl border border-border py-3.5 font-semibold text-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</> : "Add Child ✓"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PIN Reveal modal ─────────────────────────────────────────────────────────

function PINRevealModal({
  name, pin, copied, onCopy, onClose,
}: {
  name: string; pin: string; copied: boolean; onCopy: () => void; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center shadow-card"
        style={{ background: "white", animation: "dialogPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="text-5xl mb-3">🔑</div>
        <h3 className="font-display text-xl font-bold mb-1">{name}'s PIN</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Share this 4-digit PIN with {name}. It won't be shown again.
        </p>

        {/* PIN display */}
        <div className="flex justify-center gap-3 mb-5">
          {pin.split("").map((d, i) => (
            <div
              key={i}
              className="grid h-16 w-14 place-items-center rounded-2xl text-3xl font-display font-bold shadow-card"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", border: "2px solid #c8e6c9" }}
            >
              {d}
            </div>
          ))}
        </div>

        <button
          onClick={onCopy}
          className="w-full rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 mb-3"
          style={{ background: "#f0fdf4", border: "1.5px solid #c8e6c9", color: "#2e7d32" }}
        >
          {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy PIN</>}
        </button>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold"
        >
          Done — I've shared the PIN
        </button>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, tone, small }: {
  icon: React.ReactNode; label: string; value: number | string; tone: "primary" | "sky" | "sun" | "berry"; small?: boolean;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky/30 text-sky-foreground",
    sun: "bg-sun/30 text-sun-foreground",
    berry: "bg-berry/15 text-berry",
  };
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
      <div className={`inline-grid h-8 w-8 place-items-center rounded-xl ${tones[tone]}`}>{icon}</div>
      <div className={`mt-2 font-display font-bold ${small ? "text-lg" : "text-2xl"}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function QuickAction({ to, label, icon, tone, badge }: {
  to: string; label: string; icon: React.ReactNode; tone: "primary" | "sky" | "sun"; badge?: number;
}) {
  const tones = { primary: "bg-primary text-primary-foreground", sky: "bg-sky text-sky-foreground", sun: "bg-sun text-sun-foreground" };
  return (
    <Link
      to={to as never}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl p-3 shadow-card bg-card border border-border hover:bg-secondary/50 transition"
    >
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone]} shadow-soft`}>{icon}</div>
      <div className="text-[11px] font-semibold text-center leading-tight">{label}</div>
      {badge ? (
        <span className="absolute top-2 right-2 min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-berry text-berry-foreground text-[10px] font-bold">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
