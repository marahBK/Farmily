import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useChild } from "@/lib/child-store";
import { getStoredChildren, type Child } from "@/lib/farmily-store";
import { hashText } from "@/lib/auth";
import { toast } from "sonner";
import { ChevronLeft, Delete } from "lucide-react";

export const Route = createFileRoute("/child/")({
  head: () => ({ meta: [{ title: "Kids Sign In — Farmily" }] }),
  component: ChildLogin,
});

type Step = "pick-profile" | "enter-pin";

function ChildLogin() {
  const { signIn } = useChild();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("pick-profile");
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch children from DB on mount
  useEffect(() => {
    getStoredChildren().then(setChildren).catch(() => setChildren([]));
  }, []);

  const pickProfile = (child: Child) => {
    setSelected(child);
    setPin("");
    setStep("enter-pin");
  };

  const pressDigit = (d: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + d);
  };

  const backspace = () => setPin((p) => p.slice(0, -1));

  // Auto-submit once 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const verify = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const hash = await hashText(pin);
      if (hash === selected.pinHash) {
        signIn(selected.name, selected.id, selected.parentId, selected.categoryLimits, selected.balance);
        toast.success(`Welcome, ${selected.name}! 🌱`);
        navigate({ to: "/child/farm" });
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);
        toast.error("Wrong PIN — try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileFrame>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "linear-gradient(180deg, #87CEEB 0%, #b0e8f5 35%, #d4f5c0 65%, #a8e090 100%)" }}
      >
        {/* Sky illustration */}
        <div className="relative h-44 flex-shrink-0 overflow-hidden">
          <div
            className="absolute top-6 right-10 w-14 h-14 rounded-full"
            style={{ background: "radial-gradient(circle, #ffe066 30%, #ffaa00 100%)", boxShadow: "0 0 40px #ffd700" }}
          />
          <div className="absolute top-8 left-4 text-5xl opacity-90">☁️</div>
          <div className="absolute top-14 left-28 text-3xl opacity-70">☁️</div>
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-4 pb-2">
            <div className="text-6xl" style={{ filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.2))" }}>🏡</div>
            <div className="text-5xl mb-1">🌻</div>
            <div className="text-5xl">🌾</div>
            <div className="text-4xl mb-2">🐔</div>
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 bg-background rounded-t-[2rem] px-6 pt-6 pb-10 shadow-card">

          {step === "pick-profile" && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="grid h-14 w-14 place-items-center rounded-2xl mb-3 shadow-soft" style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}>
                  <span className="text-3xl">🌱</span>
                </div>
                <h1 className="font-display text-2xl font-bold">Who are you?</h1>
                <p className="text-sm text-muted-foreground mt-1">Pick your name to sign in</p>
              </div>

              {children.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="font-semibold">No profiles found</p>
                  <p className="mt-1 text-xs">Ask your parent to add you from the Family Dashboard first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => pickProfile(c)}
                      className="flex flex-col items-center gap-2 rounded-2xl p-4 border-2 border-transparent bg-secondary hover:border-primary hover:bg-primary/5 transition active:scale-[0.97]"
                    >
                      <div className="text-5xl">{c.avatar}</div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.balance} SAR</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8 text-center text-sm text-muted-foreground">
                Not a kid?{" "}
                <Link to="/parent/login" className="font-bold text-primary hover:underline">Parent sign in →</Link>
              </div>
            </>
          )}

          {step === "enter-pin" && selected && (
            <>
              <button
                onClick={() => { setStep("pick-profile"); setPin(""); }}
                className="flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-5 -ml-1"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="text-6xl mb-2">{selected.avatar}</div>
                <h2 className="font-display text-2xl font-bold">Hi, {selected.name}!</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your 4-digit PIN</p>
              </div>

              {/* PIN dots */}
              <div className={`flex justify-center gap-4 mb-8 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-full transition-all duration-150"
                    style={{
                      background: i < pin.length ? "#4a9e4a" : "#e0e0e0",
                      transform: i < pin.length ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => {
                  if (d === "") return <div key={i} />;
                  if (d === "⌫") return (
                    <button
                      key={i}
                      onClick={backspace}
                      disabled={loading}
                      className="h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 active:scale-[0.95] transition disabled:opacity-40"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                  );
                  return (
                    <button
                      key={i}
                      onClick={() => pressDigit(d)}
                      disabled={loading || pin.length >= 4}
                      className="h-16 rounded-2xl bg-card border border-border font-display text-2xl font-bold shadow-card hover:bg-secondary active:scale-[0.95] transition disabled:opacity-40"
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
    </MobileFrame>
  );
}
