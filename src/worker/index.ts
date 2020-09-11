import { Client } from "pg";
import { DATABASE_URL, WORKER_POLL_INTERVAL } from "../config";
import { AuthorizationRow, SubmissionRow } from "./db";
import { processAuthorization } from "./processAuthorization";
import { processSubmission } from "./processSubmission";

const db = new Client({ connectionString: DATABASE_URL });

db.on("error", (err) => {
  console.error("pg client error:", err);
  process.exit(1);
});

void db.connect();

console.log("fiat-token-relay worker started");
void work();

async function work(): Promise<void> {
  let pendingAuthorizations: AuthorizationRow[];
  try {
    pendingAuthorizations = (
      await db.query(
        `SELECT a.*
      FROM authorizations a
      LEFT JOIN submissions s ON a.id = s.authorization_id
      WHERE s.authorization_id IS NULL`
      )
    ).rows;
  } catch (err) {
    console.error("Authorization lookup failed:", err);
    return;
  }

  for (const authorization of pendingAuthorizations) {
    await processAuthorization(db, authorization);
  }

  let pendingSubmissions: SubmissionRow[];
  try {
    pendingSubmissions = (
      await db.query(
        `SELECT * FROM submissions
          WHERE confirmed_at IS NULL AND raw_tx IS NOT NULL`
      )
    ).rows;
  } catch (err) {
    console.error("Submission lookup failed:", err);
    return;
  }

  for (const submission of pendingSubmissions) {
    await processSubmission(db, submission);
  }

  setTimeout(work, WORKER_POLL_INTERVAL);
}
