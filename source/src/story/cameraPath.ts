/**
 * The camera's whole journey as keyframes on the scroll timeline.
 * Everything is a pure function of scroll position, so the same function also
 * gives the guiding light its route (it flies where the camera is about to go).
 */
import { at, chapters } from '@/config/chapters';
import { ENVELOPE, FINALE, GALAXY, LETTER_WORLD, LOVE, loveFocusFraction } from '@/config/world';
import { FINAL_CAKE_POS } from '@/story/cakeStage';
import { curve, type Keys } from '@/lib/curve';

type V3 = readonly [number, number, number];
type Channel = 'cx' | 'cy' | 'cz' | 'lx' | 'ly' | 'lz' | 'fov' | 'fit';

export interface CameraSample {
  cx: number;
  cy: number;
  cz: number;
  lx: number;
  ly: number;
  lz: number;
  fov: number;
  fit: number;
}

const channels: Channel[] = ['cx', 'cy', 'cz', 'lx', 'ly', 'lz', 'fov', 'fit'];
const keys: Record<Channel, Array<[number, number]>> = {
  cx: [], cy: [], cz: [], lx: [], ly: [], lz: [], fov: [], fit: [],
};
let lastU = -Infinity;

const add = (u: number, cam: V3, look: V3, fov: number, fit = 0): void => {
  const uu = Math.max(u, lastU + 0.01);
  lastU = uu;
  const values = [cam[0], cam[1], cam[2], look[0], look[1], look[2], fov, fit];
  channels.forEach((ch, i) => keys[ch].push([uu, values[i]]));
};

/** Distance at which the unfolded letter fills the frame. */
const LETTER_D = 5.0;
const LETTER_CAM: V3 = [0, LETTER_WORLD.y, LETTER_WORLD.z + LETTER_D];
const LETTER_LOOK: V3 = [0, LETTER_WORLD.y, LETTER_WORLD.z];

// ── Arrival, cake, candles, wish ────────────────────────────────────────────
add(0, [0, 1.4, 22], [0, 1.0, 0], 36);
add(at('arrival', 0.55), [0, 1.7, 15.5], [0, 1.1, 0], 37);
add(at('arrival', 1), [0, 2.2, 11.2], [0, 1.2, 0], 38);
add(at('cakeSpin', 0.5), [0, 2.9, 9.8], [0, 1.35, 0], 38);
add(at('cakeSpin', 1), [0, 3.1, 9.0], [0, 1.5, 0], 38);
add(at('candleRise', 1), [0, 3.35, 7.0], [0, 1.95, 0], 38);
add(at('lighting', 0.5), [0, 2.6, 7.6], [0, 0.95, 0], 38);
add(at('lighting', 1), [0, 2.35, 7.5], [0, 0.72, 0], 38);
add(at('wish', 1), [0, 2.3, 7.4], [0, 0.66, 0], 38);
add(at('blow', 1), [0, 2.3, 7.3], [0, 0.7, 0], 38);

// ── Pull away, follow the light down to the envelope ────────────────────────
add(at('toEnvelope', 0.3), [0, 3.2, 10.5], [0, 1.2, 0], 40);
add(at('toEnvelope', 0.62), [0, -6.0, 11.0], [0, -8.5, 0.5], 40);
add(at('toEnvelope', 1), [0, ENVELOPE.y + 0.7, 6.8], [0, ENVELOPE.y + 0.1, 0.4], 40, 0);
add(at('envelope', 0.5), [0, ENVELOPE.y + 0.4, 5.8], [0, ENVELOPE.y + 0.05, 0.2], 40, 0);
add(at('envelope', 1), [0, ENVELOPE.y + 0.6, 5.7], [0, ENVELOPE.y + 0.7, 0.3], 40, 0);

// ── The letter ───────────────────────────────────────────────────────────────
add(at('unfold', 0.55), [0, ENVELOPE.y + 1.9, 6.6], [0, ENVELOPE.y + 2.4, 0.5], 40, 0.4);
add(at('unfold', 1), LETTER_CAM, LETTER_LOOK, 40, 1);
add(at('memoryBridge', 0.5), LETTER_CAM, LETTER_LOOK, 40, 1);

