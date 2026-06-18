export function getInitData() {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  return wa ? wa.initData || '' : '';
}
export function inTelegram() { return !!getInitData(); }
export function openInvoice(link, cb) {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  if (wa && wa.openInvoice) wa.openInvoice(link, cb); else { window.open(link, '_blank'); if (cb) cb('opened'); }
}
export function getStartParam() {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  return (wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param) || '';
}
