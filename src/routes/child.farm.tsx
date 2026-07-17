import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useChild, SHOP_ITEMS, type ShopItem, type Field, type RewardChest } from "@/lib/child-store";
import { ChildAvatar } from "@/components/ChildAvatar";
import { Home, Target, ShoppingBag, UserCircle2, Star, Lock, LogOut, Wallet, RefreshCw, Receipt, Loader2, X, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/child/farm")({
  head: () => ({ meta: [{ title: "My Farm — Farmily" }] }),
  component: FarmHome,
});

type Tab = "farm" | "goals" | "savings" | "shop" | "character";

// ─────────────────────────────────────────
// Farm Home (root layout)
// ─────────────────────────────────────────
function FarmHome() {
  const child = useChild();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("farm");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorialDone, setShowTutorialDone] = useState(false);

  type Overlay = null | "envelope" | "decision" | "goal-templates" | "goal-form" | "saving-amount" | "reward-chest" | "log-spend";
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [goalTemplate, setGoalTemplate] = useState<{ name: string; icon: string; targetAmount: number } | null>(null);
  const [chestOpen, setChestOpen] = useState(false);

  // openedAmount: captured when the mailbox is tapped, used throughout the overlay flow.
  // pendingAllowance in the store is cleared immediately on tap so the mailbox stops
  // shaking and the notification is not shown again on subsequent visits.
  const [openedAmount, setOpenedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!child.authed) { navigate({ to: "/child" }); return; }
    if (!child.avatar) { navigate({ to: "/child/create" }); return; }
    if (!child.seenArrival) { navigate({ to: "/child/arrival" }); return; }
    if (child.tutorialStep === 0 && child.coins === 0) {
      child.giveWelcomeGift();
      setShowWelcome(true);
    }
    child.pollMailbox();
    child.checkApprovals();
    child.refreshWalletBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll mailbox every 8 s (DB-backed — no need to hammer it).
  useEffect(() => {
    const id = setInterval(() => {
      child.pollMailbox();
      child.checkApprovals();
      child.refreshWalletBalance();
    }, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = () => { child.pollMailbox(); child.checkApprovals(); child.refreshWalletBalance(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (child.tutorialStep === 5) setShowTutorialDone(true);
  }, [child.tutorialStep]);

  useEffect(() => {
    if (child.pendingRewardChest && overlay !== "reward-chest") {
      setChestOpen(false);
      setOverlay("reward-chest");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child.pendingRewardChest]);

  const onMailboxTap = async () => {
    if (child.pendingAllowance) {
      // Already claimed locally — just show the overlay
      const amt = child.pendingAllowance;
      child.setState({ pendingAllowance: null });
      setOpenedAmount(amt);
      setOverlay("envelope");
    } else if (child.mailboxCount > 0) {
      // Claim from DB — get the amount back directly
      const amt = await child.claimAllowance();
      if (amt != null) {
        setOpenedAmount(amt);
        setOverlay("envelope");
      }
    } else {
      toast("No mail yet! Your parent can send you an allowance. 📬");
    }
  };

  if (!child.avatar) return null;

  return (
    <MobileFrame>
      <div className="min-h-screen flex flex-col bg-background">

        {/* ── Premium Top Bar ── */}
        <div
          className="sticky top-0 z-20"
          style={{
            background: "linear-gradient(180deg, rgba(255,248,220,0.97) 0%, rgba(255,255,255,0.95) 100%)",
            backdropFilter: "blur(16px)",
            borderBottom: "1.5px solid rgba(255,215,0,0.25)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Level pill */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
              style={{
                background: "linear-gradient(135deg, #fffbe6 0%, #ffd700 100%)",
                border: "1.5px solid rgba(200,150,0,0.35)",
                boxShadow: "0 3px 12px rgba(255,190,0,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-600" style={{ filter: "drop-shadow(0 1px 2px rgba(180,100,0,0.4))" }} />
              <span className="font-bold text-sm text-amber-800">Lv {child.level}</span>
            </div>

            <div className="font-display text-sm font-bold truncate max-w-[120px]" style={{ color: "#6b4c1a" }}>
              {child.name}'s Farm 🌾
            </div>

            {/* Coins pill */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2"
              style={{
                background: "linear-gradient(135deg, #fffbe6 0%, #ffd700 100%)",
                border: "1.5px solid rgba(200,150,0,0.35)",
                boxShadow: "0 3px 12px rgba(255,190,0,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              <span className="text-base leading-none" style={{ animation: "coinBounce 2.5s ease-in-out infinite", display: "inline-block" }}>🪙</span>
              <span className="font-bold text-sm tabular-nums text-amber-800">{child.coins.toLocaleString()}</span>
            </div>

            {/* Log Spend button */}
            {child.categoryLimits.length > 0 && (
              <button
                onClick={() => setOverlay("log-spend")}
                className="flex items-center gap-1 rounded-full px-2.5 py-2"
                style={{
                  background: "rgba(255,255,255,0.88)",
                  border: "1.5px solid rgba(100,180,100,0.35)",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.10)",
                }}
                title="Log spending"
              >
                <Receipt className="h-4 w-4 text-green-700" />
              </button>
            )}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 pb-24 overflow-y-auto">
          {tab === "farm" && <FarmScene onMailboxTap={onMailboxTap} setTab={setTab} />}
          {tab === "goals" && <GoalsTab setTab={setTab} />}
          {tab === "savings" && <SavingsTab />}
          {tab === "shop" && <ShopTab />}
          {tab === "character" && <CharacterTab />}
        </div>

        {/* ── Demo Reset pill ── */}
        <button
          className="fixed top-[58px] left-3 z-40 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-card active:scale-95 transition-all"
          style={{
            background: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(10px)",
            border: "1.5px solid rgba(192,57,43,0.22)",
            color: "#c0392b",
          }}
          onClick={() => {
            child.setState({
              pendingAllowance: null,
              mailboxCount: 0,
              goals: [],
              savingsPlans: [],
              pendingRewardChest: null,
            });
            navigate({ to: "/demo" });
          }}
        >
          <RefreshCw className="h-2.5 w-2.5" />
          Demo Reset
        </button>

        {/* ── Premium Bottom Nav ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            <div
              className="mx-3 mb-3 grid grid-cols-5 rounded-3xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(20px)",
                border: "1.5px solid rgba(0,0,0,0.07)",
                boxShadow: "0 -2px 0 rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.14)",
              }}
            >
              <NavBtn active={tab === "farm"} onClick={() => setTab("farm")} icon={<Home className="h-5 w-5" />} label="Farm" />
              <NavBtn active={tab === "goals"} onClick={() => setTab("goals")} icon={<Target className="h-5 w-5" />} label="Goals" />
              <NavBtn active={tab === "savings"} onClick={() => setTab("savings")} icon={<Wallet className="h-5 w-5" />} label="Savings" />
              <NavBtn active={tab === "shop"} onClick={() => setTab("shop")} icon={<ShoppingBag className="h-5 w-5" />} label="Shop" />
              <NavBtn active={tab === "character"} onClick={() => setTab("character")} icon={<UserCircle2 className="h-5 w-5" />} label="Me" />
            </div>
          </div>
        </div>

        {/* ── Overlays ── */}
        {showWelcome && (
          <GuideDialog
            title={`Welcome, ${child.name}! 🌻`}
            lines={[
              "Every great farm starts small. Your journey begins today!",
              "I'm Farmer Benny — your friendly guide. I'll teach you everything about farming!",
              "🎁 Here are 1,000 coins to get started!",
            ]}
            cta="Let's start farming! 🚜"
            onClose={() => {
              setShowWelcome(false);
              child.advanceTutorial(1);
              setTab("shop");
              toast.success("🪙 +1,000 coins! Head to the Shop.");
            }}
          />
        )}

        {showTutorialDone && (
          <GuideDialog
            title="Congratulations! 🎉"
            lines={[
              "Your farming journey has begun!",
              "You've planted and harvested your very first crop. Your farm will only grow from here!",
              "🌽 Keep planting, keep harvesting, and watch your farm flourish!",
            ]}
            cta="Let's explore! 🚀"
            onClose={() => {
              setShowTutorialDone(false);
              child.advanceTutorial(6);
              setTab("farm");
            }}
          />
        )}

        {child.tutorialStep >= 1 && child.tutorialStep <= 4 && !showWelcome && (
          <TutorialGuide step={child.tutorialStep} setTab={setTab} />
        )}

        {overlay === "envelope" && openedAmount && (
          <AllowanceEnvelopeOverlay
            amount={openedAmount}
            onContinue={() => setOverlay("decision")}
            onLater={() => {
              child.setState({ pendingAllowance: null });
              setOverlay(null); setOpenedAmount(null);
            }}
          />
        )}

        {overlay === "decision" && openedAmount && (
          <AllowanceDecisionOverlay
            amount={openedAmount}
            onGoal={() => setOverlay("goal-templates")}
            onSave={() => setOverlay("saving-amount")}
            onLater={() => {
              child.setState({ pendingAllowance: null });
              setOverlay(null); setOpenedAmount(null);
            }}
          />
        )}

        {overlay === "goal-templates" && openedAmount && (
          <GoalTemplatesOverlay
            onSelect={(tpl) => { setGoalTemplate(tpl); setOverlay("goal-form"); }}
            onBack={() => setOverlay("decision")}
          />
        )}

        {overlay === "goal-form" && openedAmount && (
          <GoalFormOverlay
            template={goalTemplate}
            allowance={openedAmount}
            onCreate={(data) => {
              child.createGoal(data, openedAmount);
              setOverlay(null);
              setGoalTemplate(null);
              setOpenedAmount(null);
              setTab("goals");
              toast.success(`🎯 Goal "${data.name}" created! Keep saving!`);
            }}
            onBack={() => setOverlay("goal-templates")}
          />
        )}

        {overlay === "saving-amount" && openedAmount && (
          <SavingAmountOverlay
            allowance={openedAmount}
            onSave={(savedAmount) => {
              child.createSavingsPlan(openedAmount, savedAmount);
              setOverlay(null);
              setOpenedAmount(null);
              setTab("savings");
              toast.success(`💰 Saving plan started! ${savedAmount} SAR locked in.`);
            }}
            onBack={() => setOverlay("decision")}
          />
        )}

        {overlay === "reward-chest" && child.pendingRewardChest && (
          <RewardChestOverlay
            chest={child.pendingRewardChest}
            chestOpen={chestOpen}
            onTapChest={() => setChestOpen(true)}
            onCollect={() => {
              child.closeRewardChest();
              setOverlay(null);
              setChestOpen(false);
              if (child.tutorialStep === 4) child.advanceTutorial(5);
            }}
          />
        )}

        {overlay === "log-spend" && (
          <LogSpendOverlay
            categories={child.categoryLimits}
            onLog={async (categoryId, categoryName, amount, note) => {
              await child.logSpending(categoryId, categoryName, amount, note);
              setOverlay(null);
              toast.success(`💸 ${amount} SAR logged in ${categoryName}`);
            }}
            onClose={() => setOverlay(null)}
          />
        )}
      </div>
    </MobileFrame>
  );
}

// ─────────────────────────────────────────
// Nav button — glowing selected state
// ─────────────────────────────────────────
function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 py-2.5 transition-all"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="grid place-items-center h-9 w-9 rounded-2xl transition-all duration-300"
        style={active ? {
          background: "linear-gradient(135deg, #5cb85c, #3d8b3d)",
          boxShadow: "0 4px 14px rgba(74,158,74,0.45), 0 0 0 3px rgba(74,158,74,0.12)",
          transform: "scale(1.08)",
          color: "white",
        } : {
          color: "#aaa",
        }}
      >
        {icon}
      </div>
      <span
        className="text-[10px] font-bold transition-colors duration-300"
        style={{ color: active ? "#3d8b3d" : "#bbb" }}
      >
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────
// Farm Scene — premium visual redesign
// ─────────────────────────────────────────
function FarmScene({ onMailboxTap, setTab }: { onMailboxTap: () => void; setTab: (t: Tab) => void }) {
  const child = useChild();
  const { fields, placed, avatar, name, tutorialStep, pendingAllowance, plantCorn, harvest } = child;

  const onFieldTap = (f: Field) => {
    if (!f.owned) {
      toast.info("Buy this field from the Shop! 🔒");
      if (tutorialStep === 1) setTab("shop");
      return;
    }
    if (f.crop) {
      if (harvest(f.id)) {
        if (tutorialStep === 4) child.advanceTutorial(5);
      }
    } else {
      const seeds = child.inventory["corn-seeds"] ?? 0;
      if (seeds < 1) {
        toast.info("You need Corn Seeds! Get them from the Shop. 🌱");
        setTab("shop");
        return;
      }
      if (plantCorn(f.id)) {
        toast.success("🌱 Corn planted! Tap it again to harvest.");
        if (tutorialStep === 3) child.advanceTutorial(4);
      }
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 134px)" }}>

      {/* ── Sky — compact warm morning ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #f9d776 0%, #fceabb 8%, #b5e8f7 22%, #7ecef4 42%, #a8dba8 62%, #6db860 75%, #4a9940 100%)",
        }}
      />

      {/* Sun with rays */}
      <div
        className="absolute"
        style={{
          top: 10, right: 18, width: 52, height: 52,
          background: "radial-gradient(circle at 42% 38%, #fffde0, #ffe066 35%, #ffaa00 80%)",
          borderRadius: "50%",
          boxShadow: "0 0 0 8px rgba(255,220,0,0.18), 0 0 0 18px rgba(255,200,0,0.10), 0 0 40px rgba(255,180,0,0.5)",
        }}
      />

      {/* Animated CSS clouds */}
      <CSSCloud style={{ top: 14, left: -20, width: 90, height: 32, animationName: "cloudDrift1", animationDuration: "11s" }} />
      <CSSCloud style={{ top: 28, left: 120, width: 70, height: 26, opacity: 0.8, animationName: "cloudDrift2", animationDuration: "14s" }} />
      <CSSCloud style={{ top: 10, right: -10, width: 80, height: 28, opacity: 0.75, animationName: "cloudDrift3", animationDuration: "9s" }} />

      {/* Bird that flies across occasionally */}
      <div
        className="absolute text-sm pointer-events-none"
        style={{ top: "8%", left: 0, animation: "birdFly 18s linear infinite", opacity: 0.85 }}
      >🐦</div>
      <div
        className="absolute text-xs pointer-events-none"
        style={{ top: "12%", left: 0, animation: "birdFly 28s linear infinite 9s", opacity: 0.7 }}
      >🐦</div>

      {/* Distant hills */}
      <svg className="absolute w-full" style={{ top: "28%", height: 80 }} viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M0 60 Q60 10 130 40 Q200 70 270 25 Q330 0 400 35 L400 80 L0 80 Z" fill="#7cc97c" opacity="0.5" />
        <path d="M0 70 Q80 40 170 58 Q260 76 340 48 Q370 38 400 55 L400 80 L0 80 Z" fill="#5cb85c" opacity="0.7" />
      </svg>

      {/* Rich ground — layered greens */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "48%", bottom: 0,
          background: "linear-gradient(180deg, #5db85d 0%, #4aaa48 18%, #3d9640 45%, #2e7d32 100%)",
        }}
      />

      {/* Grass texture blobs */}
      <svg className="absolute w-full pointer-events-none" style={{ top: "47%", height: 50 }} viewBox="0 0 400 50" preserveAspectRatio="none">
        <ellipse cx="30" cy="10" rx="28" ry="12" fill="#68c468" opacity="0.5" />
        <ellipse cx="100" cy="8" rx="22" ry="10" fill="#52b252" opacity="0.45" />
        <ellipse cx="180" cy="12" rx="30" ry="13" fill="#72ce72" opacity="0.4" />
        <ellipse cx="270" cy="7" rx="25" ry="11" fill="#5cbc5c" opacity="0.5" />
        <ellipse cx="360" cy="10" rx="32" ry="12" fill="#66ca66" opacity="0.45" />
      </svg>

      {/* Small decorative flowers across ground */}
      {[
        { left: "5%",  bottom: "44%", emoji: "🌼", size: 14, anim: "flowerSway1" },
        { left: "15%", bottom: "43%", emoji: "🌸", size: 12, anim: "flowerSway2" },
        { left: "55%", bottom: "44%", emoji: "🌼", size: 13, anim: "flowerSway1" },
        { left: "70%", bottom: "43%", emoji: "🌸", size: 11, anim: "flowerSway2" },
        { left: "85%", bottom: "45%", emoji: "🌼", size: 14, anim: "flowerSway1" },
        { left: "91%", bottom: "38%", emoji: "🌸", size: 12, anim: "flowerSway2" },
        { left: "3%",  bottom: "33%", emoji: "🌼", size: 11, anim: "flowerSway2" },
        { left: "44%", bottom: "43%", emoji: "🌻", size: 18, anim: "flowerSway1" },
      ].map((f, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ left: f.left, bottom: f.bottom, fontSize: f.size, animation: `${f.anim} 2.5s ease-in-out infinite alternate` }}>
          {f.emoji}
        </div>
      ))}

      {/* Rocks */}
      {[
        { left: "8%", bottom: "28%" },
        { left: "78%", bottom: "32%" },
        { left: "40%", bottom: "10%" },
      ].map((r, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ left: r.left, bottom: r.bottom }}>
          <svg width="16" height="10" viewBox="0 0 16 10">
            <ellipse cx="8" cy="7" rx="7" ry="5" fill="#8a8a8a" opacity="0.6" />
            <ellipse cx="8" cy="6" rx="6" ry="4" fill="#b0b0b0" opacity="0.7" />
          </svg>
        </div>
      ))}

      {/* Bushes */}
      <div className="absolute pointer-events-none" style={{ left: "1%", bottom: "42%" }}>
        <BushSVG width={36} shade="#3d8b2a" />
      </div>
      <div className="absolute pointer-events-none" style={{ right: "2%", bottom: "26%" }}>
        <BushSVG width={30} shade="#4a9e35" />
      </div>
      <div className="absolute pointer-events-none" style={{ left: "38%", bottom: "42%" }}>
        <BushSVG width={22} shade="#3d8b2a" />
      </div>

      {/* Fruit trees */}
      <div className="absolute pointer-events-none" style={{ right: "2%", bottom: "45%", fontSize: 40, filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.22))", animation: "leafSway 3s ease-in-out infinite alternate" }}>
        🌳
      </div>
      <div className="absolute pointer-events-none" style={{ left: "0%", bottom: "48%", fontSize: 34, filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.2))", animation: "leafSway 4s ease-in-out infinite alternate-reverse" }}>
        🍎
      </div>

      {/* Curved dirt walking path */}
      <svg className="absolute w-full pointer-events-none" style={{ bottom: "14%", height: 22 }} viewBox="0 0 400 22" preserveAspectRatio="none">
        <path d="M0 16 Q100 6 200 14 Q300 22 400 10 L400 18 Q300 28 200 20 Q100 12 0 22 Z" fill="#c49a4a" opacity="0.65" />
        <path d="M0 14 Q100 5 200 13 Q300 21 400 9 L400 11 Q300 23 200 15 Q100 7 0 16 Z" fill="#d4aa60" opacity="0.4" />
      </svg>

      {/* Wooden fence — improved */}
      <FenceSVG />

      {/* Farmhouse — SVG-drawn */}
      <div
        className="absolute"
        style={{ left: "1%", bottom: "46%", filter: "drop-shadow(4px 8px 16px rgba(0,0,0,0.28))" }}
      >
        <FarmhouseSVG />
      </div>

      {/* Mailbox — interactive */}
      <button
        onClick={onMailboxTap}
        className="absolute active:scale-90 transition-transform"
        style={{
          left: "29%", bottom: "41%",
          fontSize: 30,
          filter: "drop-shadow(1px 3px 4px rgba(0,0,0,0.22))",
          animation: pendingAllowance ? "mailboxShake 1.8s ease-in-out infinite" : "none",
        }}
      >
        {pendingAllowance ? "📬" : "📮"}
        {pendingAllowance && (
          <div
            className="absolute -top-3 -right-2 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ width: 20, height: 20, background: "linear-gradient(135deg,#ff5252,#c0392b)", boxShadow: "0 2px 8px rgba(192,57,43,0.5)", animation: "bubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            1
          </div>
        )}
      </button>

      {/* Allowance hint bubble */}
      {pendingAllowance && (
        <div
          className="absolute rounded-2xl px-3 py-1.5 text-xs font-bold shadow-card"
          style={{ left: "14%", bottom: "55%", background: "white", border: "2px solid #ffd54f", color: "#6d4c00", animation: "floatUp 2s ease-in-out infinite alternate", whiteSpace: "nowrap" }}
        >
          Your allowance has arrived!
        </div>
      )}

      {/* Farm sign */}
      <div className="absolute flex flex-col items-center" style={{ right: "4%", bottom: "43%" }}>
        <div style={{ background: "linear-gradient(135deg, #c98a4a, #9a5c20)", color: "white", fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 6, border: "2.5px solid #7a3d10", boxShadow: "0 4px 10px rgba(0,0,0,0.28)", whiteSpace: "nowrap", fontFamily: "Fraunces, serif", letterSpacing: "-0.02em" }}>
          {name}'s Farm
        </div>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg,#9a6030,#6b3411)" }} />
      </div>

      {/* Placed items from shop */}
      {placed.map((p) => (
        <div key={p.id} className="absolute select-none" style={{ left: `${p.x}%`, top: `${56 + (p.y % 18)}%`, fontSize: 28, filter: "drop-shadow(1px 2px 4px rgba(0,0,0,0.15))" }}>
          {p.icon}
        </div>
      ))}

      {/* Farm Fields — redesigned soil plots */}
      <div className="absolute left-3 right-3 grid grid-cols-3 gap-2.5" style={{ bottom: "21%" }}>
        {fields.map((f) => (
          <FieldTile key={f.id} field={f} tutorialStep={tutorialStep} onTap={() => onFieldTap(f)} />
        ))}
      </div>

      {/* Avatar — 50% bigger */}
      <div className="absolute pointer-events-none" style={{ bottom: "5%", left: "50%", transform: "translateX(-50%)" }}>
        <div style={{ animation: "avatarBreathe 3s ease-in-out infinite" }}>
          <ChildAvatar a={avatar!} size={105} />
        </div>
      </div>

      {/* Tutorial pointer */}
      {(tutorialStep === 3 || tutorialStep === 4) && (
        <div className="absolute pointer-events-none flex flex-col items-center" style={{ bottom: "38%", left: "50%", transform: "translateX(-50%)" }}>
          <div className="text-3xl" style={{ animation: "bounce 0.8s ease-in-out infinite alternate" }}>👇</div>
        </div>
      )}

      <style>{`
        @keyframes cloudDrift1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(16px)} }
        @keyframes cloudDrift2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-12px)} }
        @keyframes cloudDrift3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(10px)} }
        @keyframes birdFly { from{transform:translateX(-40px) translateY(0)} 40%{transform:translateX(220px) translateY(-12px)} 60%{transform:translateX(260px) translateY(4px)} to{transform:translateX(500px) translateY(-8px)} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes mailboxShake {
          0%,100%{transform:rotate(0deg)} 15%{transform:rotate(-10deg)} 30%{transform:rotate(10deg)}
          45%{transform:rotate(-6deg)} 60%{transform:rotate(6deg)} 75%{transform:rotate(-3deg)} 85%{transform:rotate(0deg)}
        }
        @keyframes floatUp { from{transform:translateY(0)} to{transform:translateY(-6px)} }
        @keyframes bubblePop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes flowerSway1 { from{transform:rotate(-5deg)} to{transform:rotate(5deg)} }
        @keyframes flowerSway2 { from{transform:rotate(4deg)} to{transform:rotate(-4deg)} }
        @keyframes leafSway { from{transform:rotate(-3deg) scale(1)} to{transform:rotate(3deg) scale(1.03)} }
        @keyframes avatarBreathe { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.025)} }
        @keyframes coinBounce { 0%,100%{transform:translateY(0) rotate(0deg)} 40%{transform:translateY(-2px) rotate(8deg)} 70%{transform:translateY(0) rotate(-4deg)} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// CSS Cloud shape component
// ─────────────────────────────────────────
function CSSCloud({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        borderRadius: 50,
        background: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.07)",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
        opacity: 0.92,
        ...style,
      }}
    >
      <div style={{
        position: "absolute",
        top: "-40%", left: "20%",
        width: "40%", height: "80%",
        background: "white",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute",
        top: "-55%", left: "42%",
        width: "35%", height: "90%",
        background: "white",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute",
        top: "-30%", left: "60%",
        width: "28%", height: "65%",
        background: "white",
        borderRadius: "50%",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────
// Bush SVG component
// ─────────────────────────────────────────
function BushSVG({ width, shade }: { width: number; shade: string }) {
  const h = Math.round(width * 0.65);
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`}>
      <ellipse cx={width * 0.5} cy={h * 0.7} rx={width * 0.48} ry={h * 0.35} fill={shade} opacity="0.9" />
      <ellipse cx={width * 0.3} cy={h * 0.5} rx={width * 0.3} ry={h * 0.38} fill={shade} opacity="0.85" />
      <ellipse cx={width * 0.7} cy={h * 0.48} rx={width * 0.28} ry={h * 0.35} fill={shade} opacity="0.85" />
      <ellipse cx={width * 0.5} cy={h * 0.35} rx={width * 0.26} ry={h * 0.3} fill="#5aad40" opacity="0.7" />
    </svg>
  );
}

// ─────────────────────────────────────────
// Fence SVG
// ─────────────────────────────────────────
function FenceSVG() {
  return (
    <svg className="absolute w-full pointer-events-none" style={{ bottom: "41.5%", height: 30 }} viewBox="0 0 400 30" preserveAspectRatio="none">
      {/* Rail top */}
      <rect x="0" y="8" width="400" height="5" rx="2" fill="#a0631a" />
      {/* Rail middle */}
      <rect x="0" y="17" width="400" height="4" rx="2" fill="#8a5218" />
      {/* Posts */}
      {Array.from({ length: 22 }).map((_, i) => (
        <g key={i}>
          <rect x={i * 18 + 2} y="2" width="5" height="26" rx="2" fill="#b87730" />
          <rect x={i * 18 + 2} y="2" width="5" height="6" rx="2" fill="#d4922a" />
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────
// Farmhouse SVG — hand-drawn premium house
// ─────────────────────────────────────────
function FarmhouseSVG() {
  return (
    <svg width="118" height="108" viewBox="0 0 118 108">
      {/* Foundation / porch platform */}
      <rect x="4" y="88" width="110" height="14" rx="3" fill="#8B6020" />
      <rect x="4" y="88" width="110" height="5" rx="2" fill="#a07828" />

      {/* Porch pillars */}
      <rect x="14" y="72" width="6" height="22" rx="2" fill="#c49040" />
      <rect x="98" y="72" width="6" height="22" rx="2" fill="#c49040" />

      {/* Porch rail */}
      <rect x="10" y="80" width="98" height="4" rx="2" fill="#b8802e" />

      {/* Main house body */}
      <rect x="10" y="46" width="98" height="52" rx="4" fill="#c8842a" />
      {/* Wood planks */}
      {[52, 58, 64, 70, 76, 82, 88].map(y => (
        <line key={y} x1="10" y1={y} x2="108" y2={y} stroke="#a86818" strokeWidth="1.2" opacity="0.55" />
      ))}

      {/* Roof — orange peaked */}
      <polygon points="4,48 59,6 114,48" fill="#e8631a" />
      <polygon points="4,48 59,6 114,48" fill="none" stroke="#c04c10" strokeWidth="1.5" opacity="0.5" />
      {/* Roof ridge highlight */}
      <polygon points="10,47 59,10 108,47 104,47 59,14 14,47" fill="#f0783a" opacity="0.5" />
      {/* Roof tiles lines */}
      <line x1="59" y1="6" x2="4" y2="48" stroke="#bf4c0e" strokeWidth="0.8" opacity="0.4" />
      <line x1="59" y1="6" x2="114" y2="48" stroke="#bf4c0e" strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="27" x2="86" y2="48" stroke="#bf4c0e" strokeWidth="0.8" opacity="0.3" />
      <line x1="32" y1="27" x2="59" y2="6" stroke="#bf4c0e" strokeWidth="0.8" opacity="0.3" />

      {/* Chimney */}
      <rect x="74" y="6" width="13" height="28" rx="2" fill="#9a3e18" />
      <rect x="72" y="4" width="17" height="5" rx="2" fill="#7a2e10" />
      {/* Smoke puffs */}
      <circle cx="80" cy="1" r="3" fill="rgba(200,200,200,0.5)" />
      <circle cx="83" cy="-2" r="2" fill="rgba(200,200,200,0.3)" />

      {/* Left window */}
      <rect x="16" y="55" width="24" height="20" rx="4" fill="#87CEEB" />
      <rect x="16" y="55" width="24" height="20" rx="4" fill="none" stroke="#c9952c" strokeWidth="2" />
      {/* Window cross */}
      <line x1="28" y1="55" x2="28" y2="75" stroke="#c9952c" strokeWidth="1.5" />
      <line x1="16" y1="65" x2="40" y2="65" stroke="#c9952c" strokeWidth="1.5" />
      {/* Window shine */}
      <rect x="18" y="57" width="7" height="5" rx="1.5" fill="rgba(255,255,255,0.55)" />

      {/* Right window */}
      <rect x="78" y="55" width="24" height="20" rx="4" fill="#87CEEB" />
      <rect x="78" y="55" width="24" height="20" rx="4" fill="none" stroke="#c9952c" strokeWidth="2" />
      <line x1="90" y1="55" x2="90" y2="75" stroke="#c9952c" strokeWidth="1.5" />
      <line x1="78" y1="65" x2="102" y2="65" stroke="#c9952c" strokeWidth="1.5" />
      <rect x="80" y="57" width="7" height="5" rx="1.5" fill="rgba(255,255,255,0.55)" />

      {/* Door */}
      <rect x="44" y="66" width="30" height="32" rx="6" fill="#7a3c10" />
      <rect x="44" y="66" width="30" height="32" rx="6" fill="none" stroke="#9a5820" strokeWidth="2" />
      {/* Door arch top */}
      <path d="M44 72 Q59 58 74 72" fill="#8a4a18" />
      {/* Door knob */}
      <circle cx="71" cy="83" r="2.5" fill="#e8c040" />
      {/* Door panels */}
      <rect x="48" y="74" width="10" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="#9a5820" strokeWidth="1" />
      <rect x="60" y="74" width="10" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="#9a5820" strokeWidth="1" />

      {/* Flower pot left */}
      <rect x="8" y="84" width="12" height="8" rx="2" fill="#c46020" />
      <rect x="6" y="83" width="16" height="4" rx="2" fill="#d07030" />
      <circle cx="14" cy="80" r="6" fill="#3d8b2a" opacity="0.9" />
      <text x="14" y="83" textAnchor="middle" fontSize="8">🌸</text>

      {/* Flower pot right */}
      <rect x="98" y="84" width="12" height="8" rx="2" fill="#c46020" />
      <rect x="96" y="83" width="16" height="4" rx="2" fill="#d07030" />
      <circle cx="104" cy="80" r="6" fill="#3d8b2a" opacity="0.9" />
      <text x="104" y="83" textAnchor="middle" fontSize="8">🌺</text>
    </svg>
  );
}

// ─────────────────────────────────────────
// Field Tile — rich soil with depth
// ─────────────────────────────────────────
function FieldTile({ field, tutorialStep, onTap }: { field: Field; tutorialStep: number; onTap: () => void }) {
  const isHighlighted =
    (!field.owned && tutorialStep === 1) ||
    (field.owned && !field.crop && tutorialStep === 3) ||
    (field.owned && !!field.crop && tutorialStep === 4);

  return (
    <button
      onClick={onTap}
      className="aspect-square rounded-2xl relative overflow-hidden transition active:scale-95"
      style={{
        border: field.owned ? "2.5px solid #7a4a18" : "2px dashed rgba(100,70,40,0.3)",
        background: field.owned
          ? "linear-gradient(160deg, #9e6030 0%, #7a4018 40%, #5c2c0a 100%)"
          : "rgba(180,150,100,0.10)",
        boxShadow: field.owned
          ? "inset 0 3px 0 rgba(255,255,255,0.10), inset 0 -3px 8px rgba(0,0,0,0.30), 0 6px 18px rgba(0,0,0,0.18)"
          : "none",
        outline: isHighlighted ? "3px solid #69b072" : "none",
        outlineOffset: 2,
        animation: isHighlighted ? "fieldPulse 1.2s ease-in-out infinite" : "none",
      }}
    >
      {/* Soil texture lines for owned empty field */}
      {field.owned && !field.crop && (
        <svg className="absolute inset-0 w-full h-full opacity-30">
          {[20, 35, 50, 65, 80].map(y => (
            <line key={y} x1="8%" y1={`${y}%`} x2="92%" y2={`${y}%`} stroke="#3a1a00" strokeWidth="1.5" strokeDasharray="2 3" />
          ))}
        </svg>
      )}

      {/* Inner shadow for depth */}
      {field.owned && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 8px 16px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(255,180,80,0.08)" }} />
      )}

      {!field.owned && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="rounded-xl p-1.5" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}>
            <Lock className="h-5 w-5 text-amber-700" />
          </div>
          <span className="text-[9px] font-bold text-amber-700/70 bg-white/50 rounded-full px-2 py-0.5">Shop</span>
        </div>
      )}

      {field.owned && !field.crop && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl opacity-60">🌱</span>
        </div>
      )}

      {field.owned && field.crop && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-4xl"
            style={{ filter: "drop-shadow(0 0 10px rgba(255,220,0,0.8))", animation: "cropGlow 1.4s ease-in-out infinite alternate" }}
          >🌽</span>
        </div>
      )}

      <style>{`
        @keyframes fieldPulse { 0%,100%{outline-color:#69b072} 50%{outline-color:#c8e6c9} }
        @keyframes cropGlow { from{filter:drop-shadow(0 0 6px rgba(255,200,0,0.5))} to{filter:drop-shadow(0 0 18px rgba(255,200,0,1))} }
      `}</style>
    </button>
  );
}

// ─────────────────────────────────────────
// Goals Tab
// ─────────────────────────────────────────
const GOAL_ICONS = ["🚲","🎮","📚","🎁","✈️","🏀","🎨","🎵","👟","🌴","🧸","🎪","🏕️","📱","🎒","🍕","⚽","🎯","🌟","✨"];

function GoalsTab({ setTab }: { setTab: (t: Tab) => void }) {
  const child = useChild();
  const { goals, walletBalance, contributeToGoal, createGoal, submitGoalComplete } = child;

  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null);
  const [showQuickSave, setShowQuickSave] = useState(false);

  const addingGoal = addingToGoalId ? goals.find((g) => g.id === addingToGoalId) ?? null : null;

  return (
    <div className="px-5 pt-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-bold">🎯 My Goals</h2>
        <button
          onClick={() => setShowNewGoalForm(true)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 font-bold text-sm text-white active:scale-95 transition"
          style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
        >
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Save money for things you really want!</p>

      {/* Wallet balance banner */}
      {walletBalance > 0 && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: "linear-gradient(135deg, #fffde7, #fff9c4)", border: "1.5px solid #f9cc00" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">💰</div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-amber-800">Available to save</div>
              <div className="font-display text-xl font-bold text-amber-900">{walletBalance} SAR</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowQuickSave(true)}
              className="rounded-xl px-3 py-2.5 text-xs font-bold text-amber-900 active:scale-95 transition flex items-center justify-center gap-1.5"
              style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid #f0c000" }}
            >
              🐷 Save to Piggy Bank
            </button>
            {goals.filter((g) => g.status === "active").length > 0 ? (
              <div className="text-xs text-amber-700 font-semibold flex items-center justify-center text-center leading-snug px-1">
                Or tap a goal below to add ↓
              </div>
            ) : (
              <button
                onClick={() => setShowNewGoalForm(true)}
                className="rounded-xl px-3 py-2.5 text-xs font-bold text-white active:scale-95 transition"
                style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
              >
                🎯 Create a Goal →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center shadow-card"
          style={{ background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", border: "1.5px dashed #a5d6a7" }}
        >
          <div className="text-5xl mb-3">🎯</div>
          <div className="font-display text-lg font-bold">No goals yet!</div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Set a savings goal for something you really want — then save up for it!
          </p>
          <button
            onClick={() => setShowNewGoalForm(true)}
            className="rounded-2xl px-6 py-3 font-bold text-sm text-white shadow-soft active:scale-95 transition"
            style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
          >
            + Create My First Goal
          </button>
        </div>
      )}

      {/* Goals list */}
      {goals.length > 0 && (
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const canComplete = goal.status === "active" && goal.currentAmount >= goal.targetAmount;
            const canAdd = goal.status === "active" && walletBalance > 0 && !canComplete;
            return (
              <div
                key={goal.id}
                className="rounded-3xl border overflow-hidden shadow-card"
                style={{
                  background:
                    goal.status === "approved" ? "linear-gradient(135deg, #f0fdf4, #e8f5e9)" :
                    goal.status === "rejected" ? "#fafafa" : "white",
                  borderColor:
                    goal.status === "approved" ? "#c8e6c9" :
                    goal.status === "rejected" ? "#ffcdd2" : "#f0f0f0",
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-card" style={{ background: "linear-gradient(135deg, #fff9e6, #ffeaa0)" }}>
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base">{goal.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground">{goal.currentAmount}</span>
                        {" / "}{goal.targetAmount} SAR
                        {goal.targetDate && ` · by ${new Date(goal.targetDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <StatusBadge status={goal.status} />
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 rounded-full bg-secondary overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "linear-gradient(90deg,#f9cc00,#ff9900)" : "linear-gradient(90deg,#69b072,#4a9e4a)" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">{pct}% saved</span>
                    {goal.status === "active" && remaining > 0 && (
                      <span className="text-muted-foreground">{remaining} SAR to go</span>
                    )}
                  </div>
                </div>

                {/* Action area */}
                {goal.status === "active" && (
                  <div className="px-4 pb-4 space-y-2">
                    {canAdd && (
                      <button
                        onClick={() => setAddingToGoalId(goal.id)}
                        className="w-full rounded-2xl py-3 font-bold text-sm border-2 border-primary text-primary flex items-center justify-center gap-2 active:scale-[0.98] transition"
                        style={{ background: "rgba(74,158,74,0.07)" }}
                      >
                        💰 Add Savings <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      disabled={!canComplete}
                      onClick={() => { submitGoalComplete(goal.id); toast.success("🎯 Request sent to your parent for approval!"); }}
                      className="w-full rounded-2xl py-3 font-bold text-sm text-white shadow-soft active:scale-[0.98] transition disabled:opacity-40"
                      style={{ background: canComplete ? "linear-gradient(135deg,#f9cc00,#ff9900)" : "#e0e0e0" }}
                    >
                      {canComplete ? "🏆 I Reached My Goal!" : `Need ${remaining} more SAR`}
                    </button>
                  </div>
                )}
                {goal.status === "pending_approval" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm font-semibold text-amber-700" style={{ background: "#fffde7", border: "1.5px solid #ffd54f" }}>
                      ⏳ Amazing! Waiting for your parent to approve.
                    </div>
                  </div>
                )}
                {goal.status === "approved" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm font-bold text-green-700" style={{ background: "#f0fdf4", border: "1.5px solid #c8e6c9" }}>
                      ✅ Approved! You did it — great saving! 🎉
                    </div>
                  </div>
                )}
                {goal.status === "rejected" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm font-semibold text-red-600" style={{ background: "#fff5f5", border: "1.5px solid #ffcdd2" }}>
                      ❌ Your parent asked you to try again.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Goal Sheet ── */}
      {showNewGoalForm && (
        <NewGoalSheet
          onClose={() => setShowNewGoalForm(false)}
          onCreate={(data) => {
            createGoal(data, 0);
            setShowNewGoalForm(false);
            toast.success(`🎯 Goal "${data.name}" created! Start saving!`);
          }}
        />
      )}

      {/* ── Add Savings Sheet ── */}
      {addingGoal && (
        <AddSavingsSheet
          goal={addingGoal}
          walletBalance={walletBalance}
          onClose={() => setAddingToGoalId(null)}
          onContribute={(amount) => {
            contributeToGoal(addingGoal.id, amount);
            setAddingToGoalId(null);
            toast.success(`💰 ${amount} SAR saved toward "${addingGoal.name}"!`);
          }}
        />
      )}

      {/* ── Quick Save Sheet ── */}
      {showQuickSave && (
        <QuickSaveSheet
          walletBalance={walletBalance}
          onClose={() => setShowQuickSave(false)}
          onSave={(amount) => {
            child.createSavingsPlan(walletBalance, amount);
            setShowQuickSave(false);
            toast.success(`🐷 ${amount} SAR saved to your piggy bank!`);
          }}
        />
      )}

      <style>{`@keyframes bubblePop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}

// ── New Goal Sheet ────────────────────────────────────────────────
function NewGoalSheet({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: { name: string; icon: string; targetAmount: number; targetDate?: string }) => void;
}) {
  const [icon, setIcon] = useState("🎯");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");

  const canSubmit = name.trim() && Number(target) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-10 overflow-y-auto max-h-[90vh]"
        style={{ background: "white", animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl font-bold">New Goal 🎯</h3>
            <p className="text-xs text-muted-foreground mt-0.5">What are you saving up for?</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Icon picker */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pick an icon</div>
          <div className="flex flex-wrap gap-2">
            {GOAL_ICONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className="h-10 w-10 rounded-xl text-xl flex items-center justify-center transition"
                style={{
                  background: icon === e ? "rgba(74,158,74,0.15)" : "#f5f5f5",
                  border: icon === e ? "2px solid #4a9e4a" : "2px solid transparent",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Selected icon preview + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-card" style={{ background: "linear-gradient(135deg,#fff9e6,#ffeaa0)" }}>
            {icon}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. New Bike)"
            className="flex-1 rounded-2xl bg-secondary px-4 py-3.5 outline-none text-sm font-semibold"
            autoFocus
          />
        </div>

        {/* Target amount */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How much does it cost? (SAR)</div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5">
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent outline-none text-2xl font-display font-bold"
            />
            <span className="text-sm font-semibold text-muted-foreground">SAR</span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-4">
          {[50, 100, 200, 500, 1000].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setTarget(String(a))}
              className="rounded-xl px-3 py-2 text-xs font-bold border border-border bg-secondary active:scale-95 transition"
            >
              {a}
            </button>
          ))}
        </div>

        {/* Optional deadline */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Target date <span className="normal-case font-normal">(optional)</span></div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-sm"
          />
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => canSubmit && onCreate({ name: name.trim(), icon, targetAmount: Number(target), targetDate: date || undefined })}
          className="w-full rounded-2xl py-4 font-bold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#69b072,#4a9e4a)" }}
        >
          Create Goal ✓
        </button>
      </div>
    </div>
  );
}

// ── Add Savings Sheet ────────────────────────────────────────────
function AddSavingsSheet({ goal, walletBalance, onClose, onContribute }: {
  goal: { id: string; name: string; icon: string; targetAmount: number; currentAmount: number };
  walletBalance: number;
  onClose: () => void;
  onContribute: (amount: number) => void;
}) {
  const remaining = goal.targetAmount - goal.currentAmount;
  const maxAdd = Math.min(walletBalance, remaining);
  const [amount, setAmount] = useState(String(maxAdd));

  const parsed = Math.min(maxAdd, Math.max(0, Number(amount) || 0));
  const newAmount = goal.currentAmount + parsed;
  const newPct = Math.min(100, Math.round((newAmount / goal.targetAmount) * 100));
  const canSubmit = parsed > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-10"
        style={{ background: "white", animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg,#fff9e6,#ffeaa0)" }}>
              {goal.icon}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">{goal.name}</h3>
              <p className="text-xs text-muted-foreground">{goal.currentAmount} / {goal.targetAmount} SAR saved</p>
            </div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Wallet balance */}
        <div className="rounded-2xl p-3 mb-4 flex items-center gap-2" style={{ background: "#fffde7", border: "1px solid #f9cc00" }}>
          <span className="text-lg">💰</span>
          <span className="text-sm font-semibold">You have <strong>{walletBalance} SAR</strong> available to save</span>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How much to save?</div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5">
            <input
              type="number"
              min={1}
              max={maxAdd}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent outline-none text-2xl font-display font-bold"
              autoFocus
            />
            <span className="text-sm font-semibold text-muted-foreground">SAR</span>
          </div>
        </div>

        {/* Quick amount chips */}
        <div className="flex gap-2 mb-4">
          {[
            { label: "25%", val: Math.floor(maxAdd * 0.25) },
            { label: "Half", val: Math.floor(maxAdd * 0.5) },
            { label: "All", val: maxAdd },
          ].filter((q) => q.val > 0).map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setAmount(String(q.val))}
              className="rounded-xl px-3 py-2 text-xs font-bold border border-border bg-secondary active:scale-95 transition"
            >
              {q.label} ({q.val} SAR)
            </button>
          ))}
        </div>

        {/* Preview new progress */}
        {canSubmit && (
          <div className="rounded-2xl p-3 mb-4" style={{ background: "#f0fdf4", border: "1px solid #c8e6c9" }}>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>New progress</span>
              <span className="text-primary">{newPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${newPct}%`, background: "linear-gradient(90deg,#69b072,#4a9e4a)" }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">
              {newAmount} / {goal.targetAmount} SAR
              {newAmount >= goal.targetAmount && " — 🎉 Goal reached!"}
            </div>
          </div>
        )}

        <button
          disabled={!canSubmit}
          onClick={() => canSubmit && onContribute(parsed)}
          className="w-full rounded-2xl py-4 font-bold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#69b072,#4a9e4a)" }}
        >
          Save {parsed > 0 ? `${parsed} SAR` : "…"} to Goal 💰
        </button>
      </div>
    </div>
  );
}

// ── Quick Save Sheet (save to piggy bank without a goal) ─────────
function QuickSaveSheet({ walletBalance, onClose, onSave }: {
  walletBalance: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(walletBalance > 0 ? String(walletBalance) : "");
  const parsed = Math.min(walletBalance, Math.max(0, Number(amount) || 0));
  const canSubmit = parsed > 0 && walletBalance > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-10"
        style={{ background: "white", animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">🐷 Save to Piggy Bank</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Save money without a specific goal</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {walletBalance === 0 ? (
          /* No balance state */
          <div className="flex flex-col items-center text-center py-6">
            <div className="text-6xl mb-4">🐷</div>
            <div className="font-display text-lg font-bold mb-2">No balance yet!</div>
            <p className="text-sm text-muted-foreground mb-6">
              Your piggy bank is empty. Ask your parent to send you an allowance — once it arrives, tap the mailbox on the Farm and claim it. Then you can save here!
            </p>
            <button
              onClick={onClose}
              className="rounded-2xl px-6 py-3 font-bold text-sm border-2 border-border active:scale-95 transition"
            >
              Got it!
            </button>
          </div>
        ) : (
          <>
            {/* Balance pill */}
            <div className="rounded-2xl p-3 mb-4 flex items-center gap-2" style={{ background: "#fffde7", border: "1px solid #f9cc00" }}>
              <span className="text-lg">💰</span>
              <span className="text-sm font-semibold">You have <strong>{walletBalance} SAR</strong> to save</span>
            </div>

            {/* Amount */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How much to save?</div>
              <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5">
                <input
                  type="number"
                  min={1}
                  max={walletBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-2xl font-display font-bold"
                  autoFocus
                />
                <span className="text-sm font-semibold text-muted-foreground">SAR</span>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 mb-5">
              {[
                { label: "25%", val: Math.floor(walletBalance * 0.25) },
                { label: "Half", val: Math.floor(walletBalance * 0.5) },
                { label: "All", val: walletBalance },
              ].filter((q) => q.val > 0).map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setAmount(String(q.val))}
                  className="rounded-xl px-3 py-2 text-xs font-bold border border-border bg-secondary active:scale-95 transition"
                >
                  {q.label} ({q.val} SAR)
                </button>
              ))}
            </div>

            <div className="rounded-2xl p-3 mb-4 text-xs text-muted-foreground" style={{ background: "#f0fdf4", border: "1px solid #c8e6c9" }}>
              💡 Your savings will appear here in the <strong>Savings</strong> tab. Ask your parent to confirm them!
            </div>

            <button
              disabled={!canSubmit}
              onClick={() => canSubmit && onSave(parsed)}
              className="w-full rounded-2xl py-4 font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #f9cc00, #ff9900)" }}
            >
              Save {parsed > 0 ? `${parsed} SAR` : "…"} to Piggy Bank 🐷
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Savings Tab
// ─────────────────────────────────────────
function SavingsTab() {
  const child = useChild();
  const { savingsPlans, walletBalance, submitSavingDone } = child;
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl font-bold">💰 My Savings</h2>
        <button
          onClick={() => setShowSaveSheet(true)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 font-bold text-sm text-white active:scale-95 transition"
          style={{ background: "linear-gradient(135deg, #f9cc00, #ff9900)" }}
        >
          <Plus className="h-4 w-4" /> Save Money
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Build a healthy saving habit one step at a time!</p>

      {/* Wallet balance banner */}
      <div
        className="rounded-2xl p-3.5 mb-4 flex items-center gap-3"
        style={{
          background: walletBalance > 0
            ? "linear-gradient(135deg, #fffde7, #fff9c4)"
            : "linear-gradient(135deg, #f5f5f5, #ececec)",
          border: walletBalance > 0 ? "1.5px solid #f9cc00" : "1.5px solid #e0e0e0",
        }}
      >
        <span className="text-2xl">{walletBalance > 0 ? "💰" : "🐷"}</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-muted-foreground">
            {walletBalance > 0 ? "Ready to save" : "Your piggy bank"}
          </div>
          <div className="font-bold">
            {walletBalance > 0 ? `${walletBalance} SAR available` : "No balance yet — ask your parent!"}
          </div>
        </div>
        {walletBalance > 0 && (
          <button
            onClick={() => setShowSaveSheet(true)}
            className="rounded-xl px-3 py-2 text-xs font-bold text-amber-900 active:scale-95 transition"
            style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid #f0c000" }}
          >
            🐷 Save it!
          </button>
        )}
      </div>

      {savingsPlans.length === 0 ? (
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center shadow-card"
          style={{ background: "linear-gradient(135deg, #fff9e6, #ffeaa0)", border: "1.5px dashed #ffd700" }}
        >
          <div className="text-5xl mb-3">🐷</div>
          <div className="font-display text-lg font-bold">No savings yet!</div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {walletBalance > 0
              ? "You have money ready to save! Tap the button above to get started."
              : "Ask your parent to send you an allowance so you can start saving!"}
          </p>
          {walletBalance > 0 && (
            <button
              onClick={() => setShowSaveSheet(true)}
              className="rounded-2xl px-6 py-3 font-bold text-sm text-white shadow-soft active:scale-95 transition"
              style={{ background: "linear-gradient(135deg, #f9cc00, #ff9900)" }}
            >
              🐷 Start Saving Now
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {savingsPlans.map((plan) => {
            const date = new Date(plan.createdAt).toLocaleDateString();
            return (
              <div
                key={plan.id}
                className="rounded-3xl border overflow-hidden shadow-card"
                style={{
                  background: plan.status === "approved" ? "linear-gradient(135deg, #f0fdf4, #e8f5e9)" : "white",
                  borderColor: plan.status === "approved" ? "#c8e6c9" : plan.status === "rejected" ? "#ffcdd2" : "#f0f0f0",
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-card" style={{ background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)" }}>
                      💰
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base">{plan.savedAmount} SAR Saved</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Started {date} · from {plan.totalAllowance} SAR allowance</div>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg, #5cb85c, #3a8a3a)" }} />
                  </div>
                  <div className="text-xs font-bold text-primary">Committed ✓</div>
                </div>
                {plan.status === "active" && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => { submitSavingDone(plan.id); toast.success("💰 Request sent! Your parent will review it."); }}
                      className="w-full rounded-2xl py-3 font-bold text-sm text-white shadow-soft active:scale-[0.98] transition"
                      style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
                    >
                      ✅ Saved Successfully!
                    </button>
                  </div>
                )}
                {plan.status === "pending_approval" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm font-semibold text-amber-700" style={{ background: "#fffde7", border: "1.5px solid #ffd54f" }}>
                      ⏳ Waiting for your parent to confirm!
                    </div>
                  </div>
                )}
                {plan.status === "approved" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm font-bold text-green-700" style={{ background: "#f0fdf4", border: "1.5px solid #c8e6c9" }}>
                      🎉 Approved! Amazing saving habit!
                    </div>
                  </div>
                )}
                {plan.status === "rejected" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-2xl p-3 text-center text-sm text-red-600" style={{ background: "#fff5f5", border: "1.5px solid #ffcdd2" }}>
                      ❌ Not confirmed. Talk to your parent.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showSaveSheet && (
        <QuickSaveSheet
          walletBalance={walletBalance}
          onClose={() => setShowSaveSheet(false)}
          onSave={(amount) => {
            child.createSavingsPlan(walletBalance, amount);
            setShowSaveSheet(false);
            toast.success(`🐷 ${amount} SAR saved to your piggy bank!`);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <span className="text-xs font-bold text-green-700 bg-green-100 rounded-full px-2.5 py-1">✅</span>;
  if (status === "rejected") return <span className="text-xs font-bold text-red-600 bg-red-100 rounded-full px-2.5 py-1">❌</span>;
  if (status === "pending_approval") return <span className="text-xs font-bold text-amber-700 bg-amber-100 rounded-full px-2.5 py-1">⏳</span>;
  return <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1">Active</span>;
}

// ─────────────────────────────────────────
// Shop Tab — premium game card style
// ─────────────────────────────────────────
const CATEGORIES: { id: ShopItem["category"]; label: string; emoji: string; color: string; grad: string }[] = [
  { id: "buildings", label: "Buildings", emoji: "🏭", color: "#8B5A2B", grad: "linear-gradient(135deg,#d4882a,#8B5A2B)" },
  { id: "animals",   label: "Animals",   emoji: "🐄", color: "#5cb85c", grad: "linear-gradient(135deg,#7cd47c,#3d8b3d)" },
  { id: "crops",     label: "Crops",     emoji: "🌾", color: "#e6a34a", grad: "linear-gradient(135deg,#f4c060,#c07820)" },
  { id: "decorations", label: "Decor",   emoji: "🌸", color: "#ec6b6b", grad: "linear-gradient(135deg,#f88,#c0392b)" },
  { id: "tools",     label: "Tools",     emoji: "🛠️", color: "#6b7fd4", grad: "linear-gradient(135deg,#8090e8,#4455b0)" },
];

function ShopTab() {
  const child = useChild();
  const [cat, setCat] = useState<ShopItem["category"]>("buildings");
  const items = useMemo(() => SHOP_ITEMS.filter((i) => i.category === cat), [cat]);
  const activeCat = CATEGORIES.find((c) => c.id === cat)!;

  const purchase = (item: ShopItem) => {
    if (child.level < item.levelRequired) { toast.error(`Unlocks at Level ${item.levelRequired} 🔒`); return; }
    if (child.coins < item.price) { toast.error("Not enough coins! 🪙"); return; }
    const ok = child.buy(item);
    if (!ok) return;
    toast.success(`${item.icon} ${item.name} purchased!`);
    if (child.tutorialStep === 1 && item.id === "field") child.advanceTutorial(2);
    else if (child.tutorialStep === 2 && item.id === "corn-seeds") child.advanceTutorial(3);
  };

  return (
    <div className="pb-6">
      {/* Shop header banner */}
      <div
        className="px-5 pt-5 pb-4 mb-1"
        style={{ background: activeCat.grad, transition: "background 0.4s" }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-3xl">{activeCat.emoji}</span>
          <h2 className="font-display text-2xl font-bold text-white drop-shadow">Farm Shop</h2>
        </div>
        <p className="text-sm text-white/80">Buy, grow, decorate — build your dream farm!</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-3 no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className="shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            style={cat === c.id
              ? { background: c.grad, color: "white", boxShadow: `0 4px 14px ${c.color}50` }
              : { background: "#f5f5f5", color: "#666" }}
          >
            <span className="text-sm">{c.emoji}</span>{c.label}
          </button>
        ))}
      </div>

      {/* Item cards */}
      <div className="grid grid-cols-2 gap-3 px-5">
        {items.map((item) => {
          const locked = child.level < item.levelRequired;
          const cantAfford = child.coins < item.price;
          const isHighlighted = (child.tutorialStep === 1 && item.id === "field") || (child.tutorialStep === 2 && item.id === "corn-seeds");
          return (
            <div
              key={item.id}
              className="rounded-3xl overflow-hidden shadow-card transition-all"
              style={{
                background: "white",
                border: isHighlighted ? "2.5px solid #69b072" : "1.5px solid #f0f0f0",
                opacity: locked ? 0.75 : 1,
                outline: isHighlighted ? "2.5px solid #69b072" : "none",
                outlineOffset: 1,
              }}
            >
              {/* Illustration area */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  height: 90,
                  background: locked
                    ? "linear-gradient(135deg, #f0f0f0, #e0e0e0)"
                    : `linear-gradient(135deg, ${activeCat.color}22, ${activeCat.color}10)`,
                }}
              >
                <span className="text-6xl" style={{ filter: locked ? "grayscale(70%) opacity(0.6)" : "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>
                  {item.icon}
                </span>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-none" style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(2px)" }}>
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold shadow-card" style={{ background: "white" }}>
                      <Lock className="h-3 w-3 text-amber-600" /> <span className="text-amber-700">Lv {item.levelRequired}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-3">
                <div className="font-bold text-sm mb-0.5 leading-tight">{item.name}</div>
                <div className="flex items-center gap-1 text-xs text-amber-700 font-semibold mb-2.5">
                  <span>🪙</span>
                  <span className="tabular-nums">{item.price}</span>
                </div>
                <button
                  disabled={locked || cantAfford}
                  onClick={() => purchase(item)}
                  className="w-full rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: locked ? "#ccc"
                      : cantAfford ? "#ddd"
                      : activeCat.grad,
                    color: (cantAfford && !locked) ? "#888" : "white",
                    boxShadow: (!locked && !cantAfford) ? `0 3px 10px ${activeCat.color}40` : "none",
                  }}
                >
                  {locked ? "🔒 Locked" : cantAfford ? "Need coins" : "Buy Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Character Tab
// ─────────────────────────────────────────
function CharacterTab() {
  const { avatar, name, level, xp, coins, signOut, setState: setChildState } = useChild();
  const navigate = useNavigate();
  if (!avatar) return null;

  const xpInLevel = xp % 100;
  const xpToNext = 100;

  return (
    <div className="px-5 pt-5 pb-6">
      <div
        className="rounded-3xl p-6 flex flex-col items-center shadow-card relative overflow-hidden mb-5"
        style={{ background: "linear-gradient(160deg, #87CEEB 0%, #b0e8f5 45%, #c8f0c0 100%)" }}
      >
        <div className="absolute top-4 right-6 text-3xl opacity-50">☀️</div>
        <div className="absolute bottom-4 left-4 text-2xl opacity-40" style={{ animation: "flowerSway1 3s ease-in-out infinite alternate" }}>🌻</div>
        <div className="absolute bottom-4 right-4 text-2xl opacity-40" style={{ animation: "flowerSway2 2.5s ease-in-out infinite alternate" }}>🌾</div>

        <div className="rounded-full p-3 mb-2 shadow-card" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(8px)" }}>
          <ChildAvatar a={avatar} size={130} />
        </div>
        <div className="font-display text-2xl font-bold mt-1">{name}</div>
        <div className="text-sm text-muted-foreground mt-0.5">Little Farmer 🌱</div>

        <div className="mt-4 flex gap-3">
          <div className="rounded-2xl px-4 py-2 flex items-center gap-2 shadow-card" style={{ background: "rgba(255,255,255,0.8)" }}>
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="font-bold text-sm">Level {level}</span>
          </div>
          <div className="rounded-2xl px-4 py-2 flex items-center gap-2 shadow-card" style={{ background: "rgba(255,255,255,0.8)" }}>
            <span>🪙</span>
            <span className="font-bold text-sm tabular-nums">{coins.toLocaleString()}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4 w-full">
          <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "rgba(0,0,0,0.5)" }}>
            <span>⭐ {xp} XP total</span>
            <span>{xpInLevel}/{xpToNext} to Lv {level + 1}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.4)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(xpInLevel / xpToNext) * 100}%`, background: "linear-gradient(90deg, #ffd700, #ff9900)" }} />
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate({ to: "/child/create" })}
        className="w-full rounded-2xl py-4 font-bold text-sm border-2 border-primary text-primary bg-primary/5 hover:bg-primary/10 transition mb-3"
      >
        ✏️ Edit Character
      </button>

      <button
        onClick={() => { signOut(); navigate({ to: "/" }); }}
        className="w-full rounded-2xl py-4 font-bold text-sm bg-card border border-border text-muted-foreground hover:bg-secondary transition flex items-center justify-center gap-2 mb-5"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>

      {/* ── Demo Reset ───────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "#fff8f0", border: "1.5px dashed #ffcc80" }}
      >
        <div className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">🎬 Demo Tools</div>
        <p className="text-xs text-muted-foreground mb-3">Reset the allowance flow so you can run the demo again from the start.</p>
        <button
          onClick={() => {
            setChildState({
              pendingAllowance: null,
              mailboxCount: 0,
              goals: [],
              savingsPlans: [],
              pendingRewardChest: null,
            });
            toast.success("🔄 Allowance demo reset! Ready to replay.");
          }}
          className="w-full rounded-xl py-3 font-bold text-sm active:scale-[0.98] transition"
          style={{ background: "#fff3e0", color: "#e65100", border: "1.5px solid #ffcc80" }}
        >
          🔄 Reset Allowance Demo
        </button>
      </div>

      <style>{`
        @keyframes flowerSway1 { from{transform:rotate(-5deg)} to{transform:rotate(5deg)} }
        @keyframes flowerSway2 { from{transform:rotate(4deg)} to{transform:rotate(-4deg)} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Guide Dialog
// ─────────────────────────────────────────
function GuideDialog({ title, lines, cta, onClose }: { title: string; lines: string[]; cta: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl p-6 shadow-card" style={{ background: "white", animation: "dialogPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl shadow-card" style={{ background: "linear-gradient(135deg, #f5e6c8, #e8c98a)" }}>🧑‍🌾</div>
          <div>
            <h3 className="font-display text-xl font-bold leading-tight">{title}</h3>
            <div className="text-xs font-semibold text-primary mt-0.5">Farmer Benny</div>
          </div>
        </div>
        <div className="rounded-2xl p-4 space-y-2 mb-4" style={{ background: "#f8fdf8", border: "1.5px solid #c8e6c9" }}>
          {lines.map((line, i) => <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>)}
        </div>
        <button onClick={onClose} className="w-full rounded-2xl py-3.5 font-bold text-white shadow-soft transition active:scale-[0.98]" style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}>
          {cta}
        </button>
      </div>
      <style>{`@keyframes dialogPop { from{transform:scale(0.8) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Tutorial Guide bar
// ─────────────────────────────────────────
function TutorialGuide({ step, setTab }: { step: number; setTab: (t: Tab) => void }) {
  const hints: Record<number, { emoji: string; text: string; action: { label: string; tab: Tab } }> = {
    1: { emoji: "🏗️", text: "Mission 1: Go to the Shop and buy your first Field!", action: { label: "Open Shop →", tab: "shop" } },
    2: { emoji: "🌽", text: "Mission 2: Buy Corn Seeds in the Shop → Crops!", action: { label: "Open Shop →", tab: "shop" } },
    3: { emoji: "🌱", text: "Mission 3: Tap the empty brown field to plant corn!", action: { label: "Go to Farm →", tab: "farm" } },
    4: { emoji: "🧺", text: "Mission 4: Tap the corn field again to harvest!", action: { label: "Go to Farm →", tab: "farm" } },
  };
  const hint = hints[step];
  if (!hint) return null;

  return (
    <div className="fixed left-0 right-0 bottom-20 z-40 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <div className="rounded-2xl p-3 flex items-center gap-3 shadow-card" style={{ background: "linear-gradient(135deg, #fffde7, #fff9c4)", border: "2px solid #ffd54f", boxShadow: "0 6px 20px rgba(255,213,79,0.35)" }}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl shadow-card" style={{ background: "linear-gradient(135deg, #f5e6c8, #e8c98a)" }}>🧑‍🌾</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Farmer Benny says:</div>
            <p className="text-xs font-semibold text-foreground leading-snug">{hint.text}</p>
          </div>
          <button onClick={() => setTab(hint.action.tab)} className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-soft active:scale-95 transition" style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}>
            {hint.action.label}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Allowance Envelope Overlay
// ─────────────────────────────────────────
function AllowanceEnvelopeOverlay({ amount, onContinue, onLater }: { amount: number; onContinue: () => void; onLater: () => void }) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("opening"), 400);
    const t2 = setTimeout(() => setStage("open"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: "linear-gradient(180deg, rgba(135,206,235,0.95) 0%, rgba(110,180,100,0.95) 100%)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm" style={{ animation: "dialogPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="flex items-start gap-3 mb-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl shadow-card" style={{ background: "linear-gradient(135deg, #f5e6c8, #e8c98a)" }}>🧑‍🌾</div>
          <div className="rounded-2xl p-3 flex-1 shadow-card" style={{ background: "white" }}>
            <div className="text-xs font-bold text-primary mb-0.5">Farmer Benny</div>
            <p className="text-sm font-semibold">Good news! Your allowance has arrived! 🎉</p>
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div style={{ fontSize: stage === "closed" ? 80 : stage === "opening" ? 100 : 90, transition: "font-size 0.4s ease", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.25))", animation: stage === "closed" ? "envelopeBounce 0.6s ease-in-out infinite alternate" : "none" }}>
            {stage === "closed" ? "✉️" : stage === "opening" ? "📨" : "📩"}
          </div>

          {stage === "open" && (
            <div className="mt-4 rounded-3xl p-6 text-center shadow-card" style={{ background: "white", animation: "letterPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both", border: "3px solid #ffd700" }}>
              <div className="text-5xl mb-2">💵</div>
              <p className="text-base text-muted-foreground font-semibold">You received</p>
              <p className="font-display text-4xl font-bold mt-1" style={{ color: "#4a9e4a" }}>{amount} SAR</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium">from your parent! 🎉</p>
            </div>
          )}
        </div>

        {stage === "open" && (
          <div className="space-y-3">
            <button onClick={onContinue} className="w-full rounded-2xl py-4 font-bold text-white shadow-soft active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}>
              What would you like to do? →
            </button>
            <button onClick={onLater} className="w-full rounded-2xl py-3 font-semibold text-sm border border-white/60 text-white/90 bg-white/20 active:scale-[0.98] transition">
              I'll decide later 🕐
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes envelopeBounce { from{transform:translateY(0) rotate(-3deg)} to{transform:translateY(-10px) rotate(3deg)} }
        @keyframes letterPop { from{transform:scale(0.7) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes dialogPop { from{transform:scale(0.8) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Allowance Decision Overlay
// ─────────────────────────────────────────
function AllowanceDecisionOverlay({ amount, onGoal, onSave, onLater }: { amount: number; onGoal: () => void; onSave: () => void; onLater: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-0" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
      <div className="w-full rounded-t-3xl p-6 pb-8 shadow-card" style={{ background: "white", animation: "slideUp 0.4s cubic-bezier(0.34,1.1,0.64,1) both" }}>
        <div className="flex items-start gap-3 mb-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-card" style={{ background: "linear-gradient(135deg, #f5e6c8, #e8c98a)" }}>🧑‍🌾</div>
          <div>
            <div className="text-xs font-bold text-primary">Farmer Benny</div>
            <h3 className="font-display text-lg font-bold leading-tight">What would you like to do with your <span style={{ color: "#4a9e4a" }}>{amount} SAR</span>?</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button onClick={onGoal} className="rounded-3xl p-4 flex flex-col items-center text-center shadow-card active:scale-[0.97] transition" style={{ background: "linear-gradient(135deg, #fff9e6, #ffeaa0)", border: "2px solid #ffd700" }}>
            <div className="text-4xl mb-2">🎯</div>
            <div className="font-bold text-sm leading-tight mb-1">Create a Financial Goal</div>
            <div className="text-[11px] text-muted-foreground leading-snug">Save your money for something you really want.</div>
          </button>

          <button onClick={onSave} className="rounded-3xl p-4 flex flex-col items-center text-center shadow-card active:scale-[0.97] transition" style={{ background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)", border: "2px solid #69b072" }}>
            <div className="text-4xl mb-2">💰</div>
            <div className="font-bold text-sm leading-tight mb-1">Save Part of It</div>
            <div className="text-[11px] text-muted-foreground leading-snug">Start building a healthy saving habit.</div>
          </button>
        </div>

        <button onClick={onLater} className="w-full rounded-2xl py-3 font-semibold text-sm text-muted-foreground bg-secondary active:bg-muted transition">
          I'll decide later 🕐
        </button>
      </div>
      <style>{`@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Goal Templates Overlay
// ─────────────────────────────────────────
const GOAL_TEMPLATES = [
  { name: "Bicycle", icon: "🚲", targetAmount: 500, description: "Ride into adventure!" },
  { name: "Gaming Console", icon: "🎮", targetAmount: 1500, description: "Level up your fun!" },
  { name: "Books", icon: "📚", targetAmount: 150, description: "Expand your world!" },
  { name: "Gift", icon: "🎁", targetAmount: 200, description: "Something special!" },
  { name: "Trip", icon: "✈️", targetAmount: 1000, description: "Explore new places!" },
];

function GoalTemplatesOverlay({ onSelect, onBack }: { onSelect: (t: { name: string; icon: string; targetAmount: number }) => void; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "linear-gradient(180deg, #87CEEB 0%, #c5f0b0 100%)" }}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-xl bg-white/40 text-xl active:scale-95 transition">←</button>
        <div>
          <h2 className="font-display text-xl font-bold">Create a Goal 🎯</h2>
          <p className="text-xs text-foreground/70">What are you saving for?</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {GOAL_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => onSelect(tpl)}
              className="rounded-3xl p-4 flex flex-col items-center text-center shadow-card active:scale-[0.96] transition"
              style={{ background: "white", border: "2px solid rgba(255,255,255,0.8)" }}
            >
              <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))" }}>{tpl.icon}</div>
              <div className="font-bold text-sm">{tpl.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{tpl.description}</div>
              <div className="mt-2 text-xs font-bold text-primary">{tpl.targetAmount} SAR</div>
            </button>
          ))}
          <button
            onClick={() => onSelect({ name: "", icon: "✨", targetAmount: 0 })}
            className="rounded-3xl p-4 flex flex-col items-center text-center shadow-card active:scale-[0.96] transition"
            style={{ background: "white", border: "2px dashed #69b072" }}
          >
            <div className="text-5xl mb-2">➕</div>
            <div className="font-bold text-sm">Create My Own</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Name it yourself!</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Goal Form Overlay
// ─────────────────────────────────────────
function GoalFormOverlay({ template, allowance, onCreate, onBack }: { template: { name: string; icon: string; targetAmount: number } | null; allowance: number; onCreate: (d: { name: string; icon: string; targetAmount: number; targetDate?: string }) => void; onBack: () => void }) {
  const isCustom = !template?.name;
  const [name, setName] = useState(template?.name ?? "");
  const [icon, setIcon] = useState(template?.icon ?? "✨");
  const [target, setTarget] = useState<number | "">(template?.targetAmount || "");
  const [date, setDate] = useState("");

  const canSave = name.trim() && Number(target) > 0;
  const ICON_OPTIONS = ["🚲", "🎮", "📚", "🎁", "✈️", "👟", "🎨", "🎸", "⚽", "🏊", "🎪", "🌍"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-xl active:scale-95 transition">←</button>
        <div>
          <h2 className="font-display text-xl font-bold">{isCustom ? "My Custom Goal" : template?.name} {icon}</h2>
          <p className="text-xs text-muted-foreground">You have {allowance} SAR to start with</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {isCustom && (
          <>
            <label className="block">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Goal Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Bike" className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm outline-none font-medium" />
            </label>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Choose an Icon</div>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((ic) => (
                  <button key={ic} onClick={() => setIcon(ic)} className="text-2xl rounded-xl p-2 transition active:scale-90" style={{ background: icon === ic ? "#e8f5e9" : "#f5f5f5", border: icon === ic ? "2px solid #69b072" : "2px solid transparent" }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <label className="block">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Target Amount (SAR)</div>
          <input type="number" value={target} onChange={(e) => setTarget(e.target.value === "" ? "" : Number(e.target.value))} placeholder="e.g. 500" className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm outline-none font-medium" />
        </label>

        <label className="block">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Target Date (optional)</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-2xl bg-secondary px-4 py-3.5 text-sm outline-none font-medium" />
        </label>

        {canSave && (
          <div className="rounded-3xl p-4 shadow-card" style={{ background: "linear-gradient(135deg, #f0fdf4, #e8f5e9)", border: "1.5px solid #c8e6c9" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">{icon}</div>
              <div>
                <div className="font-bold">{name || template?.name}</div>
                <div className="text-xs text-muted-foreground">Goal: {Number(target)} SAR</div>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-white overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (allowance / Number(target)) * 100)}%`, background: "linear-gradient(90deg, #69b072, #4a9e4a)" }} />
            </div>
            <div className="text-xs text-primary font-bold mt-1">Starting with {allowance} SAR — {Math.round((allowance / Number(target)) * 100)}% already!</div>
          </div>
        )}
      </div>

      <div className="px-5 pb-8 pt-3 border-t border-border">
        <button
          disabled={!canSave}
          onClick={() => onCreate({ name: name || template?.name || "", icon, targetAmount: Number(target), targetDate: date || undefined })}
          className="w-full rounded-2xl py-4 font-bold text-white shadow-soft active:scale-[0.98] transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
        >
          💾 Save Goal
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Saving Amount Overlay
// ─────────────────────────────────────────
function SavingAmountOverlay({ allowance, onSave, onBack }: { allowance: number; onSave: (amount: number) => void; onBack: () => void }) {
  const [amount, setAmount] = useState(allowance);
  const presets = [Math.round(allowance * 0.25), Math.round(allowance * 0.5), Math.round(allowance * 0.75), allowance].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "linear-gradient(180deg, #87CEEB 0%, #c5f0b0 100%)" }}>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-xl bg-white/40 text-xl active:scale-95 transition">←</button>
        <div>
          <h2 className="font-display text-xl font-bold">Save Part of It 💰</h2>
          <p className="text-xs text-foreground/70">You received {allowance} SAR</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 space-y-6">
        <div className="flex items-start gap-3 w-full">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-card" style={{ background: "linear-gradient(135deg, #f5e6c8, #e8c98a)" }}>🧑‍🌾</div>
          <div className="rounded-2xl p-3 flex-1 shadow-card" style={{ background: "white" }}>
            <div className="text-xs font-bold text-primary mb-0.5">Farmer Benny</div>
            <p className="text-sm font-semibold">How much would you like to save?</p>
          </div>
        </div>

        <div className="rounded-3xl p-6 w-full text-center shadow-card" style={{ background: "white" }}>
          <div className="font-display text-6xl font-bold mb-1" style={{ color: "#4a9e4a" }}>{amount}</div>
          <div className="text-lg text-muted-foreground font-semibold">SAR</div>
          <input type="range" min={1} max={allowance} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-4 accent-primary" />
          <div className="flex gap-2 justify-center mt-3">
            {presets.map((v) => (
              <button key={v} onClick={() => setAmount(v)} className="rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-90" style={{ background: amount === v ? "#69b072" : "#f0f0f0", color: amount === v ? "white" : "#666" }}>
                {v} SAR
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-7xl mb-2" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.2))", animation: "piggyBounce 1.5s ease-in-out infinite alternate" }}>🐷</div>
          <p className="text-sm font-semibold text-white/90">Saving {amount} SAR out of {allowance} SAR</p>
        </div>
      </div>

      <div className="px-5 pb-8 pt-3">
        <button onClick={() => onSave(amount)} className="w-full rounded-2xl py-4 font-bold text-white shadow-soft active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}>
          🐷 Start Saving!
        </button>
      </div>

      <style>{`@keyframes piggyBounce { from{transform:scale(1)} to{transform:scale(1.08) translateY(-4px)} }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────
// Reward Chest Overlay
// ─────────────────────────────────────────
function RewardChestOverlay({ chest, chestOpen, onTapChest, onCollect }: { chest: RewardChest; chestOpen: boolean; onTapChest: () => void; onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; icon: string }[]>([]);

  const handleTap = () => {
    if (chestOpen) return;
    onTapChest();
    const emojis = ["⭐", "🪙", "✨", "💫", "🌟"];
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 35 + Math.random() * 20,
      icon: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1200);
  };

  const handleCollect = () => {
    setCollected(true);
    setTimeout(() => { onCollect(); setCollected(false); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,215,0,0.35) 0%, rgba(0,0,0,0.75) 100%)", backdropFilter: "blur(8px)" }}>
      {particles.map((p) => (
        <div key={p.id} className="absolute pointer-events-none text-2xl" style={{ left: `${p.x}%`, top: `${p.y}%`, animation: "chestParticle 1s ease-out forwards", animationDelay: `${Math.random() * 0.1}s` }}>
          {p.icon}
        </div>
      ))}

      <div className="w-full max-w-xs text-center" style={{ animation: "dialogPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="mb-2">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">🧑‍🌾 Farmer Benny</div>
          <h2 className="font-display text-2xl font-bold text-white">A reward chest!</h2>
          {!chestOpen && <p className="text-white/80 text-sm mt-1">Tap the chest to open it!</p>}
        </div>

        <button onClick={handleTap} disabled={chestOpen} className="my-6 active:scale-90 transition-transform" style={{ display: "block", margin: "24px auto" }}>
          <div style={{ fontSize: 100, filter: chestOpen ? "drop-shadow(0 0 30px rgba(255,215,0,0.9))" : "drop-shadow(0 8px 20px rgba(0,0,0,0.4))", animation: chestOpen ? "none" : "chestShake 1.5s ease-in-out infinite", transition: "filter 0.3s" }}>
            {chestOpen ? "🎁" : "📦"}
          </div>
        </button>

        {chestOpen && (
          <div className="rounded-3xl p-6 mb-5 shadow-card" style={{ background: "white", animation: "letterPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div className="text-6xl mb-3" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>{chest.icon}</div>
            <div className="font-display text-xl font-bold">{chest.label}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {chest.type === "coins" && "Added to your farm wallet!"}
              {chest.type === "xp" && "You're leveling up!"}
              {chest.type === "seeds" && "Plant them on your farm!"}
              {chest.type === "animal" && "A new friend on your farm!"}
              {chest.type === "decoration" && "Decorate your farm!"}
              {chest.type === "vehicle" && "Drive it around your farm!"}
            </p>
          </div>
        )}

        {chestOpen && (
          <button onClick={handleCollect} className="w-full rounded-2xl py-4 font-bold text-white shadow-soft active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #ffd700, #ff9900)", opacity: collected ? 0 : 1, transition: "opacity 0.3s" }}>
            🎉 Collect Reward!
          </button>
        )}
      </div>

      <style>{`
        @keyframes dialogPop { from{transform:scale(0.8) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes letterPop { from{transform:scale(0.7) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes chestShake {
          0%,100%{transform:rotate(0deg) scale(1)} 20%{transform:rotate(-8deg) scale(1.05)}
          40%{transform:rotate(8deg) scale(1.05)} 60%{transform:rotate(-4deg) scale(1.02)} 80%{transform:rotate(4deg) scale(1.02)}
        }
        @keyframes chestParticle {
          0%{transform:translate(0,0) scale(1);opacity:1}
          100%{transform:translate(calc((var(--i,0) - 6) * 15px),-80px) scale(0.5);opacity:0}
        }
      `}</style>
    </div>
  );
}

// ── Log Spend Overlay ────────────────────────────────────────────────────────

import type { CategoryLimit } from "@/lib/child-store";

function LogSpendOverlay({
  categories,
  onLog,
  onClose,
}: {
  categories: CategoryLimit[];
  onLog: (categoryId: string, categoryName: string, amount: number, note?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = categories.find((c) => c.id === selectedId);
  const canSubmit = selected && Number(amount) > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !canSubmit) return;
    setLoading(true);
    await onLog(selected.id, selected.name, Number(amount), note.trim() || undefined);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl p-6 pb-10"
        style={{ background: "white", animation: "slideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl font-bold">Log Spending 💸</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tell your parent what you spent money on</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Category picker */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedId(cat.id)}
                  className={`rounded-2xl px-3 py-3 text-sm font-semibold text-left transition border-2 ${
                    selectedId === cat.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-secondary text-foreground"
                  }`}
                >
                  {cat.name}
                  {cat.amount > 0 && (
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">
                      Budget: {cat.amount} SAR
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Amount (SAR)
            </label>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent outline-none text-2xl font-display font-bold"
                autoFocus
              />
              <span className="text-sm font-semibold text-muted-foreground">SAR</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              What did you buy? <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Chips from the school shop"
              className="w-full rounded-2xl bg-secondary px-4 py-3.5 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Log Spending ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}
