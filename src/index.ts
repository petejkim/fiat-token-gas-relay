import Koa from "koa";
import Router from "koa-router";
import { PORT } from "./config";

const app = new Koa();
const router = new Router();

router.get("/", (ctx) => {
  ctx.status = 200;
  ctx.body = { status: "ok" };
});

app.use(router.routes()).use(router.allowedMethods());

console.log(`fiat-token-relay listening on port ${PORT}`);
app.listen(PORT);
