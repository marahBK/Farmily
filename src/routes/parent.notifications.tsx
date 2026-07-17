import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { toast } from "sonner";
import { CheckCircle2, X } from "lucide-react";

export const Route = createFileRoute("/parent/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Farmily" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { notifications, requests, children, markAllRead, approveRequest, rejectRequest } = useFarmily();

  useEffect(() => {
    const t = setTimeout(() => markAllRead(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <MobileFrame>
      <TopBar title="Notifications" />
      <div className="px-5 pt-4 pb-10">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              // Find the matching pending request (if any)
              const linkedRequest = n.requestId
                ? requests.find((r) => r.id === n.requestId)
                : undefined;
              const isSavings = linkedRequest?.type === "savings";
              const childAvatar = linkedRequest
                ? children.find((c) => c.id === linkedRequest.childId)?.avatar
                : undefined;

              return (
                <div
                  key={n.id}
                  className={`rounded-3xl border overflow-hidden shadow-card ${
                    n.read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="grid h-10 w-10 place-items-center rounded-xl text-xl shrink-0"
                        style={{
                          background: linkedRequest
                            ? isSavings
                              ? "linear-gradient(135deg,#fffde7,#ffd54f)"
                              : "linear-gradient(135deg,#e8f5e9,#a5d6a7)"
                            : "var(--primary-10, #e8f5e9)",
                        }}
                      >
                        {linkedRequest
                          ? isSavings
                            ? "🐷"
                            : "🎯"
                          : "🔔"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm">
                          {childAvatar ? `${childAvatar} ` : ""}{n.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                        {linkedRequest?.amount != null && (
                          <div className="text-xs font-semibold text-primary mt-1">
                            💰 {linkedRequest.amount} SAR
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approve / Reject — only shown when request is still pending */}
                  {linkedRequest && (
                    <div className="grid grid-cols-2 border-t border-border">
                      <button
                        onClick={() => {
                          rejectRequest(linkedRequest.id);
                          toast("Request declined.");
                        }}
                        className="flex items-center justify-center gap-1.5 py-3.5 font-semibold text-sm text-red-500 hover:bg-red-50 active:scale-[0.98] transition"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                      <button
                        onClick={() => {
                          approveRequest(linkedRequest.id);
                          toast.success(isSavings ? "💰 Saving confirmed!" : "🎯 Goal approved!");
                        }}
                        className="flex items-center justify-center gap-1.5 py-3.5 font-semibold text-sm text-primary hover:bg-primary/5 border-l border-border active:scale-[0.98] transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSavings ? "Confirm" : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
