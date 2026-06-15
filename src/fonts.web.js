/* Alchemist — font loading (web).
   Inject the Google Fonts the prototype used (Fredoka / Manrope / Noto Serif SC).
   Google serves Noto Serif SC as unicode-range subsets, so only the few CJK glyphs
   actually used are downloaded. No @expo-google-fonts requires here, so the native
   ttf assets are tree-shaken out of the web bundle. */
import { useEffect, useState } from 'react';

let webInjected = false;
function injectWebFonts() {
  if (webInjected || typeof document === 'undefined') return;
  webInjected = true;
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = 'anonymous';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Noto+Serif+SC:wght@500;600;700;900&display=swap';
  document.head.appendChild(pre1);
  document.head.appendChild(pre2);
  document.head.appendChild(link);
  if (document.title !== 'Alchemist') document.title = 'Alchemist';
}

export function useAppFonts() {
  const [ready, setReady] = useState(true);
  useEffect(() => {
    injectWebFonts();
    setReady(true);
  }, []);
  return ready;
}
