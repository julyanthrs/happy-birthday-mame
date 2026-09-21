/**
 * The whole experience is ONE scrubbed GSAP timeline. Positions on that
 * timeline are measured in "scroll units". Chapter lengths below decide the
 * pacing: bigger number = slower, more scrolling for that moment.
 *
 * Changing a duration re-flows every later chapter automatically.
 */
import { birthdayContent } from '@/data/birthdayContent';

/** How many viewport-heights of scrolling one unit is worth (before the user's multiplier). */
const BASE_UNIT_VH = 0.6;
export const SCROLL_UNIT_VH = BASE_UNIT_VH * birthdayContent.settings.scrollLength;

const lengths = {
  arrival: 150, // tiny light expands, cake emerges from darkness
  cakeSpin: 160, // 360° scroll-driven rotation
  candleRise: 70, // candles spring out of the cake
  lighting: 125, // spark → wick glow → flame, one by one
  wish: 210, // very slow. "Make a wish."
  blow: 200, // wind, flicker, flames go out one at a time, smoke
  toEnvelope: 160, // camera pulls back, cream washes in, a light lands on the envelope
  envelope: 220, // flip, seal breaks, flap opens
  unfold: 160, // letter slides out, folds open, camera dives in
  letter: 640, // reading (slow and readable)
  memoryBridge: 130, // photos fall onto the letter
  memories: 760, // polaroids float through 3D (about 42 units per photo)
  love: 620, // things I love, flying through glowing objects
  galaxy: 460, // memory galaxy
  petals: 160, // petals fill the air
  finale: 620, // particles spell the message, fireworks
  finalCake: 260, // the cake returns, P.S.
  outro: 90, // calm hold
} as const;

export type ChapterName = keyof typeof lengths;

export interface ChapterRange {
  start: number;
  end: number;
  length: number;
}

const names = Object.keys(lengths) as ChapterName[];

export const chapters = (() => {
  let cursor = 0;
  const out = {} as Record<ChapterName, ChapterRange>;
  for (const name of names) {
    const length = lengths[name];
    out[name] = { start: cursor, end: cursor + length, length };
    cursor += length;
  }
  return out;
})();

export const TOTAL_UNITS = names.reduce((sum, n) => sum + lengths[n], 0);

/** Absolute timeline position at fraction `f` (0–1) of a chapter. */
export const at = (chapter: ChapterName, f = 0): number =>
  chapters[chapter].start + chapters[chapter].length * f;

/** Duration in timeline units of the slice [f0, f1] of a chapter. */
export const span = (chapter: ChapterName, f0: number, f1: number): number =>
  (f1 - f0) * chapters[chapter].length;

/** Human names for the small chapter caption. */
export const chapterLabels: Record<ChapterName, string> = {
  arrival: 'Somewhere in the dark',
  cakeSpin: 'The cake',
  candleRise: 'The cake',
  lighting: 'The candles',
  wish: 'The wish',
  blow: 'The wish',
  toEnvelope: 'A small light',
  envelope: 'The envelope',
  unfold: 'The envelope',
  letter: 'The letter',
  memoryBridge: 'The letter',
  memories: 'Memories',
  love: 'Things I love',
  galaxy: 'Memory galaxy',
  petals: 'Petals',
  finale: 'Happy birthday',
  finalCake: 'One more thing',
  outro: 'One more thing',
};

export const chapterAtUnit = (unit: number): ChapterName => {
  for (const name of names) if (unit < chapters[name].end) return name;
  return names[names.length - 1];
};

/** Spacer height in vh that gives exactly TOTAL_UNITS of scrollable distance. */
export const scrollSpacerVh = 100 + TOTAL_UNITS * SCROLL_UNIT_VH;
