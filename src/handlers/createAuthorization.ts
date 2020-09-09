import Router from "koa-router";
import { Pool } from "pg";
import { AuthorizationType, isValidAuthorization } from "../Authorization";
import { strip0x } from "../util";

export function createAuthorization(pool: Pool): Router.IMiddleware {
  return async (ctx) => {
    const reqBody = ctx.request.body;
    const auth = isValidAuthorization(reqBody) ? reqBody : null;

    if (!auth) {
      ctx.status = 400;
      ctx.body = { error: "invalid_authorization" };
      return;
    }

    if (auth.type !== AuthorizationType.TRANSFER) {
      ctx.status = 400;
      ctx.body = { error: "unsupported_authorization_type" };
      return;
    }

    let id: number;
    try {
      const result = await pool.query<{ id: number }>(
        `INSERT INTO authorizations
          (type, address1, address2, value, valid_after, valid_before, nonce, v, r, s)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          auth.type,
          strip0x(auth.address1),
          strip0x(auth.address2),
          strip0x(auth.value),
          strip0x(auth.validAfter),
          strip0x(auth.validBefore),
          strip0x(auth.nonce),
          strip0x(auth.v),
          strip0x(auth.r),
          strip0x(auth.s),
        ]
      );
      id = result.rows[0].id;
    } catch (err) {
      console.error("Authorization insertion failed:", err);
      ctx.status = 500;
      ctx.body = { error: "internal_server_error" };
      return;
    }

    ctx.status = 202;
    ctx.body = { status: "submitted_for_processing", id };
  };
}
