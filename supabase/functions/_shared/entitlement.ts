export function mapPaymentToEntitlement(payment: { subscription_period?: number }, now = new Date()) {
  const periodSec = payment.subscription_period ?? 2592000; // default 30d
  const until = new Date(now.getTime() + periodSec * 1000);
  return { premium: true, plan: "monthly", provider: "telegram", premium_until: until.toISOString() };
}
