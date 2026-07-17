import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/parent/requests")({
  head: () => ({ meta: [{ title: "Pending Requests — Farmily" }] }),
  component: Requests,
});

function Requests() {
  const { requests, children, approveRequest, rejectRequest } = useFarmily();

  return (
    <MobileFrame>
      <TopBar title="Pending Requests" />
      <div className="px-5 pt-4 pb-10">
        <p className="text-sm text-muted-foreground mb-4">
          Rewards inside the game are only granted after your approval.
        </p>

        {requests.length === 0 ? (
          <div className="rounded-3xl bg-card border border-dashed border-border p-12 text-center">
            <div className="text-5xl mb-3">🌾</div>
            <div className="font-semibold">All caught up!</div>
            <p className="text-sm text-muted-foreground mt-1">No pending requests right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const child = children.find((c) => c.id === r.childId);
              const isSavings = r.type === "savings";
              return (
                <div key={r.id} className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-2xl shrink-0">
                        {child?.avatar ?? "🧒"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{r.childName} says</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-secondary p-3.5 text-sm">
                      "{r.message}"
                    </div>
                    {r.amount && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Amount saved: <span className="font-semibold text-foreground">{r.amount} SAR</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 border-t border-border">
                    <button
                      onClick={() => { rejectRequest(r.id); toast("Request declined."); }}
                      className="flex items-center justify-center gap-1.5 py-3 font-semibold text-sm text-berry hover:bg-berry/5"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => { approveRequest(r.id); toast.success(isSavings ? "Confirmed! Reward granted." : "Approved! Reward granted."); }}
                      className="flex items-center justify-center gap-1.5 py-3 font-semibold text-sm text-primary hover:bg-primary/5 border-l border-border"
                    >
                      <Check className="h-4 w-4" /> {isSavings ? "Confirm" : "Approve"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
