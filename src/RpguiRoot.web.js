/* Web: inject RPGUI css (images inlined as data URIs) + Press Start 2P, and wrap
   the app in a .rpgui-content scope so RPGUI's styles apply. */
import { unstable_createElement } from 'react-native-web';
import { RPGUI_CSS } from './rpgui-css';

// unstable_createElement(type, props, options) — children must live in props.children.
const h = (type, props, ...kids) =>
  unstable_createElement(type, { ...(props || {}), children: kids.length <= 1 ? kids[0] : kids });

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.id = 'rpgui-css';
  style.appendChild(document.createTextNode(RPGUI_CSS));
  document.head.appendChild(style);
}
inject();

export function RpguiRoot({ children }) {
  return h('div', { className: 'rpgui-content', style: { flex: 1, display: 'flex', flexDirection: 'column' } }, children);
}
