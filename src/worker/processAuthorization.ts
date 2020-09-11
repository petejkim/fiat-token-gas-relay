import ethjsCommon from "ethereumjs-common";
import { Transaction } from "ethereumjs-tx";
import { Client } from "pg";
import {
  CHAIN_HARD_FORK,
  CHAIN_ID,
  DOMAIN_SEPARATOR,
  FIAT_TOKEN_CONTRACT_ADDRESS,
  GAS_LIMIT,
  GAS_PRICE,
  NONCE_START,
  PRIVATE_KEY,
} from "../config";
import { strip0x } from "../util";
import { AuthorizationRow, markSubmissionAsFailed } from "./db";
import {
  encodeTxData,
  getSignerAddress,
  getTypeHashAndSelector,
  hashAuthorization,
} from "./gasAbstraction";

const customCommon = ethjsCommon.forCustomChain(
  "mainnet",
  {
    networkId: CHAIN_ID,
    chainId: CHAIN_ID,
  },
  CHAIN_HARD_FORK
);

export async function processAuthorization(
  db: Client,
  a: AuthorizationRow
): Promise<void> {
  console.log("Processing authorization:", a);

  const typeHashAndSelector = getTypeHashAndSelector(a.type);
  if (!typeHashAndSelector) {
    console.error("Unsupported authorization type:", a.type);
    await markSubmissionAsFailed(db, a.id, "unsupported_authorization_type");
    return;
  }
  const [typeHash, selector] = typeHashAndSelector;

  const digest = hashAuthorization(
    typeHash,
    a.address1,
    a.address2,
    a.value,
    a.valid_after,
    a.valid_before,
    a.nonce,
    DOMAIN_SEPARATOR
  );

  const signer = getSignerAddress(digest, a.v, a.r, a.s);
  if (!signer) {
    console.error("Unable to recover signer address");
    await markSubmissionAsFailed(db, a.id, "invalid_signature");
    return;
  }

  if (strip0x(signer.toLowerCase()) !== strip0x(a.address1.toLowerCase())) {
    console.error("Signer does not match address1");
    await markSubmissionAsFailed(db, a.id, "signer_verification_failed");
    return;
  }

  const txData = encodeTxData(
    selector,
    a.address1,
    a.address2,
    a.value,
    a.valid_after,
    a.valid_before,
    a.nonce,
    a.v,
    a.r,
    a.s
  );

  let rawTx: string;
  try {
    await db.query("BEGIN");
    await db.query("LOCK TABLE tx_nonces");
    const maxNonceResult = await db.query<{ max: number | null }>(
      "SELECT max(nonce) FROM tx_nonces"
    );
    const maxNonce = maxNonceResult.rows[0].max;
    const txNonce = maxNonce === null ? NONCE_START : maxNonce + 1;

    const tx = new Transaction(
      {
        to: FIAT_TOKEN_CONTRACT_ADDRESS,
        value: 0,
        data: txData,
        gasPrice: GAS_PRICE,
        gasLimit: GAS_LIMIT,
        nonce: txNonce,
      },
      { common: customCommon }
    );
    tx.sign(PRIVATE_KEY);

    rawTx = tx.serialize().toString("hex");
    const txHash = tx.hash().toString("hex");

    const insertSubmissionResult = await db.query<{ id: number }>(
      `INSERT INTO submissions
        (authorization_id, tx_hash, raw_tx)
        VALUES ($1, $2, $3) RETURNING id`,
      [a.id, txHash, rawTx]
    );
    const submissionId = insertSubmissionResult.rows[0].id;

    await db.query(
      `INSERT INTO tx_nonces (nonce, submission_id) VALUES ($1, $2)`,
      [txNonce, submissionId]
    );

    console.log(`Tx nonce: ${txNonce} hash: 0x${txHash}`);

    await db.query("COMMIT");
  } catch (err) {
    console.error("Tx creation failed:", err);
    await db.query("ROLLBACK");
    return;
  }
}
