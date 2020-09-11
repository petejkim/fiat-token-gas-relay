import Router from "koa-router";
import { Pool } from "pg";
import { prepend0x } from "../../util";

export function showAuthorization(pool: Pool): Router.IMiddleware {
  return async (ctx) => {
    const id = Number((ctx.params as { id?: string }).id);
    if (!id) {
      ctx.status = 404;
      ctx.body = { error: "not_found" };
      return;
    }

    let rows: {
      id: number;
      tx_hash: string | null;
      error: string | null;
      created_at: Date | null;
      confirmed_at: Date | null;
    }[];
    try {
      ({ rows } = await pool.query(
        `SELECT a.id, s.tx_hash, s.error, s.created_at, s.confirmed_at
          FROM authorizations a
          LEFT JOIN submissions s ON a.id = s.authorization_id
          WHERE a.id = $1`,
        [id]
      ));
    } catch (err) {
      console.error("Submission lookup failed:", err);
      ctx.status = 500;
      ctx.body = { error: "internal_server_error" };
      return;
    }

    if (rows.length === 0) {
      ctx.status = 404;
      ctx.body = { error: "not_found" };
      return;
    }

    ctx.status = 200;

    const row = rows[0];
    if (!row.created_at) {
      ctx.body = { id, state: "pending" };
      return;
    }

    if (row.error || !row.tx_hash) {
      ctx.body = {
        id,
        state: "failed",
        error: row.error || "unknown_error",
        failed_at: row.created_at,
      };
      return;
    }

    ctx.body = {
      id,
      tx_hash: prepend0x(row.tx_hash),
      submitted_at: row.created_at,
    };

    if (row.confirmed_at) {
      ctx.body.state = "confirmed";
      ctx.body.confirmed_at = row.confirmed_at;
    } else {
      ctx.body.state = "submitted";
    }
  };
}
