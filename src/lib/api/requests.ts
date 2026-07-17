import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

export const apiApproveRequest = createServerFn({ method: "POST" })
  .validator(z.object({ requestId: z.string(), parentId: z.string() }))
  .handler(async ({ data }) => {
    const res = await pool.query(
      "SELECT id, child_id, child_name, amount FROM requests WHERE id=$1 AND parent_id=$2",
      [data.requestId, data.parentId]
    );
    if (!res.rows.length) throw new Error("NOT_FOUND");
    const req = res.rows[0];
    await pool.query("INSERT INTO approvals (id,request_id,status) VALUES ($1,$2,'approved')", [`appr${Date.now()}`, req.id]);
    if (req.amount) {
      await pool.query("UPDATE children SET balance=balance+$1 WHERE id=$2 AND parent_id=$3", [Number(req.amount), req.child_id, data.parentId]);
    }
    await pool.query(
      "INSERT INTO notifications (id,parent_id,title,body) VALUES ($1,$2,$3,$4)",
      [`n${Date.now()}`, data.parentId, "Request approved ✅", `${req.child_name}'s reward has been granted.`]
    );
    await pool.query("DELETE FROM requests WHERE id=$1", [req.id]);
    return { ok: true };
  });

export const apiRejectRequest = createServerFn({ method: "POST" })
  .validator(z.object({ requestId: z.string(), parentId: z.string() }))
  .handler(async ({ data }) => {
    await pool.query("INSERT INTO approvals (id,request_id,status) VALUES ($1,$2,'rejected')", [`appr${Date.now()}`, data.requestId]);
    await pool.query("DELETE FROM requests WHERE id=$1 AND parent_id=$2", [data.requestId, data.parentId]);
    return { ok: true };
  });

export const apiSubmitRequest = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(), childId: z.string(), parentId: z.string(),
    childName: z.string(), message: z.string(), type: z.enum(["goal","savings"]), amount: z.number().optional(),
  }))
  .handler(async ({ data }) => {
    await pool.query(
      "INSERT INTO requests (id,child_id,parent_id,child_name,message,type,amount) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [data.id, data.childId, data.parentId, data.childName, data.message, data.type, data.amount ?? null]
    );
    const emoji = data.type === "goal" ? "🎯" : "💰";
    await pool.query(
      "INSERT INTO notifications (id,parent_id,title,body,request_id) VALUES ($1,$2,$3,$4,$5)",
      [`n${Date.now()}`, data.parentId, `${emoji} ${data.childName} sent a request`, data.message, data.id]
    );
    return { ok: true };
  });

export const apiMarkAllRead = createServerFn({ method: "POST" })
  .validator(z.object({ parentId: z.string() }))
  .handler(async ({ data }) => {
    await pool.query("UPDATE notifications SET read=TRUE WHERE parent_id=$1", [data.parentId]);
    return { ok: true };
  });
