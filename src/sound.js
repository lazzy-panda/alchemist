/* Alchemist — meditation bell, synthesized with the Web Audio API (no asset, no dependency,
   works offline, CSP-safe). Web-only; a silent no-op on native (Expo Go isn't the shipped target).

   A struck singing bowl is a warm fundamental plus a few inharmonic partials with long
   exponential decay, and a slightly detuned twin of the fundamental that beats slowly for the
   characteristic shimmer. Kept gentle (peak gain well under 1) so it soothes, not startles.

   Background behaviour (the hard part): a web page can't run JS while the screen is off, so the
   chime is PRE-ARMED on the audio clock at start — scheduled to fire at `now + remaining`. Where
   the browser keeps the AudioContext alive while hidden (desktop hidden tab, lenient Android
   webviews) it sounds on time with no JS. When the OS suspends the context (mobile screen-off),
   its clock freezes; on return we see the pre-armed chime never played (`currentTime` hasn't
   reached its start) and ring immediately — or, if audio is still gesture-locked, on the very
   next touch. So the bell rings on time when the platform allows, otherwise the instant you're back. */
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';
let ctx = null;
let scheduled = null; // { startAt, nodes } — the currently pre-armed chime (oscillators self-stop)
let armed = false; // a one-shot "ring on the next user gesture" listener is attached

function audioCtx() {
  if (!WEB || typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
  return ctx;
}

function resume(c) {
  if (c && c.state === 'suspended' && c.resume) { try { c.resume(); } catch (e) {} }
}

// Call from a user gesture (the ▶ Start/Resume tap) so the browser unlocks audio; also used on
// resume to wake a context the browser suspended while the tab/screen was hidden.
export function primeAudio() {
  const c = audioCtx();
  if (c) resume(c);
}

// build the bell voices starting at absolute audio-time `startAt`; returns the nodes so a
// still-pending chime can be cancelled (pause / re-anchor / superseded by an immediate ring).
function buildBell(c, startAt) {
  const nodes = [];
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.exponentialRampToValueAtTime(0.55, startAt + 0.01); // soft attack, no click
  master.gain.exponentialRampToValueAtTime(0.0001, startAt + 4.2);
  master.connect(c.destination);
  nodes.push(master);

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
    osc.frequency.setValueAtTime(f0 * p.ratio, startAt);
    if (p.detune) osc.detune.setValueAtTime(p.detune, startAt);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.exponentialRampToValueAtTime(p.gain, startAt + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + p.decay);
    osc.connect(g);
    g.connect(master);
    osc.start(startAt);
    osc.stop(startAt + p.decay + 0.1);
    nodes.push(osc);
  });
  return { startAt, nodes };
}

function stopNodes(s) {
  if (!s) return;
  // stopping an oscillator whose scheduled start is still in the future cancels it silently
  s.nodes.forEach((n) => { if (n.stop) { try { n.stop(); } catch (e) {} } });
}

// Pre-arm the chime to sound in `delaySec` of audio time. Called when the timer starts and
// re-called on every resume to re-anchor to the wall clock after suspended (frozen) audio time.
export function scheduleBell(delaySec) {
  const c = audioCtx();
  if (!c) return;
  resume(c);
  stopNodes(scheduled); // replace any previous arming
  const startAt = c.currentTime + Math.max(0, delaySec || 0);
  scheduled = buildBell(c, startAt);
}

// Cancel a pending pre-armed chime (pause / reset / leaving the timer). A chime that already
// started ringing is not tracked here, so it rings out naturally.
export function cancelBell() {
  stopNodes(scheduled);
  scheduled = null;
}

function armGesture() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const fire = () => {
    const c = audioCtx();
    if (c) { resume(c); buildBell(c, c.currentTime + 0.05); }
    cleanup();
  };
  const cleanup = () => {
    armed = false;
    window.removeEventListener('pointerdown', fire, true);
    window.removeEventListener('touchstart', fire, true);
    window.removeEventListener('keydown', fire, true);
  };
  window.addEventListener('pointerdown', fire, true);
  window.addEventListener('touchstart', fire, true);
  window.addEventListener('keydown', fire, true);
}

// Wall-clock completion reached (from the timer tick / on resume): make sure the chime is heard
// exactly once — recognising a pre-armed chime that already sounded so we never double-ring.
export function ringBellNow() {
  const c = audioCtx();
  if (!c) return;
  if (scheduled && c.currentTime >= scheduled.startAt - 0.2) { scheduled = null; return; } // pre-armed chime already sounding (200ms grace at the boundary)
  stopNodes(scheduled); // pending but not yet due → drop it and ring now instead
  scheduled = null;
  if (c.state === 'running') { buildBell(c, c.currentTime + 0.02); return; }
  resume(c);
  armGesture(); // suspended & likely gesture-locked (mobile back from background) → ring on the first touch
}
