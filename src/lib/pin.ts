export const PIN_LENGTH = 4;

export function isValidPin(pin: string): boolean {
  if (pin.length !== PIN_LENGTH) return false;
  for (const char of pin) {
    if (char < "0" || char > "9") return false;
  }
  return true;
}

export function randomSalt(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

function fallbackHash(input: string): string {
  let a = 0x811c9dc5;
  let b = 0x1000193;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    a = Math.imul(a ^ code, 0x01000193) >>> 0;
    b = Math.imul(b + code, 0x85ebca6b) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

/** SHA-256 от соли и кода. Без crypto.subtle уходит на запасной хеш. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const payload = salt + ":" + pin;
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle && typeof subtle.digest === "function") {
    try {
      const digest = await subtle.digest("SHA-256", new TextEncoder().encode(payload));
      let out = "";
      for (const byte of new Uint8Array(digest)) out += byte.toString(16).padStart(2, "0");
      return out;
    } catch {
      // например, не защищённый контекст — используем запасной вариант
    }
  }
  return fallbackHash(payload);
}

export async function verifyPin(pin: string, salt: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  const candidate = await hashPin(pin, salt);
  return candidate === hash;
}
