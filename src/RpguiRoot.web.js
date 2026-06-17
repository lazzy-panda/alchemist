/* Web: inject RPGUI css + Press Start 2P, and wrap the app in a .rpgui-content
   scope so RPGUI's styles apply. The art is NOT base64-inlined into the bundle —
   the generated CSS carries `url("RPGUIIMG:<path>")` placeholders that we swap for
   Metro-hashed asset uris at runtime (keeps ~1 MB of PNGs out of the JS bundle). */
import { unstable_createElement } from 'react-native-web';
import { RPGUI_CSS } from './rpgui-css';
import { RPGUI_IMG } from './rpgui-img';

// unstable_createElement(type, props, options) — children must live in props.children.
const h = (type, props, ...kids) =>
  unstable_createElement(type, { ...(props || {}), children: kids.length <= 1 ? kids[0] : kids });

// Metro web require('x.png') → { uri } (sometimes a bare string); normalize to a url string.
const uriOf = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

function resolveCss() {
  let css = RPGUI_CSS;
  for (const key in RPGUI_IMG) {
    const uri = uriOf(RPGUI_IMG[key]);
    if (uri) css = css.split('RPGUIIMG:' + key).join(uri);
  }
  return css;
}

let injected = false;
function inject() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';
  document.head.appendChild(link);
  const style = document.createElement('style');
  style.id = 'rpgui-css';
  style.appendChild(document.createTextNode(resolveCss()));
  document.head.appendChild(style);
}
inject();

export function RpguiRoot({ children }) {
  return h('div', { className: 'rpgui-content', style: { flex: 1, display: 'flex', flexDirection: 'column' } }, children);
}
