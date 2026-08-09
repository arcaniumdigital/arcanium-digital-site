const encoder = new TextEncoder();

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

export function randomToken(byteLength = 24): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function opaqueId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function signLeadCorrelation(
  secret: string,
  publicId: string,
  expiresAtEpochSeconds: number,
): Promise<string> {
  const nonce = randomToken(12);
  const payload = `${publicId}.${expiresAtEpochSeconds}.${nonce}`;
  return `${payload}.${await hmacHex(secret, payload)}`;
}

export async function verifyLeadCorrelation(
  secret: string,
  value: string,
  nowEpochSeconds = Math.floor(Date.now() / 1000),
): Promise<{ publicId: string; expiresAt: number } | null> {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [publicId, expiresRaw, nonce, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!/^public_[0-9a-f-]{36}$/i.test(publicId) || !Number.isSafeInteger(expiresAt)) return null;
  if (!/^[A-Za-z0-9_-]{12,}$/.test(nonce) || expiresAt < nowEpochSeconds || expiresAt > nowEpochSeconds + 3600) return null;
  const payload = `${publicId}.${expiresAt}.${nonce}`;
  const expected = await hmacHex(secret, payload);
  return constantTimeEqual(expected, signature) ? { publicId, expiresAt } : null;
}
