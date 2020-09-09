import { isHexString } from "./util";

export enum AuthorizationType {
  TRANSFER = "transfer",
  APPROVE = "approve",
  INCREASE_ALLOWANCE = "increaseAllowance",
  DECREASE_ALLOWANCE = "decreaseAllowance",
}

const VALID_AUTHORIZATION_TYPES: AuthorizationType[] = [
  AuthorizationType.TRANSFER,
  AuthorizationType.APPROVE,
  AuthorizationType.INCREASE_ALLOWANCE,
  AuthorizationType.DECREASE_ALLOWANCE,
];

export function isValidAuthorizationType(v: any): v is AuthorizationType {
  return typeof v === "string" && VALID_AUTHORIZATION_TYPES.includes(v as any);
}

export interface Authorization {
  type: string;
  address1: string;
  address2: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  v: string;
  r: string;
  s: string;
}

export function isValidAuthorization(o: any): o is Authorization {
  return (
    typeof o === "object" &&
    isValidAuthorizationType(o.type) &&
    isHexString(o.address1, 40) &&
    isHexString(o.address2, 40) &&
    isHexString(o.value, 64) &&
    isHexString(o.validAfter, 64) &&
    isHexString(o.validBefore, 64) &&
    isHexString(o.nonce, 64) &&
    isHexString(o.v, 2) &&
    isHexString(o.r, 64) &&
    isHexString(o.s, 64)
  );
}
