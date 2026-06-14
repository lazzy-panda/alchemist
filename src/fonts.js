/* Alchemist — font loading.
   Web: inject the same Google Fonts the prototype used (Fredoka / Manrope / Noto Serif SC).
        Google serves Noto Serif SC as unicode-range subsets, so only the few CJK glyphs
        actually used are downloaded — far lighter than bundling the whole CJK font.
   Native: alias Fredoka/Manrope to a representative weight; han falls back to system CJK. */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';

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
  const [ready, setReady] = useState(WEB);

  useEffect(() => {
    if (WEB) {
      injectWebFonts();
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const Font = require('expo-font');
        const fredoka = require('@expo-google-fonts/fredoka');
        const manrope = require('@expo-google-fonts/manrope');
        await Font.loadAsync({
          Fredoka: fredoka.Fredoka_500Medium,
          Manrope: manrope.Manrope_600SemiBold,
        });
      } catch (e) {
        // fonts are non-critical — fall through to system fonts
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
