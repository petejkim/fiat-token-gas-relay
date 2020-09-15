import fetch from "isomorphic-unfetch";
import { Client } from "pg";
import { JSON_RPC_URL } from "../config";
import { prepend0x } from "../util";
import { markSubmissionAsConfirmed, SubmissionRow } from "./db";

export async function processSubmission(
  db: Client,
  s: SubmissionRow
): Promise<void> {
  console.log("Processing submission:", s);
  if (!s.raw_tx || !s.tx_hash) {
    return;
  }

  let receiptResponse: JSONRPCResponse;
  try {
    receiptResponse = await callJSONRPC("eth_getTransactionReceipt", [
      prepend0x(s.tx_hash),
    ]);
  } catch (err) {
    console.error("Failed to get receipt:", err);
    return;
  }

  if (receiptResponse.result?.blockNumber) {
    const blockNumber = Number.parseInt(
      receiptResponse.result.blockNumber as string
    );

    console.log(
      `Submission confirmed at block ${blockNumber}: ${prepend0x(s.tx_hash)}`
    );
    await markSubmissionAsConfirmed(db, s.id, blockNumber);
    return;
  }

  console.log("Broadcasting submission:", prepend0x(s.tx_hash));
  try {
    await callJSONRPC("eth_sendRawTransaction", [prepend0x(s.raw_tx)]);
  } catch (err) {
    console.error("Tx broadcast failed:", err);
  }
}

interface JSONRPCResponse {
  result?: any;
  error?: {
    code: number;
    message?: string;
    data?: any;
  };
}

async function callJSONRPC(
  method: string,
  params: any[]
): Promise<JSONRPCResponse> {
  const res = await fetch(JSON_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });
  return res.json();
}
