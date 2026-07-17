import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

const CategoryLimitSchema = z.object({ id: z.string(), name: z.string(), amount: z.number() });

export const apiAddChild = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(), parentId: z.string(), name: z.string(),
    age: z.number().optional(), username: z.string().optional(),
    pinHash: z.string(), avatar: z.string(),
    monthlyAllowance: z.number().default(0),
    categoryLimits: z.array(CategoryLimitSchema).default([]),
  }))
  .handler(async ({ data }) => {
    await pool.query(
      `INSERT INTO children (id, parent_id, name, age, username, pin_hash, avatar, balance, monthly_allowance, category_limits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,$9)`,
      [data.id, data.parentId, data.name, data.age ?? null, data.username ?? null,
       data.pinHash, data.avatar, data.monthlyAllowance, JSON.stringify(data.categoryLimits)]
    );
    return { ok: true };
  });

export const apiRemoveChild = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), parentId: z.string() }))
  .handler(async ({ data }) => {
    await pool.query("DELETE FROM children WHERE id=$1 AND parent_id=$2", [data.childId, data.parentId]);
    return { ok: true };
  });

export const apiUpdateChildBalance = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string(), parentId: z.string(), delta: z.number() }))
  .handler(async ({ data }) => {
    await pool.query(
      "UPDATE children SET balance=GREATEST(0,balance+$1) WHERE id=$2 AND parent_id=$3",
      [data.delta, data.childId, data.parentId]
    );
    return { ok: true };
  });

export const apiGetChildBalance = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query("SELECT balance FROM children WHERE id=$1", [data.childId]);
    return { balance: res.rows.length > 0 ? Number(res.rows[0].balance) : 0 };
  });

export const apiGetAllChildren = createServerFn({ method: "GET" }).handler(async () => {
  const res = await pool.query(
    "SELECT id, parent_id, name, age, username, pin_hash, avatar, balance, monthly_allowance, category_limits FROM children ORDER BY created_at"
  );
  return {
    children: res.rows.map((c) => ({
      id: c.id, parentId: c.parent_id, name: c.name,
      age: c.age ?? undefined, username: c.username ?? undefined,
      pinHash: c.pin_hash, avatar: c.avatar, balance: Number(c.balance),
      monthlyAllowance: Number(c.monthly_allowance ?? 0),
      categoryLimits: c.category_limits ?? [],
    })),
  };
});
