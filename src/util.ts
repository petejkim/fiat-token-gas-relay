const hexRegex = /^[a-f0-9]*$/i;

export function isHexString(str: string, len?: number): boolean {
  if (typeof str !== "string") {
    return false;
  }
  const s = strip0x(str);
  const isHex = hexRegex.test(s);

  if (typeof len === "number") {
    return isHex && s.length === len;
  }
  return isHex;
}

export function strip0x(str: string): string {
  return str.replace(/^(0x)?/, "");
}

export function prepend0x(str: string): string {
  return str.replace(/^(0x)?/, "0x");
}
