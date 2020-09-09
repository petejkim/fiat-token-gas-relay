import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { Pool } from "pg";
import { DATABASE_URL, PORT } from "./config";
import { createAuthorization } from "./handlers/createAuthorization";

const app = new Koa();
const router = new Router();
const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("error", (err, _client) => {
  console.error("pg pool error:", err);
  process.exit(-1);
});

app.use(bodyParser({ enableTypes: ["json"] }));

router.get("/", async (ctx) => {
  ctx.status = 200;
  ctx.body = { status: "ok" };
});

router.post("/authorizations", createAuthorization(pool));

app.use(router.routes()).use(router.allowedMethods());

console.log(`fiat-token-relay listening on port ${PORT}`);
app.listen(PORT);
