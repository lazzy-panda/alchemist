Deno.serve(async (req) => {
  const cors = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { uid } = await req.json().catch(() => ({}));
  const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
  const body = {
    title: "Premium", description: "Полный доступ — подписка на месяц",
    payload: JSON.stringify({ uid }), currency: "XTR",
    prices: [{ label: "Premium", amount: 250 }], subscription_period: 2592000,
  };
  const r = await fetch(`https://api.telegram.org/bot${BOT}/createInvoiceLink`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  return new Response(JSON.stringify({ link: j.result ?? null, ok: j.ok, error: j.description ?? null }), { headers: cors });
});
