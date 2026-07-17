import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { useChild, type Avatar } from "@/lib/child-store";
import { ChildAvatar } from "@/components/ChildAvatar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/child/create")({
  head: () => ({ meta: [{ title: "Create Your Farmer — Farmily" }] }),
  component: CreateCharacter,
});

const HAIR_STYLES = [
  { id: "short", label: "Short", emoji: "💇" },
  { id: "long", label: "Long", emoji: "👩" },
  { id: "curly", label: "Curly", emoji: "🌀" },
  { id: "cap", label: "Cap", emoji: "🧢" },
];
const HAIR_COLORS = ["#2b1d0e", "#6b3d1a", "#c9862a", "#e8a95a", "#e64a3a", "#3b3b3b", "#7B3F8C", "#1a6b8a"];
const CLOTHES_COLORS = ["#69b072", "#4a90e2", "#e6a34a", "#ec6b6b", "#a06bd0", "#f2c94c", "#e67e7e", "#5bc0de"];
const SHOE_COLORS = ["#3b3b3b", "#8b5a2b", "#ffffff", "#dc2626", "#1a5fa8", "#2d7a2d"];
const ACCESSORIES = [
  { id: "none", label: "None", emoji: "❌" },
  { id: "glasses", label: "Glasses", emoji: "👓" },
  { id: "hat", label: "Farm Hat", emoji: "👒" },
  { id: "bow", label: "Bow", emoji: "🎀" },
];

const STEPS = ["Gender", "Hair", "Outfit", "Accessories"];

function CreateCharacter() {
  const { saveAvatar, name } = useChild();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Avatar>({
    gender: "boy",
    hair: "short",
    hairColor: HAIR_COLORS[0],
    clothes: CLOTHES_COLORS[0],
    shoes: SHOE_COLORS[0],
    accessory: "none",
  });

  const start = () => {
    saveAvatar(a);
    navigate({ to: "/child/arrival" });
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <MobileFrame>
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #e8f5e9 0%, #f0fdf4 100%)" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎨</span>
            <h1 className="font-display text-xl font-bold">Create Your Farmer</h1>
          </div>
          <p className="text-sm text-muted-foreground">Design your unique character, {name}!</p>

          {/* Step dots */}
          <div className="flex items-center gap-2 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? "w-8 bg-primary"
                      : i < step
                      ? "w-2 bg-primary/60 cursor-pointer"
                      : "w-2 bg-border"
                  }`}
                />
              </div>
            ))}
            <span className="ml-2 text-xs font-semibold text-muted-foreground">
              {step + 1}/{STEPS.length} — {STEPS[step]}
            </span>
          </div>
        </div>

        {/* Avatar preview */}
        <div
          className="mx-5 rounded-3xl flex flex-col items-center py-6 shadow-card relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #87CEEB 0%, #b0e8f5 50%, #c8f0c0 100%)" }}
        >
          {/* Background farm decor */}
          <div className="absolute top-3 right-4 text-2xl opacity-60">☀️</div>
          <div className="absolute bottom-4 left-4 text-xl opacity-50">🌻</div>
          <div className="absolute bottom-4 right-4 text-xl opacity-50">🌾</div>

          {/* Avatar with bounce animation on change */}
          <div className="relative z-10">
            <div
              className="rounded-full p-3 shadow-card"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
            >
              <ChildAvatar a={a} size={130} />
            </div>
          </div>
          <div className="mt-3 font-display text-lg font-bold z-10">{name}</div>
          <div className="text-sm text-muted-foreground z-10 mt-0.5">Little Farmer 🌱</div>
        </div>

        {/* Step content */}
        <div className="flex-1 px-5 pt-5 pb-4">
          {step === 0 && (
            <StepSection title="👦 Who are you?" subtitle="Choose your character type">
              <div className="grid grid-cols-2 gap-3">
                {(["boy", "girl"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setA({ ...a, gender: g })}
                    className={`rounded-2xl py-5 text-center transition active:scale-95 border-2 ${
                      a.gender === g
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="text-4xl mb-1">{g === "boy" ? "👦" : "👧"}</div>
                    <div className="font-bold text-sm capitalize">{g}</div>
                  </button>
                ))}
              </div>
            </StepSection>
          )}

          {step === 1 && (
            <StepSection title="💇 Hair Style" subtitle="Pick your hairstyle and color">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {HAIR_STYLES.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setA({ ...a, hair: h.id })}
                    className={`rounded-2xl py-3 flex flex-col items-center gap-1 transition active:scale-95 border-2 ${
                      a.hair === h.id
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-xl">{h.emoji}</span>
                    <span className="text-[10px] font-bold">{h.label}</span>
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Hair Color</div>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setA({ ...a, hairColor: c })}
                    className={`h-11 w-11 rounded-full border-4 transition active:scale-95 ${
                      a.hairColor === c ? "border-primary scale-110 shadow-soft" : "border-white shadow-card"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 2 && (
            <StepSection title="👗 Outfit" subtitle="Choose clothes and shoes">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Clothes Color</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {CLOTHES_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setA({ ...a, clothes: c })}
                    className={`h-11 w-11 rounded-2xl border-4 transition active:scale-95 ${
                      a.clothes === c ? "border-primary scale-110 shadow-soft" : "border-white shadow-card"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Shoes Color</div>
              <div className="flex flex-wrap gap-2">
                {SHOE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setA({ ...a, shoes: c })}
                    className={`h-11 w-11 rounded-xl border-4 transition active:scale-95 ${
                      a.shoes === c ? "border-primary scale-110 shadow-soft" : "border-white shadow-card"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </StepSection>
          )}

          {step === 3 && (
            <StepSection title="✨ Accessories" subtitle="Add a finishing touch">
              <div className="grid grid-cols-2 gap-3">
                {ACCESSORIES.map((ac) => (
                  <button
                    key={ac.id}
                    onClick={() => setA({ ...a, accessory: ac.id })}
                    className={`rounded-2xl py-4 flex flex-col items-center gap-2 transition active:scale-95 border-2 ${
                      a.accessory === ac.id
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card"
                    }`}
                  >
                    <span className="text-3xl">{ac.emoji}</span>
                    <span className="font-semibold text-sm">{ac.label}</span>
                  </button>
                ))}
              </div>
            </StepSection>
          )}
        </div>

        {/* Navigation */}
        <div className="px-5 pb-6 pt-2 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-shrink-0 h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-card transition active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={isLastStep ? start : () => setStep(step + 1)}
            className="flex-1 rounded-2xl py-4 text-white font-bold text-base shadow-soft transition active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #69b072, #4a9e4a)" }}
          >
            {isLastStep ? (
              <>Start My Farm 🌱</>
            ) : (
              <>
                Next <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </MobileFrame>
  );
}

function StepSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
