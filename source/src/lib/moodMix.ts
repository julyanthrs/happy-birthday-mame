import { Color } from 'three';
import { MOODS } from '@/config/palette';

const parsed = MOODS.map((m) => ({
  bg: new Color(m.bg),
  ambient: new Color(m.ambient),
  key: new Color(m.key),
  rim: new Color(m.rim),
}));

export interface MixedMood {
  bg: Color;
  ambient: Color;
  key: Color;
  rim: Color;
  ambientI: number;
  keyI: number;
  rimI: number;
  env: number;
  bloom: number;
  /** 0 (dark) → 1 (bright paper), from the background luminance. */
  paper: number;
}

const out: MixedMood = {
  bg: new Color(),
  ambient: new Color(),
  key: new Color(),
  rim: new Color(),
  ambientI: 0,
  keyI: 0,
  rimI: 0,
  env: 0,
  bloom: 0,
  paper: 0,
};

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Interpolates the mood table at a fractional index. Returns a shared object — copy what you keep. */
export const mixMood = (index: number): MixedMood => {
  const i = Math.min(MOODS.length - 1, Math.max(0, index));
  const a = Math.floor(i);
  const b = Math.min(MOODS.length - 1, a + 1);
  const t = i - a;
  out.bg.copy(parsed[a].bg).lerp(parsed[b].bg, t);
  out.ambient.copy(parsed[a].ambient).lerp(parsed[b].ambient, t);
  out.key.copy(parsed[a].key).lerp(parsed[b].key, t);
  out.rim.copy(parsed[a].rim).lerp(parsed[b].rim, t);
  out.ambientI = mix(MOODS[a].ambientI, MOODS[b].ambientI, t);
  out.keyI = mix(MOODS[a].keyI, MOODS[b].keyI, t);
  out.rimI = mix(MOODS[a].rimI, MOODS[b].rimI, t);
  out.env = mix(MOODS[a].env, MOODS[b].env, t);
  out.bloom = mix(MOODS[a].bloom, MOODS[b].bloom, t);
  const lum = 0.2126 * out.bg.r + 0.7152 * out.bg.g + 0.0722 * out.bg.b; // linear luminance
  out.paper = Math.min(1, Math.max(0, (lum - 0.03) / 0.5));
  return out;
};
