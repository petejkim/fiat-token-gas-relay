import { randomBytes } from "crypto";
import { ecsign } from "ethereumjs-util/dist/signature";
import fetch from "isomorphic-unfetch";
import Web3 from "web3";
import { DOMAIN_SEPARATOR, PRIVATE_KEY } from "../config";
import { strip0x } from "../util";
import {
  getTypeHashAndSelector,
  hashAuthorization,
} from "../worker/gasAbstraction";

void (async function main() {
  if (process.argv.length <= 2) {
    console.log(
      "Usage: <url> <authorization_type> <address1> <address2> <value> <private_key>"
    );
    process.exit(1);
  }

  const [
    ,
    ,
    url,
    authorizationType,
    address1,
    address2,
    value,
    privKeyArg,
  ] = process.argv;
  const privateKey = privKeyArg
    ? Buffer.from(strip0x(privKeyArg), "hex")
    : PRIVATE_KEY;

  const typeHashAndSelector = getTypeHashAndSelector(authorizationType);
  if (!typeHashAndSelector) {
    console.error("Invalid authorization type:", authorizationType);
    process.exit(1);
  }
  const [typeHash] = typeHashAndSelector;
  const valueInHex = Web3.utils.numberToHex(value);
  const validAfter = "0";
  const validBefore =
    "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const nonce = randomBytes(32).toString("hex");

  const digest = hashAuthorization(
    typeHash,
    address1,
    address2,
    valueInHex,
    validAfter,
    validBefore,
    nonce,
    DOMAIN_SEPARATOR
  );
  const digestBuf = Buffer.from(strip0x(digest), "hex");

  const sig = ecsign(digestBuf, privateKey);

  const payload = {
    type: authorizationType,
    address1,
    address2,
    value: valueInHex,
    valid_after: validAfter,
    valid_before: validBefore,
    nonce,
    v: sig.v.toString(16),
    r: sig.r.toString("hex"),
    s: sig.s.toString("hex"),
  };

  console.log(payload);

  const res = await fetch(url + "/authorizations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log(await res.json());
})();
