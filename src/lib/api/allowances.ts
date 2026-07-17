import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import pool from "@/lib/db";

export const apiSendAllowance = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string(), childId: z.string(), parentId: z.string(),
    childName: z.string(), amount: z.number(), note: z.string().optional(), date: z.string(),
  }))
  .handler(async ({ data }) => {
    await pool.query(
      "INSERT INTO allowances (id,child_id,parent_id,child_name,amount,note,date) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [data.id, data.childId, data.parentId, data.childName, data.amount, data.note ?? null, data.date]
    );
    await pool.query("UPDATE children SET balance=balance+$1 WHERE id=$2 AND parent_id=$3", [data.amount, data.childId, data.parentId]);
    await pool.query(
      "INSERT INTO notifications (id,parent_id,title,body) VALUES ($1,$2,$3,$4)",
      [`n${Date.now()}`, data.parentId, `Allowance sent to ${data.childName}`, `${data.amount} SAR was sent successfully.`]
    );
    await pool.query(
      "INSERT INTO mailbox (id,child_id,amount,date) VALUES ($1,$2,$3,$4)",
      [data.id, data.childId, data.amount, data.date]
    );
    return { ok: true };
  });
