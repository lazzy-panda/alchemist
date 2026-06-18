import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateInitData, parseInitDataUser } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  const cors = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { initData } = await req.json().catch(() => ({}));
  const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  if (!initData || !(await validateInitData(initData, BOT))) {
    return new Response(JSON.stringify({ error: "bad initData" }), { status: 401, headers: cors });
  }
  const tg = parseInitDataUser(initData);
  if (!tg) return new Response(JSON.stringify({ error: "no user" }), { status: 400, headers: cors });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const email = `tg${tg.id}@telegram.local`;
  const password = `${tg.id}:${BOT.slice(0, 8)}`;
  await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { tg_id: tg.id } }).catch(() => {});
  const { data, error } = await admin.auth.signInWithPassword({ email, password });
  if (error || !data.session) return new Response(JSON.stringify({ error: error?.message || "no session" }), { status: 500, headers: cors });
  return new Response(JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token, uid: data.user.id }), { headers: cors });
});
