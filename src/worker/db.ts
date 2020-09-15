import { Client } from "pg";

export interface AuthorizationRow {
  id: number;
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
  created_at: Date;
}

export interface SubmissionRow {
  id: number;
  authorization_id: number;
  tx_hash: string | null;
  raw_tx: string | null;
  error: string | null;
  created_at: Date;
  confirmed_at: Date | null;
}

export async function markSubmissionAsFailed(
  db: Client,
  id: number,
  error: string
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO submissions
        (authorization_id, error)
        VALUES ($1, $2)`,
      [id, error]
    );
  } catch (err) {
    console.error("Failed to mark as failed:", err);
  }
}

export async function markSubmissionAsConfirmed(
  db: Client,
  id: number,
  blockNumber: number
): Promise<void> {
  try {
    await db.query(
      `UPDATE submissions
        SET confirmed_at = now(), confirmed_block = $1
        WHERE id = $2`,
      [blockNumber, id]
    );
  } catch (err) {
    console.error("Failed to mark as confirmed:", err);
  }
}
