const hexRegex = /^[a-f0-9]*$/i;

export function isHexString(str: string, len = 64): boolean {
  if (typeof str !== "string") {
    return false;
  }
  const s = strip0x(str);
  return hexRegex.test(s) && s.length == len;
}

export function strip0x(str: string): string {
  return str.replace(/^(0x)?/, "");
}
