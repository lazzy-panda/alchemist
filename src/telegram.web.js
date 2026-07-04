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
// Bot API 7.7+: keep the Mini App from collapsing on vertical drags (drag-to-reorder)
export function disableVerticalSwipes() {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  if (wa && typeof wa.disableVerticalSwipes === 'function') { try { wa.disableVerticalSwipes(); } catch (e) {} }
}
export function haptic(kind) {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  const h = wa && wa.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'selection' && h.selectionChanged) h.selectionChanged();
    else if (h.impactOccurred) h.impactOccurred('light');
  } catch (e) {}
}
