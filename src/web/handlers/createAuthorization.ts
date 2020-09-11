import Router from "koa-router";
import { Pool } from "pg";
import { isHexString, strip0x } from "../../util";

enum AuthorizationType {
  TRANSFER = "transfer",
  APPROVE = "approve",
  INCREASE_ALLOWANCE = "increaseAllowance",
  DECREASE_ALLOWANCE = "decreaseAllowance",
}

const VALID_AUTHORIZATION_TYPES: AuthorizationType[] = [
  AuthorizationType.TRANSFER,
  AuthorizationType.APPROVE,
  AuthorizationType.INCREASE_ALLOWANCE,
  AuthorizationType.DECREASE_ALLOWANCE,
];

function isValidAuthorizationType(v: any): v is AuthorizationType {
  return typeof v === "string" && VALID_AUTHORIZATION_TYPES.includes(v as any);
}

export function createAuthorization(pool: Pool): Router.IMiddleware {
  return async (ctx) => {
    const reqBody = ctx.request.body;
    const auth = isCreateAuthorizationBody(reqBody) ? reqBody : null;

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
          strip0x(auth.value).padStart(64, "0"),
          strip0x(auth.valid_after).padStart(64, "0"),
          strip0x(auth.valid_before).padStart(64, "0"),
          strip0x(auth.nonce).padStart(64, "0"),
          strip0x(auth.v).padStart(2, "0"),
          strip0x(auth.r).padStart(64, "0"),
          strip0x(auth.s).padStart(64, "0"),
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

interface CreateAuthorizationBody {
  type: string;
  address1: string;
  address2: string;
  value: string;
  valid_after: string;
  valid_before: string;
  nonce: string;
  v: string;
  r: string;
  s: string;
}

function isCreateAuthorizationBody(o: any): o is CreateAuthorizationBody {
  return (
    typeof o === "object" &&
    isValidAuthorizationType(o.type) &&
    isHexString(o.address1, 40) &&
    isHexString(o.address2, 40) &&
    isHexString(o.value) &&
    isHexString(o.valid_after) &&
    isHexString(o.valid_before) &&
    isHexString(o.nonce) &&
    isHexString(o.v) &&
    isHexString(o.r) &&
    isHexString(o.s)
  );
}
