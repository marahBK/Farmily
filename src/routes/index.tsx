import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/farm-hero.jpg";
import { MobileFrame } from "@/components/MobileFrame";
import { Sprout } from "lucide-react";
import { Clapperboard } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farmily — Grow Money Skills as a Family" },
      { name: "description", content: "Welcome to Farmily. Parents supervise; kids build their farm while learning to save, budget, and grow." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <MobileFrame>
      <div className="farm-gradient min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">Farmily</span>
          </div>

          <div className="relative w-full max-w-sm aspect-square rounded-[2rem] overflow-hidden shadow-card bg-white">
            <img
              src={heroImg}
              alt="Cheerful cartoon farm with barn, animals and sunflowers"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-8 text-center max-w-xs">
            <h1 className="font-display text-3xl font-bold leading-tight">
              Grow money skills, <span className="text-primary">together</span>.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              A playful farm where children learn to save, and parents cheer them on.
            </p>
          </div>
        </div>

        <div className="p-6 pb-10 space-y-3">
          <Link
            to="/parent/login"
            className="block w-full rounded-2xl bg-primary text-primary-foreground text-center py-4 font-semibold shadow-soft hover:brightness-105 active:scale-[0.99] transition"
          >
            I'm a Parent
          </Link>
          <Link
            to="/child"
            className="block w-full rounded-2xl bg-sky text-sky-foreground text-center py-4 font-semibold shadow-soft hover:brightness-105 active:scale-[0.99] transition"
          >
            I'm a Child
          </Link>
          <Link
            to="/demo"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 font-semibold text-sm border-2 border-dashed border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 active:scale-[0.99] transition"
          >
            <Clapperboard className="h-4 w-4" />
            Hackathon Demo Mode
          </Link>
        </div>
      </div>
    </MobileFrame>
  );
}
