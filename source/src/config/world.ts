/**
 * Where things live in 3D space. The camera flies down from the cake to the
 * envelope, then forward along -Z through the love corridor, the memory galaxy
 * and into the finale. Keeping the layout here means the DOM (which needs to
 * know *when* an item is in focus) and WebGL (which needs to know *where*)
 * always agree.
 */
import { birthdayContent } from '@/data/birthdayContent';

export const CAKE = {
  plateY: 0,
  bottomR: 1.55,
  bottomH: 0.95,
  topR: 1.0,
  topH: 0.8,
  get topY() {
    return this.bottomH + this.topH;
  },
  candleRingR: 0.56,
  candleH: 0.58,
} as const;

export const ENVELOPE = {
  x: 0,
  y: -16,
  z: 0,
  w: 3.4,
  h: 2.3,
  flapH: 1.45,
  letterW: 2.8,
  letterSegH: 1.3,
} as const;

/** Letter's centre (in world space) once fully pulled out and unfolded. */
export const LETTER_WORLD = {
  x: ENVELOPE.x,
  y: ENVELOPE.y + 3.4,
  z: ENVELOPE.z + 0.9,
} as const;

const loveCount = birthdayContent.thingsILove.items.length;

export const LOVE = {
  y: -32,
  spacing: 12,
  count: loveCount,
  startZ: 6,
  /** How far in front of the camera an item's glyph sits at the moment it's in focus. */
  ahead: 5,
  get endZ() {
    return this.startZ - this.count * this.spacing;
  },
  /** Chapter fraction where the camera starts / stops travelling. */
  travelFrom: 0.07,
  travelTo: 0.97,
} as const;

/** Chapter fraction (0–1) of the `love` chapter at which item `i` is centred. */
export const loveFocusFraction = (i: number): number =>
  LOVE.travelFrom + ((i + 0.5) / LOVE.count) * (LOVE.travelTo - LOVE.travelFrom);

/** World Z of the glyph that belongs to love item `i`. */
export const loveGlyphZ = (i: number): number => LOVE.startZ - (i + 0.5) * LOVE.spacing - LOVE.ahead;

export const GALAXY = {
  y: LOVE.y,
  length: 150,
  get startZ() {
    return LOVE.endZ;
  },
  get endZ() {
    return LOVE.endZ - this.length;
  },
} as const;

export const FINALE = {
  y: LOVE.y,
  /** Camera Z at the very start of the finale. */
  get startZ() {
    return GALAXY.endZ - 46;
  },
  /** Where the returning cake sits (world). */
  get cakeZ() {
    return this.startZ - 9;
  },
} as const;
