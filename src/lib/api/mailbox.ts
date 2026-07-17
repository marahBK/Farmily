import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

export const apiClaimMailbox = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query(
      "SELECT id, amount FROM mailbox WHERE child_id=$1 AND claimed=FALSE ORDER BY date LIMIT 1",
      [data.childId]
    );
    if (!res.rows.length) return { amount: null };
    const row = res.rows[0];
    await pool.query("UPDATE mailbox SET claimed=TRUE WHERE id=$1", [row.id]);
    return { amount: Number(row.amount) };
  });

export const apiCheckMailbox = createServerFn({ method: "POST" })
  .validator(z.object({ childId: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query(
      "SELECT COUNT(*) as cnt FROM mailbox WHERE child_id=$1 AND claimed=FALSE",
      [data.childId]
    );
    return { count: Number(res.rows[0].cnt) };
  });

export const apiCheckApprovals = createServerFn({ method: "POST" })
  .validator(z.object({ requestIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    if (!data.requestIds.length) return { approvals: [] };
    const res = await pool.query(
      "SELECT request_id, status FROM approvals WHERE request_id=ANY($1::text[]) AND consumed=FALSE",
      [data.requestIds]
    );
    if (res.rows.length > 0) {
      await pool.query(
        "UPDATE approvals SET consumed=TRUE WHERE request_id=ANY($1::text[])",
        [res.rows.map((r: { request_id: string }) => r.request_id)]
      );
    }
    return {
      approvals: res.rows.map((r: { request_id: string; status: string }) => ({
        requestId: r.request_id,
        status: r.status as "approved" | "rejected",
      })),
    };
  });
