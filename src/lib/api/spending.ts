import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

export const apiLogSpending = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(),
    childId: z.string(),
    parentId: z.string(),
    childName: z.string(),
    categoryId: z.string(),
    categoryName: z.string(),
    amount: z.number().positive(),
    note: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    await pool.query(
      `INSERT INTO spending (id, child_id, parent_id, child_name, category_id, category_name, amount, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [data.id, data.childId, data.parentId, data.childName,
       data.categoryId, data.categoryName, data.amount, data.note ?? null]
    );
    return { ok: true };
  });

export const apiGetSpending = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query(
      `SELECT id, child_id, child_name, category_id, category_name, amount, note, date
       FROM spending WHERE parent_id=$1 ORDER BY date DESC`,
      [data.parentId]
    );
    return {
      spending: res.rows.map((r) => ({
        id: r.id,
        childId: r.child_id,
        childName: r.child_name,
        categoryId: r.category_id,
        categoryName: r.category_name,
        amount: Number(r.amount),
        note: r.note ?? undefined,
        date: r.date,
      })),
    };
  });
