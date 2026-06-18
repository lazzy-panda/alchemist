import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { mapPaymentToEntitlement } from "./entitlement.ts";

Deno.test("monthly sub → premium with +30d expiry", () => {
  const now = new Date("2026-06-18T00:00:00Z");
  const e = mapPaymentToEntitlement({ subscription_period: 2592000 }, now);
  assertEquals(e.premium, true);
  assertEquals(e.plan, "monthly");
  assertEquals(e.provider, "telegram");
  assertEquals(e.premium_until, "2026-07-18T00:00:00.000Z");
});
