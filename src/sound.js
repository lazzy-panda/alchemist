/* Alchemist — meditation bell, synthesized with the Web Audio API (no asset, no dependency,
   works offline, CSP-safe). Web-only; a silent no-op on native (Expo Go isn't the shipped target).

   A struck singing bowl is a warm fundamental plus a few inharmonic partials with long
   exponential decay, and a slightly detuned twin of the fundamental that beats slowly for the
   characteristic shimmer. Kept gentle (peak gain well under 1) so it soothes, not startles. */
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';
let ctx = null;

function audioCtx() {
  if (!WEB || typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
  return ctx;
}

// Call from a user gesture (the ▶ Start/Resume tap) so the browser unlocks audio; also used on
// resume to wake a context the browser suspended while the tab/screen was hidden.
export function primeAudio() {
  const c = audioCtx();
  if (c && c.state === 'suspended' && c.resume) { try { c.resume(); } catch (e) {} }
}

export function playBell() {
  const c = audioCtx();
  if (!c) return;
  try {
    if (c.state === 'suspended' && c.resume) c.resume(); // best effort if we're resuming from background
    const t = c.currentTime;
    const DUR = 4.2;

    const master = c.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.55, t + 0.01); // soft attack, no click
    master.gain.exponentialRampToValueAtTime(0.0001, t + DUR);
    master.connect(c.destination);

    const f0 = 432; // warm meditation fundamental
    const partials = [
      { ratio: 1.0, gain: 1.0, decay: 4.0, detune: 0 },
      { ratio: 1.0, gain: 0.6, decay: 4.0, detune: 7 }, // detuned twin → slow shimmering beat
      { ratio: 2.7, gain: 0.4, decay: 2.6, detune: 0 }, // inharmonic bowl partials
      { ratio: 5.2, gain: 0.15, decay: 1.4, detune: 0 },
    ];
    partials.forEach((p) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0 * p.ratio, t);
      if (p.detune) osc.detune.setValueAtTime(p.detune, t);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p.gain, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + p.decay + 0.1);
    });
  } catch (e) {}
}