// ── Memories: a slow descent to the corridor ────────────────────────────────
const descend = (f: number, y: number, fit: number): void =>
  add(at('memories', f), [0, y, LETTER_CAM[2]], [0, y, LETTER_CAM[2] - 10], 40, fit);
descend(0.15, LETTER_WORLD.y - 1.6, 0.5);
descend(0.4, -19.5, 0);
descend(0.75, -27.5, 0);

// ── Things I love: fly forward, dwell on each item ──────────────────────────
add(at('love', 0), [0, LOVE.y, LOVE.startZ], [0, LOVE.y, LOVE.startZ - 10], 40);
const dwell = chapters.love.length * 0.026;
for (let i = 0; i < LOVE.count; i++) {
  const u = at('love', loveFocusFraction(i));
  const z = LOVE.startZ - (i + 0.5) * LOVE.spacing;
  const x = i % 2 ? 0.35 : -0.35;
  const y = LOVE.y + (i % 2 ? 0.12 : -0.08);
  const fov = 46 + Math.min(i, 6) * 0.7;
  add(u - dwell, [x, y, z], [x * 0.5, y, z - 10], fov);
  add(u + dwell, [x, y, z], [x * 0.5, y, z - 10], fov);
}
add(at('love', 1), [0, LOVE.y, LOVE.endZ], [0, LOVE.y, LOVE.endZ - 12], 52);

// ── Memory galaxy: a long glide through floating photographs ────────────────
const swayX = [1.2, -1.4, 1.0, -0.8, 0.4, 0];
const swayY = [0.5, -0.4, 0.6, -0.2, 0.2, 0];
[0.14, 0.32, 0.5, 0.68, 0.86, 1].forEach((f, i) => {
  const z = GALAXY.startZ - GALAXY.length * f;
  const x = swayX[i];
  const y = GALAXY.y + swayY[i];
  add(at('galaxy', f), [x, y, z], [x * 0.35, y, z - 14], 56 - i * 0.8);
});

// ── Petals, and into the finale ──────────────────────────────────────────────
add(at('petals', 0.55), [0, LOVE.y, (GALAXY.endZ + FINALE.startZ) / 2], [0, LOVE.y, (GALAXY.endZ + FINALE.startZ) / 2 - 14], 52);
add(at('petals', 1), [0, LOVE.y, FINALE.startZ], [0, LOVE.y, FINALE.startZ - 14], 50);
add(at('finale', 0.5), [0, LOVE.y, FINALE.startZ - 1.6], [0, LOVE.y, FINALE.startZ - 14], 48);
add(at('finale', 0.985), [0, LOVE.y, FINALE.startZ - 3], [0, LOVE.y, FINALE.startZ - 14], 46);

// ── The cake returns ─────────────────────────────────────────────────────────
add(at('finalCake', 0.65), [0, FINAL_CAKE_POS.y + 2.0, FINAL_CAKE_POS.z + 9.4], [0, FINAL_CAKE_POS.y + 0.55, FINAL_CAKE_POS.z], 38);
add(at('outro', 1), [0, FINAL_CAKE_POS.y + 1.95, FINAL_CAKE_POS.z + 8.8], [0, FINAL_CAKE_POS.y + 0.55, FINAL_CAKE_POS.z], 38);

const fns = Object.fromEntries(channels.map((ch) => [ch, curve(keys[ch] as Keys)])) as Record<
  Channel,
  (x: number) => number
>;

const scratch: CameraSample = { cx: 0, cy: 0, cz: 0, lx: 0, ly: 0, lz: 0, fov: 40, fit: 0 };

/** Camera pose at a scroll position. Returns a shared object unless you pass your own. */
export const sampleCamera = (u: number, out: CameraSample = scratch): CameraSample => {
  out.cx = fns.cx(u);
  out.cy = fns.cy(u);
  out.cz = fns.cz(u);
  out.lx = fns.lx(u);
  out.ly = fns.ly(u);
  out.lz = fns.lz(u);
  out.fov = fns.fov(u);
  out.fit = fns.fit(u);
  return out;
};
