import dotenv from "dotenv";
import Web3 from "web3";
import { strip0x } from "./util";

dotenv.config();

/* eslint-disable @typescript-eslint/no-non-null-assertion */

const { env } = process;

export const PORT = Number(env.PORT);
export const DATABASE_URL = env.DATABASE_URL!;
export const JSON_RPC_URL = env.JSON_RPC_URL!;
export const CHAIN_ID = Number(env.CHAIN_ID);
export const CHAIN_HARD_FORK = env.CHAIN_HARD_FORK!;
export const DOMAIN_SEPARATOR = env.DOMAIN_SEPARATOR!;
export const FIAT_TOKEN_CONTRACT_ADDRESS = env.FIAT_TOKEN_CONTRACT_ADDRESS!;
export const PRIVATE_KEY = Buffer.from(strip0x(env.PRIVATE_KEY!), "hex");
export const NONCE_START = Number(env.NONCE_START) || 0;
export const GAS_PRICE = Web3.utils.numberToHex(stripSep(env.GAS_PRICE!));
export const GAS_LIMIT = Web3.utils.numberToHex(stripSep(env.GAS_LIMIT!));
export const WORKER_POLL_INTERVAL = Number(env.WORKER_POLL_INTERVAL);

function stripSep(str: string): string {
  return str.replace(/[\s_,]/g, "");
}
