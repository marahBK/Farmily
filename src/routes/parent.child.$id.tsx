import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { Lock, Send } from "lucide-react";

export const Route = createFileRoute("/parent/child/$id")({
  head: () => ({ meta: [{ title: "Child Profile — Farmily" }] }),
  component: ChildDetail,
  notFoundComponent: () => (
    <MobileFrame>
      <TopBar title="Not found" />
      <div className="p-10 text-center text-sm text-muted-foreground">Child not found.</div>
    </MobileFrame>
  ),
});

function ChildDetail() {
  const { id } = Route.useParams();
  const { children, allowances } = useFarmily();
  const child = children.find((c) => c.id === id);
  if (!child) throw notFound();

  const childAllowances = allowances.filter((a) => a.childId === child.id).slice(0, 5);

  return (
    <MobileFrame>
      <TopBar title={`${child.name}'s Profile`} />
      <div className="pb-10">
        {/* Avatar hero */}
        <div className="farm-gradient pt-10 pb-8 flex flex-col items-center">
          <div className="text-8xl mb-3" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>
            {child.avatar}
          </div>
          <h2 className="font-display text-2xl font-bold">{child.name}</h2>
          <div className="mt-2 rounded-full bg-background px-5 py-2 shadow-card">
            <span className="font-display text-xl font-bold">{child.balance}</span>
            <span className="text-sm font-semibold text-muted-foreground ml-1">SAR balance</span>
          </div>
        </div>

        <div className="px-5 mt-5">
          <div className="flex items-start gap-2 rounded-2xl bg-sky/30 text-sky-foreground p-3.5 text-xs">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              You're in supervision mode. Only {child.name} can build or decorate their farm.
            </div>
          </div>
        </div>

        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold">Recent Allowances</h3>
            <Link to="/parent/allowance" className="text-sm font-medium text-primary flex items-center gap-1">
              <Send className="h-3.5 w-3.5" /> Send
            </Link>
          </div>

          {childAllowances.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No allowances sent yet.
            </div>
          ) : (
            <div className="space-y-2">
              {childAllowances.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-lg shrink-0">💚</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{a.amount} SAR</div>
                    <div className="text-xs text-muted-foreground truncate">{a.note ?? "Allowance"}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(a.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileFrame>
  );
}
