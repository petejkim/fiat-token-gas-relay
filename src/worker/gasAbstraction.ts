import { pubToAddress } from "ethereumjs-util/dist/account";
import { ecrecover } from "ethereumjs-util/dist/signature";
import Web3 from "web3";
import { prepend0x, strip0x } from "../util";

const web3 = new Web3();
const { keccak256, toChecksumAddress } = web3.utils;
const { abi } = web3.eth;

export const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = keccak256(
  "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);
export const BURN_WITH_AUTHORIZATION_TYPEHASH = keccak256(
  "BurnWithAuthorization(address owner,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);
export const CLAIM_WITH_AUTHORIZATION_TYPEHASH = keccak256(
  "ClaimWithAuthorization(address owner,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

export const TRANSFER_WITH_AUTHORIZATION_SELECTOR = abi.encodeFunctionSignature(
  "transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)"
);
export const BURN_WITH_AUTHORIZATION_SELECTOR = abi.encodeFunctionSignature(
  "burnWithAuthorization(address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)"
);
export const CLAIM_WITH_AUTHORIZATION_SELECTOR = abi.encodeFunctionSignature(
  "claimWithAuthorization(address,uint256,uint256,bytes32,uint8,bytes32,bytes32)"
);

const AUTHORIZATION_PARAM_TYPES = [
  "address",
  "address",
  "uint256",
  "uint256",
  "uint256",
  "bytes32",
];

const BURN_AUTHORIZATION_PARAM_TYPES = [
  "address",
  "uint256",
  "uint256",
  "uint256",
  "bytes32",
];

const CLAIM_AUTHORIZATION_PARAM_TYPES = [
  "address",
  "uint256",
  "uint256",
  "bytes32",
];

function eip712Hash(
  domainSeparator: string,
  typeHash: string,
  types: string[],
  values: string[]
): string {
  return keccak256(
    "0x1901" +
      strip0x(domainSeparator) +
      strip0x(
        keccak256(
          abi.encodeParameters(
            ["bytes32", ...types],
            [typeHash, ...values.map((v) => prepend0x(v))]
          )
        )
      )
  );
}

export function hashAuthorization(
  typeHash: string,
  address1: string,
  address2: string,
  value: string,
  validAfter: string,
  validBefore: string,
  nonce: string,
  domainSeparator: string
): string {
  if (typeHash === BURN_WITH_AUTHORIZATION_TYPEHASH) {
    return eip712Hash(
      domainSeparator,
      typeHash,
      BURN_AUTHORIZATION_PARAM_TYPES,
      [address1, value, validAfter, validBefore, nonce]
    );
  } else if (typeHash === CLAIM_WITH_AUTHORIZATION_TYPEHASH) {
    return eip712Hash(
      domainSeparator,
      typeHash,
      CLAIM_AUTHORIZATION_PARAM_TYPES,
      [address1, validAfter, validBefore, nonce]
    );
  }

  return eip712Hash(domainSeparator, typeHash, AUTHORIZATION_PARAM_TYPES, [
    address1,
    address2,
    value,
    validAfter,
    validBefore,
    nonce,
  ]);
}

export function getSignerAddress(
  hashDigest: string,
  v: number | string,
  r: string,
  s: string
): string | null {
  const digestBuf = Buffer.from(strip0x(hashDigest), "hex");
  if (typeof v === "string") {
    v = Number.parseInt(strip0x(v), 16);
  }
  const rBuf = Buffer.from(strip0x(r), "hex");
  const sBuf = Buffer.from(strip0x(s), "hex");

  let addressBuf: Buffer;
  try {
    const pubKey = ecrecover(digestBuf, v, rBuf, sBuf);
    addressBuf = pubToAddress(pubKey);
  } catch (err) {
    return null;
  }

  return toChecksumAddress(addressBuf.toString("hex"));
}

export function encodeTxData(
  selector: string,
  address1: string,
  address2: string,
  value: string,
  validAfter: string,
  validBefore: string,
  nonce: string,
  v: number | string,
  r: string,
  s: string
): string {
  if (typeof v === "number") {
    v = v.toString(16);
  }
  let argData: string;

  if (selector === BURN_WITH_AUTHORIZATION_SELECTOR) {
    argData = abi.encodeParameters(
      [...BURN_AUTHORIZATION_PARAM_TYPES, "uint8", "bytes32", "bytes32"],
      [address1, value, validAfter, validBefore, nonce, v, r, s].map((v) =>
        prepend0x(v)
      )
    );
  } else if (selector === CLAIM_WITH_AUTHORIZATION_SELECTOR) {
    argData = abi.encodeParameters(
      [...CLAIM_AUTHORIZATION_PARAM_TYPES, "uint8", "bytes32", "bytes32"],
      [address1, validAfter, validBefore, nonce, v, r, s].map((v) =>
        prepend0x(v)
      )
    );
  } else {
    argData = abi.encodeParameters(
      [...AUTHORIZATION_PARAM_TYPES, "uint8", "bytes32", "bytes32"],
      [
        address1,
        address2,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
      ].map((v) => prepend0x(v))
    );
  }

  return prepend0x(selector) + strip0x(argData);
}

export function getTypeHashAndSelector(
  authorizationType: string
): [string, string] | null {
  switch (authorizationType) {
    case "transfer":
      return [
        TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
        TRANSFER_WITH_AUTHORIZATION_SELECTOR,
      ];
    case "burn":
      return [
        BURN_WITH_AUTHORIZATION_TYPEHASH,
        BURN_WITH_AUTHORIZATION_SELECTOR,
      ];
    case "claim":
      return [
        CLAIM_WITH_AUTHORIZATION_TYPEHASH,
        CLAIM_WITH_AUTHORIZATION_SELECTOR,
      ];
  }
  return null;
}
