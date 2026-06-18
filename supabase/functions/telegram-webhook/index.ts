import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mapPaymentToEntitlement } from "../_shared/entitlement.ts";

Deno.serve(async (req) => {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== Deno.env.get("TG_WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const update = await req.json().catch(() => ({}));
  const sp = update?.message?.successful_payment;
  if (sp) {
    let uid: string | undefined;
    try { uid = JSON.parse(sp.invoice_payload || "{}").uid; } catch { /* ignore */ }
    const charge = sp.telegram_payment_charge_id;
    if (uid && charge) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: seen } = await admin.from("payment_charges").select("id").eq("id", charge).maybeSingle();
      if (!seen) {
        await admin.from("entitlements").upsert({ id: uid, ...mapPaymentToEntitlement(sp), updated_at: new Date().toISOString() });
        await admin.from("payment_charges").insert({ id: charge, uid });
      }
    }
  }
  return new Response("ok");
});
