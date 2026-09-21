/**
 * The script. `applyStory(unit)` turns one number — the scroll position — into
 * every animated value in the experience. It is a pure function of `unit`, which
 * is why the whole story plays backwards when you scroll up, and why jumping
 * anywhere (a reload, a scrollbar drag) always lands in a consistent scene.
 *
 * Read it top to bottom like a screenplay; chapter lengths live in
 * src/config/chapters.ts.
 */
import { at, TOTAL_UNITS, type ChapterName } from '@/config/chapters';
import { candleLayout, extinguishRanks } from '@/config/candles';
import { MOOD } from '@/config/palette';
import { curve } from '@/lib/curve';
import { clamp, invLerp, lerp, smoothstep, TAU } from '@/lib/math';
import { sampleCamera } from '@/story/cameraPath';
import { FINAL_CAKE_START } from '@/story/cakeStage';
import { story } from '@/story/storyState';

const ease = (x: number): number => smoothstep(0, 1, x);
const bump = (x: number): number => Math.sin(Math.PI * clamp(x));

// ── Guiding-light route ──────────────────────────────────────────────────────
/** The light that leads the camera from the letter to the finale. */
export const ROUTE_START = at('memoryBridge', 0.5);
export const ROUTE_END = at('finale', 0.55);
/** How many scroll units ahead of the camera the light flies. */
export const ROUTE_LEAD = 70;

// ── Slow-changing atmosphere, as keyframe curves ─────────────────────────────
const moodAt = curve([
  [0, MOOD.void],
  [at('arrival', 0.35), MOOD.void],
  [at('arrival', 1), MOOD.candlelight],
  [at('toEnvelope', 0.15), MOOD.candlelight],
  [at('toEnvelope', 0.9), MOOD.paper],
  [at('memoryBridge', 0.3), MOOD.paper],
  [at('memoryBridge', 1), MOOD.rose],
  [at('memories', 0.8), MOOD.rose],
  [at('memories', 1), MOOD.love],
  [at('galaxy', 0), MOOD.love],
  [at('galaxy', 0.3), MOOD.galaxy],
  [at('petals', 0.25), MOOD.galaxy],
  [at('petals', 1), MOOD.finale],
  [at('finale', 0.9), MOOD.finale],
  [at('finalCake', 0.15), MOOD.ending],
  [TOTAL_UNITS, MOOD.ending],
]);

const fogAt = curve([
  [0, 0.135],
  [at('arrival', 0.3), 0.12],
  [at('arrival', 1), 0.03],
  [at('blow', 1), 0.026],
  [at('envelope', 0), 0.02],
  [at('letter', 0), 0.02],
  [at('love', 0), 0.02],
  [at('love', 1), 0.018],
  [at('galaxy', 0.5), 0.012],
  [at('finale', 0), 0.012],
  [TOTAL_UNITS, 0.014],
]);

const orbAt = curve([
  [0, 0.03],
  [at('arrival', 0.15), 0.1],
  [at('arrival', 0.7), 1],
  [at('arrival', 1), 0.6],
  [at('cakeSpin', 0.15), 0],
  [TOTAL_UNITS, 0],
]);

const dustAt = curve([
  [0, 0],
  [at('arrival', 0.12), 0.15],
  [at('arrival', 0.6), 0.7],
  [at('toEnvelope', 0.5), 0.6],
  [at('envelope', 0.5), 0.35],
  [at('letter', 0.5), 0.3],
  [at('memoryBridge', 0.6), 0.55],
  [at('memories', 0.5), 0.7],
  [at('love', 0.5), 0.85],
  [at('galaxy', 0.5), 0.75],
  [at('finale', 0.5), 1],
  [at('finalCake', 0.5), 0.7],
  [TOTAL_UNITS, 0.6],
]);

const petalsAt = curve([
  [0, 0],
  [at('memories', 0.78), 0],
  [at('memories', 0.95), 0.04],
  [at('love', 0.2), 0.06],
  [at('love', 1), 0.1],
  [at('galaxy', 1), 0.1],
  [at('petals', 0.2), 0.16],
  [at('petals', 0.55), 0.7],
  [at('petals', 1), 0.85],
  [at('finale', 0.5), 0.85],
  [at('finale', 0.66), 1],
  [at('finale', 1), 0.55],
  [at('finalCake', 0.5), 0.15],
  [TOTAL_UNITS, 0.1],
]);

const fireworksAt = curve([
  [0, 0],
  [at('finale', 0.4), 0],
  [at('finale', 0.55), 0.35],
  [at('finale', 0.72), 1],
  [at('finale', 0.92), 0.6],
  [at('finalCake', 0.5), 0.15],
  [TOTAL_UNITS, 0.1],
]);

// ── Candles ──────────────────────────────────────────────────────────────────
const CAKE_REST_ROTATION = 0.35 + TAU;
const blowRanks = (count: number): number[] => extinguishRanks(candleLayout(count), CAKE_REST_ROTATION);
let ranks: number[] = [];

