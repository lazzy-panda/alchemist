// Validate Telegram Mini App initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// secret = HMAC_SHA256(key="WebAppData", message=botToken); expected hash = HMAC_SHA256(message=data_check_string, key=secret)
const enc = new TextEncoder();
async function hmac(keyBytes: Uint8Array<ArrayBuffer>, msg: string): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg))) as Uint8Array<ArrayBuffer>;
}
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function validateInitData(initData: string, botToken: string): Promise<boolean> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");
  const dcs = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac(enc.encode("WebAppData") as Uint8Array<ArrayBuffer>, botToken);
  const sig = await hmac(secret, dcs);
  return hex(sig) === hash;
}
export function parseInitDataUser(initData: string): { id: number; first_name?: string } | null {
  const u = new URLSearchParams(initData).get("user");
  if (!u) return null;
  try { return JSON.parse(u); } catch { return null; }
}
