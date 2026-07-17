import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

export const apiSignUp = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      fullName: z.string(),
      email: z.string().email(),
      passwordHash: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const existing = await pool.query(
      "SELECT id FROM parents WHERE email = $1",
      [data.email.toLowerCase()]
    );
    if (existing.rows.length > 0) throw new Error("EMAIL_TAKEN");

    await pool.query(
      "INSERT INTO parents (id, full_name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [data.id, data.fullName, data.email.toLowerCase(), data.passwordHash]
    );
    await pool.query(
      "INSERT INTO notifications (id, parent_id, title, body) VALUES ($1, $2, $3, $4)",
      [`n${Date.now()}`, data.id, "Welcome to Farmily! 🌱", "Add your children from the dashboard to get started."]
    );
    return { ok: true, parentId: data.id };
  });

export const apiSignIn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string(), passwordHash: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query(
      "SELECT id, full_name, email, password_hash FROM parents WHERE email = $1",
      [data.email.toLowerCase()]
    );
    if (res.rows.length === 0) return { ok: false, reason: "NOT_FOUND" as const, parent: null };
    const p = res.rows[0];
    if (p.password_hash !== data.passwordHash) return { ok: false, reason: "WRONG_PASSWORD" as const, parent: null };
    return {
      ok: true,
      reason: null,
      parent: { id: p.id, fullName: p.full_name, email: p.email, passwordHash: p.password_hash },
    };
  });

export const apiGetParentData = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string() }))
  .handler(async ({ data }) => {
    const [parentRes, childrenRes, requestsRes, notifRes, allowanceRes] = await Promise.all([
      pool.query("SELECT id, full_name, email, password_hash FROM parents WHERE id = $1", [data.parentId]),
      pool.query("SELECT id, parent_id, name, age, username, pin_hash, avatar, balance, monthly_allowance, category_limits FROM children WHERE parent_id = $1 ORDER BY created_at", [data.parentId]),
      pool.query("SELECT id, child_id, child_name, message, amount, type, created_at FROM requests WHERE parent_id = $1 ORDER BY created_at DESC", [data.parentId]),
      pool.query("SELECT id, title, body, read, created_at, request_id FROM notifications WHERE parent_id = $1 ORDER BY created_at DESC", [data.parentId]),
      pool.query("SELECT id, child_id, child_name, amount, note, date FROM allowances WHERE parent_id = $1 ORDER BY date DESC", [data.parentId]),
    ]);

    if (parentRes.rows.length === 0) return null;
    const p = parentRes.rows[0];
    return {
      parent: { id: p.id, fullName: p.full_name, email: p.email, passwordHash: p.password_hash },
      children: childrenRes.rows.map((c) => ({
        id: c.id, parentId: c.parent_id, name: c.name,
        age: c.age ?? undefined, username: c.username ?? undefined,
        pinHash: c.pin_hash, avatar: c.avatar, balance: Number(c.balance),
        monthlyAllowance: Number(c.monthly_allowance ?? 0),
        categoryLimits: c.category_limits ?? [],
      })),
      requests: requestsRes.rows.map((r) => ({
        id: r.id, childId: r.child_id, childName: r.child_name,
        message: r.message, amount: r.amount ? Number(r.amount) : undefined,
        type: r.type as "goal" | "savings", createdAt: r.created_at,
      })),
      notifications: notifRes.rows.map((n) => ({
        id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.created_at,
        requestId: n.request_id ?? undefined,
      })),
      allowances: allowanceRes.rows.map((a) => ({
        id: a.id, childId: a.child_id, childName: a.child_name,
        amount: Number(a.amount), note: a.note, date: a.date,
      })),
    };
  });

export const apiLoginAsDemo = createServerFn({ method: "POST" })
  .validator(
    z.object({
      parent: z.object({ id: z.string(), fullName: z.string(), email: z.string(), passwordHash: z.string() }),
      children: z.array(z.object({ id: z.string(), parentId: z.string(), name: z.string(), pinHash: z.string(), avatar: z.string(), balance: z.number() })),
      requests: z.array(z.object({ id: z.string(), childId: z.string(), childName: z.string(), message: z.string(), type: z.string() })).default([]),
      notifications: z.array(z.object({ id: z.string(), title: z.string(), body: z.string() })).default([]),
      allowances: z.array(z.object({ id: z.string(), childId: z.string(), childName: z.string(), amount: z.number(), note: z.string().optional(), date: z.string() })).default([]),
    })
  )
  .handler(async ({ data }) => {
    await pool.query(
      `INSERT INTO parents (id, full_name, email, password_hash) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET full_name=$2, password_hash=$4`,
      [data.parent.id, data.parent.fullName, data.parent.email, data.parent.passwordHash]
    );
    for (const c of data.children) {
      await pool.query(
        `INSERT INTO children (id, parent_id, name, pin_hash, avatar, balance) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET name=$3, pin_hash=$4, avatar=$5, balance=$6`,
        [c.id, c.parentId, c.name, c.pinHash, c.avatar, c.balance]
      );
    }
    for (const r of data.requests) {
      await pool.query(
        `INSERT INTO requests (id, child_id, parent_id, child_name, message, type) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [r.id, r.childId, data.parent.id, r.childName, r.message, r.type]
      );
    }
    for (const n of data.notifications) {
      await pool.query(
        `INSERT INTO notifications (id, parent_id, title, body) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [n.id, data.parent.id, n.title, n.body]
      );
    }
    for (const a of data.allowances) {
      await pool.query(
        `INSERT INTO allowances (id, child_id, parent_id, child_name, amount, note, date) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.childId, data.parent.id, a.childName, a.amount, a.note ?? null, a.date]
      );
    }
    return { ok: true };
  });
