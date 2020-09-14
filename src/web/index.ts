import cors from "@koa/cors";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import ratelimit from "koa-ratelimit";
import Router from "koa-router";
import { Pool } from "pg";
import url from "url";
import { CORS_ALLOWED_ORIGIN, DATABASE_URL, PORT } from "../config";
import { createAuthorization } from "./handlers/createAuthorization";
import { showAuthorization } from "./handlers/showAuthorization";

const app = new Koa();
const router = new Router();
const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("error", (err, _client) => {
  console.error("pg pool error:", err);
  process.exit(1);
});

app.use(
  cors({
    origin: (ctx) => {
      const origin = ctx.request.get("Origin");
      if (CORS_ALLOWED_ORIGIN === "*") {
        return origin;
      }
      const { host } = url.parse(origin);
      if (host && CORS_ALLOWED_ORIGIN.split(",").includes(host)) {
        return origin;
      }
      return "";
    },
  })
);

app.use(
  ratelimit({
    driver: "memory",
    db: new Map(),
    duration: 30000,
    errorMessage: `{"error":"rate_limit_exceeded"}`,
    id: (ctx) => ctx.ip,
    max: 100,
  })
);

app.use(bodyParser({ enableTypes: ["json"] }));

router.get("/", async (ctx) => {
  ctx.status = 200;
  ctx.body = { status: "ok" };
});

router.post("/authorizations", createAuthorization(pool));
router.get("/authorizations/:id", showAuthorization(pool));

app.use(router.routes()).use(router.allowedMethods());

console.log(`fiat-token-relay listening on port ${PORT}`);
app.listen(PORT);
