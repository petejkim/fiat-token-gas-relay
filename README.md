# FiatToken Gas Relay

Not for production use, please see Missing Features section.

## Requirements

- Node.js 12
- Yarn
- PostgreSQL 12

## Setup

```shell
$ git clone git@github.com:petejkim/fiat-token-gas-relay.git
$ cd fiat-token-gas-relay
$ npm i -g yarn       # Install yarn if you don't already have it
$ yarn install        # Install dependencies
$ yarn setup          # Setup Git hooks
$ createdb gasrelay_development                   # Create DB
$ psql -d gasrelay_development -f db/schema.sql   # Load DB Schema
```

## Run

```shell
$ yarn start
```

## API

### POST /authorizations

#### Example Request

`Content-Type: application/json`

```json
{
  "type": "transfer",
  "address1": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "address2": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "value": "0x0000000000000000000000000000000000000000000000000000000000000001",
  "validAfter": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "validBefore": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  "nonce": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "v": "0x1b",
  "r": "0x1111111111111111111111111111111111111111111111111111111111111111",
  "s": "0x2222222222222222222222222222222222222222222222222222222222222222"
}
```

#### Example Response

`202 Accpted`

```json
{ "status": "submitted_for_processing", "id": 1 }
```

## Missing Features

This project does not include the following features that would be essential for
production use.

- Authorization types - only transfer authorization is implemented
- Gas price estimation - this project uses a hard-coded gas price
- Transaction replacement with higher gas price - this project does not submit a
  replacement transaction with higher gas price when a transaction sits
  unconfirmed for too long
- Multiple submitter accounts - this project submits transactions from a single
  account
- Authorization Cancellation
- Charging fees in FiatToken

---

[MIT License](https://github.com/petejkim/fiat-token-gas-relay/blob/master/LICENSE)
