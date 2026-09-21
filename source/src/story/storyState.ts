/**
 * The single source of truth that connects scrolling to everything visual.
 *
 *   scroll  ──►  GSAP master timeline (scrubbed)  ──►  `story` (plain object)
 *                                                          │
 *                       every R3F useFrame reads it  ◄─────┘
 *
 * It is deliberately NOT React state: mutating a plain object 60 times a second
 * costs nothing, whereas re-rendering React would. Because the timeline is
 * scrubbed, every value here is a pure function of scroll position, so
 * scrolling back up plays the whole story in reverse for free.
 */
export interface Vec3State {
  x: number;
  y: number;
  z: number;
}

export interface CandleState {
  /** 0 hidden inside the cake → 1 fully risen. */
  rise: number;
  /** 0 unlit → 1 fully lit (spark → wick glow → flame → stable). */
  light: number;
  /** 0 burning → 1 extinguished. */
  out: number;
  /** 0 → 1 smoke plume progress after extinguishing. */
  smoke: number;
}

export interface StoryState {
  /** Timeline position in scroll units (already smoothed by scrub). */
  unit: number;
  /** 0–1 through the whole experience. */
  progress: number;
  /** Smoothed scroll speed, roughly 0–1. */
  velocity: number;
  reduced: boolean;

  // ── World mood ────────────────────────────────────────────────────────────
  /** Continuous index into MOODS (background + lighting). */
  mood: number;
  fog: number;
  /** Master brightness gate used during the opening reveal. */
  exposure: number;
  /** Size/intensity of the opening light. */
  orb: number;
  dust: number;
  candleDust: number;
  /** Extra bloom kick, used for magical beats. */
  bloomPulse: number;

  // ── Camera ────────────────────────────────────────────────────────────────
  cam: Vec3State;
  look: Vec3State;
  /** Extra orbit around the look-at point, radians. */
  orbit: number;
  /** Vertical field of view in degrees (before the portrait widening). */
  fov: number;
  /** 0–1: how strongly the camera should tighten its framing on narrow screens. */
  fit: number;

  // ── Cake & candles ────────────────────────────────────────────────────────
  cake: { reveal: number; rot: number; scale: number; z: number; float: number };
  candles: CandleState[];
  wind: number;
  flicker: number;
  /** 0–1 strength of the wish heartbeat pulse. */
  wishAmt: number;

  // ── Light trails ──────────────────────────────────────────────────────────
  trails: number[];

  // ── Envelope & letter ─────────────────────────────────────────────────────
  env: {
    appear: number;
    rotY: number;
    seal: number;
    flap: number;
    slide: number;
    fold1: number;
    fold2: number;
    pulse: number;
  };
  /** 0–1 opacity of the DOM paper grain that takes over during reading. */
  paper: number;

  // ── Ambient extras ────────────────────────────────────────────────────────
  petals: number;
  heart: number;
  starTrail: number;

  // ── Finale ────────────────────────────────────────────────────────────────
  finale: {
    spark: number;
    formA: number;
    formB: number;
    burst: number;
    hearts: number;
    fireworks: number;
  };
  finalCake: number;
}

export const createStoryState = (candleCount: number): StoryState => ({
  unit: 0,
  progress: 0,
  velocity: 0,
  reduced: false,

  mood: 0,
  fog: 0.135,
  exposure: 0,
  orb: 0,
  dust: 0,
  candleDust: 0,
  bloomPulse: 0,

  cam: { x: 0, y: 1.4, z: 22 },
  look: { x: 0, y: 1.0, z: 0 },
  orbit: 0,
  fov: 36,
  fit: 0,

  cake: { reveal: 0, rot: 0, scale: 1, z: 0, float: 0 },
  candles: Array.from({ length: candleCount }, () => ({ rise: 0, light: 0, out: 0, smoke: 0 })),
  wind: 0,
  flicker: 0,
  wishAmt: 0,

  trails: [0, 0, 0],

  env: { appear: 0, rotY: 0, seal: 0, flap: 0, slide: 0, fold1: 1, fold2: 1, pulse: 0 },
  paper: 0,

  petals: 0,
  heart: 0,
  starTrail: 0,

  finale: { spark: 0, formA: 0, formB: 0, burst: 0, hearts: 0, fireworks: 0 },
  finalCake: 0,
});

/** The live object. Never reassign it — components hold this reference. */
export const story: StoryState = createStoryState(1);

/** Restore the pristine t=0 state (also needed for React StrictMode remounts). */
export const resetStory = (candleCount: number, reduced: boolean): void => {
  Object.assign(story, createStoryState(candleCount));
  story.reduced = reduced;
};
