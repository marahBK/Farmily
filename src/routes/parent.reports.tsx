import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileFrame } from "@/components/MobileFrame";
import { TopBar } from "@/components/TopBar";
import { useFarmily } from "@/lib/farmily-store";
import { apiGetSpending } from "@/lib/api/spending";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

type SpendingRow = {
  id: string; childId: string; childName: string;
  categoryId: string; categoryName: string;
  amount: number; note?: string; date: string;
};

export const Route = createFileRoute("/parent/reports")({
  head: () => ({ meta: [{ title: "Reports — Farmily" }] }),
  component: Reports,
});

const CATEGORY_COLORS = [
  "var(--color-primary)", "#38bdf8", "#facc15", "#f472b6", "#a78bfa", "#34d399", "#fb923c",
];

function Reports() {
  const { allowances, children, parent } = useFarmily();
  const [spending, setSpending] = useState<SpendingRow[]>([]);

  useEffect(() => {
    if (!parent?.id) return;
    apiGetSpending({ data: { parentId: parent.id } })
      .then((r) => setSpending(r.spending))
      .catch(() => {});
  }, [parent?.id]);

  // ── Weekly allowance chart ──
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const weekData = days.map((d) => {
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const total = allowances
      .filter((a) => { const t = new Date(a.date).getTime(); return t >= d.getTime() && t < next.getTime(); })
      .reduce((s, a) => s + a.amount, 0);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), amount: total };
  });

  // ── Spending per child per category ──
  const childSpendingData = children.map((child) => {
    const childSpends = spending.filter((s) => s.childId === child.id);
    const byCategory: Record<string, number> = {};
    for (const s of childSpends) {
      byCategory[s.categoryName] = (byCategory[s.categoryName] ?? 0) + s.amount;
    }
    const limits = child.categoryLimits ?? [];
    const allCategoryNames = Array.from(new Set([
      ...limits.map((l) => l.name),
      ...Object.keys(byCategory),
    ]));
    return {
      child,
      categories: allCategoryNames.map((name) => {
        const limit = limits.find((l) => l.name === name);
        const spent = byCategory[name] ?? 0;
        return {
          name,
          spent,
          limit: limit?.amount ?? 0,
          pct: limit?.amount ? Math.min(100, (spent / limit.amount) * 100) : null,
          over: limit?.amount ? spent > limit.amount : false,
        };
      }),
      totalSpent: Object.values(byCategory).reduce((s, v) => s + v, 0),
      monthlyAllowance: child.monthlyAllowance,
    };
  });

  // ── This month's overall spending by category (family-wide) ──
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSpending = spending.filter((s) => new Date(s.date) >= monthStart);
  const familyCats: Record<string, number> = {};
  for (const s of monthSpending) {
    familyCats[s.categoryName] = (familyCats[s.categoryName] ?? 0) + s.amount;
  }
  const familyCatList = Object.entries(familyCats)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  const familyTotal = familyCatList.reduce((s, c) => s + c.total, 0);

  return (
    <MobileFrame>
      <TopBar title="Reports" />
      <div className="px-5 pt-4 pb-10 space-y-5">

        {/* ── Weekly Allowance ── */}
        <ReportCard title="Weekly Allowance" subtitle={`${weekData.reduce((s, d) => s + d.amount, 0)} SAR sent in the last 7 days`}>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--secondary)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportCard>

        {/* ── Spending by Child & Category ── */}
        <ReportCard
          title="Spending by Category"
          subtitle="How much each child spent in each budget category"
        >
          {childSpendingData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No children added yet.</p>
          ) : childSpendingData.every((c) => c.categories.length === 0) ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">💸</div>
              <p className="text-sm text-muted-foreground">No spending recorded yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Children can log their spending from the farm.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {childSpendingData.map(({ child, categories, totalSpent, monthlyAllowance }, ci) => (
                <div key={child.id}>
                  {/* Child header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-xl shrink-0">
                      {child.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{child.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {totalSpent} SAR spent
                        {monthlyAllowance > 0 && ` · ${monthlyAllowance} SAR budget`}
                      </div>
                    </div>
                    {monthlyAllowance > 0 && (
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalSpent > monthlyAllowance ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {Math.round((totalSpent / monthlyAllowance) * 100)}%
                      </div>
                    )}
                  </div>

                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground ml-11 mb-1">No spending logged yet.</p>
                  ) : (
                    <div className="space-y-2.5 ml-11">
                      {categories.map((cat, i) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                              <span className="font-medium truncate max-w-[120px]">{cat.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`font-semibold ${cat.over ? "text-red-500" : "text-foreground"}`}>
                                {cat.spent} SAR
                              </span>
                              {cat.limit > 0 && (
                                <span className="text-muted-foreground">/ {cat.limit}</span>
                              )}
                            </div>
                          </div>
                          {cat.limit > 0 && (
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${cat.pct ?? 0}%`,
                                  background: cat.over
                                    ? "#ef4444"
                                    : CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {ci < childSpendingData.length - 1 && (
                    <div className="mt-4 border-t border-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ReportCard>

        {/* ── Family-wide category totals this month ── */}
        {familyCatList.length > 0 && (
          <ReportCard title="This Month's Breakdown" subtitle={`${familyTotal} SAR total across all children`}>
            <div className="space-y-2.5">
              {familyCatList.map((cat, i) => {
                const pct = familyTotal > 0 ? (cat.total / familyTotal) * 100 : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{Math.round(pct)}%</span>
                        <span className="font-semibold">{cat.total} SAR</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportCard>
        )}

        {/* ── Savings balance per child ── */}
        <ReportCard title="Savings Balance" subtitle="Current balance per child">
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No children yet.</p>
          ) : (
            <div className="space-y-3">
              {children.map((c, i) => {
                const max = Math.max(1, ...children.map((x) => x.balance));
                const pct = (c.balance / max) * 100;
                const tones = ["bg-primary", "bg-sky-400", "bg-yellow-400", "bg-pink-400"];
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span>{c.avatar}</span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold">{c.balance} SAR</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full ${tones[i % tones.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportCard>

      </div>
    </MobileFrame>
  );
}

function ReportCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card border border-border p-4 shadow-card">
      <div className="mb-3">
        <div className="font-display text-lg font-bold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
