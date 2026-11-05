import { attachDatabasePool } from "@neon/functions";
import { Pool } from "pg";

// Tokio courier sync function: advances delivery tracking for active orders.
// In production this endpoint is called by the courier (e.g. Pathao) webhook.
// The app calls it via POST /advance with the shared x-secret header.

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

const LAST_STAGE = 4;

async function advance(orderId?: string) {
  const params: unknown[] = [];
  let where = `status = 'active' AND tracking_stage < ${LAST_STAGE}`;
  if (orderId) {
    params.push(orderId);
    where += " AND id = $1";
  }
  const { rows } = await pool.query(
    `UPDATE orders
       SET tracking_stage = tracking_stage + 1,
           tracking_times = jsonb_set(
             tracking_times,
             ARRAY[(tracking_stage + 1)::text],
             to_jsonb(now()::text),
             true
           ),
           status = CASE WHEN tracking_stage + 1 >= ${LAST_STAGE}
                         THEN 'completed' ELSE status END
     WHERE ${where}
     RETURNING id, ref, tracking_stage, status`,
    params,
  );
  return rows;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "tokio-courier" });
    }

    if (request.method === "POST" && (url.pathname === "/" || url.pathname === "/advance")) {
      if (request.headers.get("x-secret") !== process.env.COURIER_SECRET) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      let orderId: string | undefined;
      try {
        const body = await request.json();
        if (body && typeof body.orderId === "string") orderId = body.orderId;
      } catch {
        // Empty body: advance every active order.
      }
      const rows = await advance(orderId);
      return Response.json({ advanced: rows.length, orders: rows });
    }

    return new Response("Not found", { status: 404 });
  },
};
