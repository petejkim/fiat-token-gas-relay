import Web3 from "web3";
import { strip0x } from "./util";

export const PORT = Number(process.env.PORT) || 3000;

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://localhost:5432/gasrelay_development?sslmode=disable";

export const JSON_RPC_URL =
  process.env.JSON_RPC_URL ||
  "https://mainnet.infura.io/v3/00000000000000000000000000000000";

export const CHAIN_ID = Number(process.env.CHAIN_ID) || 1;

export const CHAIN_HARD_FORK = process.env.CHAIN_HARD_FORK || "istanbul";

export const DOMAIN_SEPARATOR =
  process.env.DOMAIN_SEPARATOR ||
  "0x06c37168a7db5138defc7866392bb87a741f9b3d104deb5094588ce041cae335";

export const FIAT_TOKEN_CONTRACT_ADDRESS =
  process.env.FIAT_TOKEN_CONTRACT_ADDRESS ||
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

export const PRIVATE_KEY = Buffer.from(
  strip0x(
    process.env.PRIVATE_KEY ||
      "0x0000000000000000000000000000000000000000000000000000000000000000"
  ),
  "hex"
);

export const NONCE_START = Number(process.env.NONCE_START) || 0;

export const GAS_PRICE = Web3.utils.numberToHex(
  stripSep(process.env.GAS_PRICE || "1,000,000,000")
);

export const GAS_LIMIT = Web3.utils.numberToHex(
  stripSep(process.env.GAS_LIMIT || "100,000")
);

export const WORKER_POLL_INTERVAL =
  Number(process.env.WORKER_POLL_INTERVAL) || 15000;

function stripSep(str: string): string {
  return str.replace(/[\s_,]/g, "");
}
