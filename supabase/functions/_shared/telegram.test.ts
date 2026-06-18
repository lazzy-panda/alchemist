import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateInitData, parseInitDataUser } from "./telegram.ts";

const BOT = "123456:TESTTOKEN";
const enc = new TextEncoder();
async function hmac(keyBytes: Uint8Array<ArrayBuffer>, msg: string) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg))) as Uint8Array<ArrayBuffer>;
}
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

Deno.test("valid initData accepted", async () => {
  const p = new URLSearchParams();
  p.set("user", JSON.stringify({ id: 42, first_name: "T" }));
  p.set("auth_date", "1700000000");
  const dcs = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac(enc.encode("WebAppData") as Uint8Array<ArrayBuffer>, BOT);
  p.set("hash", hex(await hmac(secret, dcs)));
  assertEquals(await validateInitData(p.toString(), BOT), true);
});
Deno.test("tampered hash rejected", async () => {
  const p = new URLSearchParams();
  p.set("user", JSON.stringify({ id: 42 }));
  p.set("auth_date", "1700000000");
  p.set("hash", "deadbeef");
  assertEquals(await validateInitData(p.toString(), BOT), false);
});
Deno.test("parses user id", () => {
  assertEquals(parseInitDataUser("user=%7B%22id%22%3A42%7D&auth_date=1")?.id, 42);
});
