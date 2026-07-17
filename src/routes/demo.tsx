import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useFarmily } from "@/lib/farmily-store";
import { useChild, type Avatar } from "@/lib/child-store";
import { ChildAvatar } from "@/components/ChildAvatar";
import { toast } from "sonner";
import { RefreshCw, Send, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Demo — Farmily" }] }),
  component: DemoPage,
});

// The demo child's preset avatar — matches what create page can produce
const DEMO_AVATAR: Avatar = {
  gender: "boy",
  hair: "short",
  hairColor: "#2b1d0e",
  clothes: "#69b072",
  shoes: "#8b5a2b",
  accessory: "hat",
};

const DEMO_CHILD_NAME = "Ahmed";

// ─────────────────────────────────────────
// Demo Reset helper — callable from anywhere
// ─────────────────────────────────────────
export function resetDemo(child: { setState: (p: any) => void }) {
  // Clear cross-store communication channels
  localStorage.removeItem("farmily-mailbox");
  localStorage.removeItem("farmily-approvals");
  // Reset child's financial state so the mailbox is empty again
  child.setState({
    pendingAllowance: null,
    goals: [],
    savingsPlans: [],
    pendingRewardChest: null,
  });
}

// ─────────────────────────────────────────
// Demo Page
// ─────────────────────────────────────────
function DemoPage() {
  const farmily = useFarmily();
  const child = useChild();
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number>(50);
  const [sending, setSending] = useState(false);
  const PRESETS = [10, 25, 50, 100, 200];

  // Make sure parent demo data is seeded
  const ensureParent = async () => {
    if (!farmily.parent) {
      await farmily.loginAsDemo();
    }
  };

  // Make sure child is ready: authed, has avatar, has seen arrival
  const ensureChild = () => {
    if (!child.authed) child.signIn(DEMO_CHILD_NAME);
    if (!child.avatar) child.saveAvatar(DEMO_AVATAR);
    if (!child.seenArrival) child.markArrivalSeen();
    // Give welcome gift if coins are 0
    if (child.coins === 0 && child.tutorialStep === 0) {
      child.giveWelcomeGift();
      child.advanceTutorial(6); // skip tutorial so farm is clean
    }
  };

  const handleSend = async () => {
    setSending(true);
    await ensureParent();
    ensureChild();

    // Send allowance → writes to farmily-mailbox localStorage channel
    const children = farmily.children;
    const demoChild = children.find((c) => c.name === DEMO_CHILD_NAME) ?? children[0];
    if (!demoChild) {
      // Parent data not loaded yet — signIn seeds it, try again next tick
      setTimeout(() => {
        const c2 = farmily.children[0];
        if (c2) farmily.sendAllowance(c2.id, amount);
      }, 50);
    } else {
      farmily.sendAllowance(demoChild.id, amount);
    }

    toast.success(`📬 ${amount} SAR sent! Opening ${DEMO_CHILD_NAME}'s farm…`);

    // Small delay for the toast to be visible before navigation
    setTimeout(() => {
      setSending(false);
      navigate({ to: "/child/farm" });
    }, 900);
  };

  const handleReset = () => {
    resetDemo(child);
    toast("🔄 Demo reset! Ready to replay.", { duration: 2000 });
  };

  const demoChild = farmily.children.find((c) => c.name === DEMO_CHILD_NAME) ?? farmily.children[0];

  return (
    <MobileFrame>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(160deg, #fdf6e3 0%, #f0fdf4 50%, #e8f5e9 100%)" }}
      >
        {/* ── Header ── */}
        <div
          className="px-5 pt-6 pb-4"
          style={{ borderBottom: "1.5px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              <h1 className="font-display text-xl font-bold">Hackathon Demo</h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95"
              style={{ background: "#fff3f3", color: "#c0392b", border: "1.5px solid #ffcdd2" }}
            >
              <RefreshCw className="h-3 w-3" />
              Reset Demo
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulate a parent sending an allowance to their child.
          </p>
        </div>

        <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

          {/* ── Who's involved ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Parent card */}
            <div
              className="rounded-2xl p-4 flex flex-col items-center text-center shadow-card"
              style={{ background: "white", border: "1.5px solid #f0f0f0" }}
            >
              <div className="text-4xl mb-2">👨‍💼</div>
              <div className="font-bold text-sm">Parent</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Demo Parent</div>
              <div
                className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "#e8f5e9", color: "#2e7d32" }}
              >
                Sending
              </div>
            </div>

            {/* Child card */}
            <div
              className="rounded-2xl p-4 flex flex-col items-center text-center shadow-card"
              style={{ background: "white", border: "1.5px solid #f0f0f0" }}
            >
              <div className="mb-1">
                <ChildAvatar a={DEMO_AVATAR} size={48} />
              </div>
              <div className="font-bold text-sm">{DEMO_CHILD_NAME}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Age 9 · Lv {child.authed ? child.level : (demoChild?.level ?? 1)}</div>
              <div
                className="mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "#fff9e6", color: "#e65100" }}
              >
                Receiving
              </div>
            </div>
          </div>

          {/* ── Amount picker ── */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Allowance Amount
            </div>
            <div
              className="rounded-3xl p-5 text-center shadow-card"
              style={{ background: "white", border: "1.5px solid #f0f0f0" }}
            >
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-28 font-display text-5xl font-bold bg-transparent outline-none text-center"
                  style={{ color: "#2e7d32" }}
                />
                <span className="font-display text-xl text-muted-foreground">SAR</span>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {PRESETS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-90"
                    style={
                      amount === v
                        ? { background: "#69b072", color: "white", boxShadow: "0 3px 10px rgba(105,176,114,0.4)" }
                        : { background: "#f5f5f5", color: "#666" }
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── What will happen ── */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              Demo Flow
            </div>
            <div
              className="rounded-2xl overflow-hidden shadow-card"
              style={{ background: "white", border: "1.5px solid #f0f0f0" }}
            >
              {[
                { icon: "💸", step: "Parent sends allowance", sub: `${amount} SAR delivered instantly` },
                { icon: "📬", step: "Mailbox shakes on child's farm", sub: "Red notification bubble appears" },
                { icon: "✉️", step: "Envelope opens with animation", sub: "Shows the allowance amount" },
                { icon: "🎯", step: "Child chooses what to do", sub: "Create a Goal · or Save Part of It" },
                { icon: "🏆", step: "Request sent to parent for approval", sub: "Parent approves → XP reward chest" },
              ].map((item, i, arr) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base shadow-card"
                    style={{ background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", marginTop: 2 }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{item.step}</div>
                    <div className="text-xs text-muted-foreground">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Send button ── */}
          <button
            onClick={handleSend}
            disabled={sending || amount < 1}
            className="w-full rounded-2xl py-4 font-bold text-white transition active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-base"
            style={{
              background: "linear-gradient(135deg, #69b072, #4a9e4a)",
              boxShadow: "0 6px 20px rgba(74,158,74,0.35)",
            }}
          >
            {sending ? (
              <>📬 Sending… opening farm</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send {amount} SAR → Open {DEMO_CHILD_NAME}'s Farm
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* ── Tip ── */}
          <div
            className="rounded-2xl px-4 py-3 text-xs text-muted-foreground flex items-start gap-2"
            style={{ background: "rgba(0,0,0,0.03)", border: "1px dashed #e0e0e0" }}
          >
            <span className="text-base shrink-0">💡</span>
            <span>
              After the child completes their goal or saving, come back to{" "}
              <strong>Parent → Requests</strong> to approve it and trigger the XP Reward Chest.
              Then tap <strong>Reset Demo</strong> to replay from the start.
            </span>
          </div>

          {/* Parent hub shortcut */}
          <div className="flex gap-3">
            <button
              onClick={async () => { await ensureParent(); navigate({ to: "/parent" }); }}
              className="flex-1 rounded-2xl py-3 font-semibold text-sm border border-border text-foreground bg-card transition active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              👨‍💼 Parent Hub
            </button>
            <button
              onClick={() => { ensureChild(); navigate({ to: "/child/farm" }); }}
              className="flex-1 rounded-2xl py-3 font-semibold text-sm border border-border text-foreground bg-card transition active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              🌾 Child Farm
            </button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}
