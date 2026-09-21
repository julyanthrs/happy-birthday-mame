import { at, type ChapterName } from '@/config/chapters';
import { smoothstep } from '@/lib/math';

/** Fade-in start, fade-in end, fade-out start, fade-out end — in scroll units. */
export type Window4 = readonly [number, number, number, number];

/** 0 → 1 → 0 across a window. Use a huge fade-out end for "stay until the end". */
export const trap = (u: number, w: Window4): number => smoothstep(w[0], w[1], u) * (1 - smoothstep(w[2], w[3], u));

/** Builds a window from chapter fractions (fractions may spill into neighbouring chapters). */
export const win = (chapter: ChapterName, a: number, b: number, c: number, d: number): Window4 => [
  at(chapter, a),
  at(chapter, b),
  at(chapter, c),
  at(chapter, d),
];

/** A window that stays fully visible from `b` on. */
export const winFrom = (chapter: ChapterName, a: number, b: number): Window4 => [at(chapter, a), at(chapter, b), 1e9, 1e9 + 1];
