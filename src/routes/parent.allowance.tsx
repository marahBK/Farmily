import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { toast } from "sonner";
import { Send, ExternalLink, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/parent/allowance")({
  head: () => ({ meta: [{ title: "Send Allowance — Farmily" }] }),
  component: Allowance,
});

function Allowance() {
  const { children, sendAllowance } = useFarmily();
  const navigate = useNavigate();
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [amount, setAmount] = useState<number | "">(25);
  const [note, setNote] = useState("");

  // After sending, we show the success state instead of navigating away.
  const [sent, setSent] = useState<{ childName: string; amount: number } | null>(null);

  const submit = () => {
    if (!childId) return toast.error("Select a child.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    const child = children.find((c) => c.id === childId);
    sendAllowance(childId, amt, note.trim() || undefined);
    setSent({ childName: child?.name ?? "your child", amount: amt });
  };

  // ── Success state ────────────────────────────────────────
  if (sent) {
    return (
      <MobileFrame>
        <TopBar title="Allowance Sent" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-10 text-center">
          {/* Big success icon */}
          <div
            className="grid h-24 w-24 place-items-center rounded-full mb-5 shadow-card"
            style={{ background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)", fontSize: 48 }}
          >
            ✅
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">Money sent!</h2>
          <p className="text-lg font-semibold mb-1" style={{ color: "#2e7d32" }}>
            {sent.amount} SAR was sent to {sent.childName}.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {sent.childName} will see a mailbox notification on their farm.
          </p>

          {/* Primary CTA — open child farm */}
          <button
            onClick={() => navigate({ to: "/child/farm" })}
            className="w-full rounded-2xl py-4 font-bold text-white shadow-soft active:scale-[0.98] transition flex items-center justify-center gap-2 mb-3"
            style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)", boxShadow: "0 6px 20px rgba(74,158,74,0.35)" }}
          >
            <ExternalLink className="h-4 w-4" />
            Open {sent.childName}'s Farm
          </button>

          {/* Secondary — back to hub */}
          <button
            onClick={() => navigate({ to: "/parent" })}
            className="w-full rounded-2xl py-3.5 font-semibold text-sm border border-border text-foreground bg-card active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Parent Hub
          </button>

          {/* Send another */}
          <button
            onClick={() => { setSent(null); setAmount(25); setNote(""); }}
            className="mt-3 text-xs font-semibold text-muted-foreground underline"
          >
            Send another allowance
          </button>
        </div>
      </MobileFrame>
    );
  }

  // ── Send form ────────────────────────────────────────────
  return (
    <MobileFrame>
      <TopBar title="Send Allowance" />
      <div className="px-5 pt-4 pb-10 space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold">Send some love 💚</h2>
          <p className="text-sm text-muted-foreground mt-1">Your child will get a mailbox notification on their farm.</p>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select Child</div>
          <div className="grid grid-cols-2 gap-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setChildId(c.id)}
                className={`flex items-center gap-2 rounded-2xl p-3 border transition ${
                  childId === c.id
                    ? "bg-primary/10 border-primary shadow-soft"
                    : "bg-card border-border"
                }`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-xl shrink-0">{c.avatar}</div>
                <div className="min-w-0 text-left">
                  <div className="font-semibold text-sm truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.balance} SAR balance</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Amount</div>
          <div className="rounded-3xl bg-card border border-border p-6 shadow-card text-center">
            <div className="flex items-baseline justify-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-32 font-display text-5xl font-bold bg-transparent outline-none text-center"
              />
              <span className="font-display text-lg text-muted-foreground">SAR</span>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {[10, 25, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold hover:bg-primary/10"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note (optional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Great job this week!"
            className="mt-1.5 w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none"
          />
        </label>

        <button
          onClick={submit}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 font-semibold shadow-soft"
        >
          <Send className="h-4 w-4" /> Send Allowance
        </button>
      </div>
    </MobileFrame>
  );
}