export const applyStory = (u: number): void => {
  const s = story;
  const p = (chapter: ChapterName, a = 0, b = 1): number => invLerp(at(chapter, a), at(chapter, b), u);

  s.unit = u;
  s.progress = clamp(u / TOTAL_UNITS);

  // World mood ───────────────────────────────────────────────────────────────
  s.mood = moodAt(u);
  s.fog = fogAt(u);
  s.exposure = ease(p('arrival', 0.15, 0.85));
  s.orb = orbAt(u);
  s.dust = dustAt(u);
  s.candleDust = ease(p('candleRise', 0.5, 1)) * (1 - ease(p('blow', 0.7, 1)));
  s.bloomPulse = 0.9 * bump(p('finale', 0.56, 0.7));

  // Camera ───────────────────────────────────────────────────────────────────
  const c = sampleCamera(u);
  s.cam.x = c.cx;
  s.cam.y = c.cy;
  s.cam.z = c.cz;
  s.look.x = c.lx;
  s.look.y = c.ly;
  s.look.z = c.lz;
  s.fov = c.fov;
  s.fit = c.fit;
  s.orbit = 0.34 * Math.sin(Math.PI * p('cakeSpin'));

  // Cake ─────────────────────────────────────────────────────────────────────
  const spin = p('cakeSpin');
  const returning = u >= FINAL_CAKE_START;
  s.cake.reveal = returning ? ease(p('finalCake', 0.02, 0.45)) : ease(p('arrival', 0.35, 1));
  s.cake.rot =
    0.35 * p('arrival') +
    TAU * (0.7 * spin + 0.3 * ease(spin)) +
    0.6 * ease(p('toEnvelope')) +
    1.4 * p('finalCake');
  s.cake.scale = returning ? 0.4 + 0.6 * ease(p('finalCake', 0.02, 0.5)) : lerp(1, 0.6, ease(p('toEnvelope', 0, 0.7)));
  s.cake.z = returning ? 0 : -8 * ease(p('toEnvelope', 0, 0.7));
  s.cake.float = Math.sin(u * 0.03) * 0.07 * s.cake.reveal;

  // Candles: rise, light, wish, blow, smoke ─────────────────────────────────
  const n = s.candles.length;
  if (ranks.length !== n) ranks = blowRanks(n);
  const pRise = p('candleRise');
  const pLight = p('lighting');
  const pBlow = p('blow');
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) : 0;
    const rk = n > 1 ? ranks[i] / (n - 1) : 0;
    const candle = s.candles[i];
    candle.rise = ease(clamp((pRise - k * 0.66) / 0.34));
    candle.light = clamp((pLight - (0.02 + k * 0.62)) / 0.34);
    const outStart = 0.36 + 0.28 * rk;
    candle.out = clamp((pBlow - outStart) / 0.1);
    const smokeStart = outStart + 0.05;
    candle.smoke = clamp((pBlow - smokeStart) / (0.98 + 0.02 * rk - smokeStart));
  }
  s.wind = ease(p('blow', 0.12, 0.3)) * (1 - ease(p('blow', 0.7, 0.92)));
  s.flicker = 0.3 + 0.7 * ease(p('blow', 0.1, 0.3)) * (1 - ease(p('blow', 0.7, 0.9)));
  s.wishAmt = ease(p('wish', 0, 0.25)) * (1 - ease(p('blow', 0.1, 0.3)));

  // Envelope & letter ────────────────────────────────────────────────────────
  s.env.appear = ease(p('toEnvelope', 0.5, 1));
  s.env.rotY = lerp(0.9, 0, ease(p('envelope', 0, 0.5)));
  s.env.seal = ease(p('envelope', 0.28, 0.5));
  s.env.flap = ease(p('envelope', 0.45, 0.88));
  s.env.slide = ease(p('unfold', 0, 0.32));
  s.env.fold1 = 1 - ease(p('unfold', 0.3, 0.6));
  s.env.fold2 = 1 - ease(p('unfold', 0.5, 0.8));
  s.env.pulse = bump(invLerp(at('toEnvelope', 0.82), at('envelope', 0.25), u));
  s.paper = ease(p('unfold', 0.8, 1)) * (1 - ease(p('memoryBridge', 0.5, 1)));

  // Light trails ─────────────────────────────────────────────────────────────
  s.trails[0] = p('cakeSpin', 0.04, 0.96);
  s.trails[1] = ease(p('toEnvelope', 0.06, 0.9));
  s.trails[2] = invLerp(ROUTE_START, ROUTE_END, u + ROUTE_LEAD);

  // Ambient extras ───────────────────────────────────────────────────────────
  s.petals = petalsAt(u);
  s.heart = Math.max(
    ease(p('wish', 0.35, 0.5)) * (1 - ease(p('blow', 0.05, 0.2))),
    0.7 * ease(p('galaxy', 0.1, 0.3)) * (1 - ease(p('galaxy', 0.8, 1))),
    ease(p('finalCake', 0.4, 0.7)),
  );
  s.starTrail = ease(p('finale', 0.28, 0.4));

  // Finale ───────────────────────────────────────────────────────────────────
  s.finale.spark = ease(p('finale', 0, 0.12));
  s.finale.formA = ease(p('finale', 0.08, 0.36));
  s.finale.formB = ease(p('finale', 0.34, 0.5));
  s.finale.burst = ease(p('finale', 0.56, 0.7));
  s.finale.hearts = ease(p('finale', 0.6, 0.78)) * (1 - ease(p('finalCake', 0, 0.4)));
  s.finale.fireworks = fireworksAt(u);
  s.finalCake = ease(p('finalCake', 0.02, 0.55));
};
