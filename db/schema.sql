BEGIN;

CREATE TYPE authorization_type AS ENUM (
  'transfer',
  'approve',
  'increase_allowance',
  'decrease_allowance'
);

CREATE TABLE authorizations (
  id serial PRIMARY KEY,
  type authorization_type NOT NULL,
  address1 char(40) NOT NULL,
  address2 char(40) NOT NULL,
  value char(64) NOT NULL,
  valid_after char(64) NOT NULL,
  valid_before char(64) NOT NULL,
  nonce char(64) NOT NULL,
  v char(2) NOT NULL,
  r char(64) NOT NULL,
  s char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (address1, nonce)
);

CREATE INDEX index_authorizations_type ON authorizations (type);

CREATE TABLE submissions (
  id serial PRIMARY KEY,
  authorization_id int REFERENCES authorizations (id) NOT NULL,
  tx_hash char(64),
  raw_tx text,
  error varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_block int
);

CREATE UNIQUE INDEX index_submissions_authorization_id ON submissions (authorization_id);
CREATE UNIQUE INDEX index_submissions_tx_hash ON submissions (tx_hash);
CREATE UNIQUE INDEX index_submissions_confirmed_at ON submissions (confirmed_at);
CREATE UNIQUE INDEX index_submissions_confirmed_at_and_raw_tx ON submissions (confirmed_at, raw_tx);

CREATE TABLE tx_nonces (
  nonce int PRIMARY KEY,
  submission_id int REFERENCES submissions (id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX index_tx_nonces_submission_id ON tx_nonces (submission_id);

COMMIT;
