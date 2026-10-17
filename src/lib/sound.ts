// Tiny synthesized sound effects — no audio files to download.
import { load, save } from './storage';

let ctx: AudioContext | null = null;
let muted = load<boolean>('a30:muted') ?? false;

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  save('a30:muted', value);
}

/** Must be called from a tap (iOS only allows audio after a user gesture). */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx?.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  correct() {
    tone(660, 0, 0.12, 'triangle');
    tone(880, 0.09, 0.12, 'triangle');
    tone(1320, 0.18, 0.22, 'triangle');
  },
  wrong() {
    tone(220, 0, 0.18, 'sawtooth', 0.06);
    tone(165, 0.15, 0.32, 'sawtooth', 0.06);
  },
  tick() {
    tone(1000, 0, 0.05, 'square', 0.03);
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.1));
    tone(1568, 0.5, 0.6, 'sine', 0.06);
  },
};
