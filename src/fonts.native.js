/* Alchemist — font loading (native).
   Alias Fredoka/Manrope to a representative weight; han falls back to system CJK. */
import { useEffect, useState } from 'react';

export function useAppFonts() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
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
