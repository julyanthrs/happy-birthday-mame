/**
 * Mood palette. `story.mood` is a continuous index into this table; the
 * background, fog and lighting all interpolate between neighbouring entries so
 * the world glides from one emotional lighting state to the next.
 */
export interface Mood {
  name: string;
  bg: string;
  ambient: string;
  ambientI: number;
  key: string;
  keyI: number;
  rim: string;
  rimI: number;
  env: number;
  bloom: number;
}

export const MOODS: Mood[] = [
  { name: 'void', bg: '#050205', ambient: '#7a4a5a', ambientI: 0.06, key: '#ffd9a8', keyI: 0, rim: '#ff9db5', rimI: 0, env: 0.05, bloom: 0.9 },
  { name: 'candlelight', bg: '#170a11', ambient: '#c27890', ambientI: 0.55, key: '#ffcc94', keyI: 1.7, rim: '#ff8fb0', rimI: 1.4, env: 0.85, bloom: 0.85 },
  { name: 'paper', bg: '#eadcc4', ambient: '#fff8ee', ambientI: 1.05, key: '#fffaf2', keyI: 1.55, rim: '#ffeee2', rimI: 0.25, env: 0.3, bloom: 0.1 },
  { name: 'rose', bg: '#5a2a3b', ambient: '#f2b5c0', ambientI: 0.75, key: '#ffd7c0', keyI: 1.0, rim: '#ff9db5', rimI: 0.8, env: 0.5, bloom: 0.45 },
  { name: 'love', bg: '#1e0c17', ambient: '#d9a0b0', ambientI: 0.38, key: '#ffd9a0', keyI: 0.7, rim: '#ff9db5', rimI: 0.7, env: 0.35, bloom: 0.9 },
  { name: 'galaxy', bg: '#07040a', ambient: '#a07a8a', ambientI: 0.2, key: '#ffd9a0', keyI: 0.4, rim: '#e8b6c4', rimI: 0.3, env: 0.2, bloom: 1.0 },
  { name: 'finale', bg: '#1b0a15', ambient: '#d9a3ae', ambientI: 0.4, key: '#f1d9a8', keyI: 0.9, rim: '#ffb0c8', rimI: 0.9, env: 0.4, bloom: 1.1 },
  { name: 'ending', bg: '#26111c', ambient: '#e0b0b8', ambientI: 0.55, key: '#ffd9a8', keyI: 1.0, rim: '#ffa8c0', rimI: 1.0, env: 0.5, bloom: 0.8 },
];

/** Numeric mood indices, so the timeline reads like a script. */
export const MOOD = {
  void: 0,
  candlelight: 1,
  paper: 2,
  rose: 3,
  love: 4,
  galaxy: 5,
  finale: 6,
  ending: 7,
} as const;

/** Colours for the thin scroll-progress line (gold → rose → cream → gold). */
export const PROGRESS_STOPS: Array<{ at: number; color: string }> = [
  { at: 0, color: '#c9a35f' },
  { at: 0.22, color: '#ead4a4' },
  { at: 0.3, color: '#d9a3ae' },
  { at: 0.44, color: '#f4e8d2' },
  { at: 0.58, color: '#d9a3ae' },
  { at: 0.8, color: '#ead4a4' },
  { at: 1, color: '#c9a35f' },
];
