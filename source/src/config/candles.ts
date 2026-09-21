import { CAKE } from '@/config/world';
import { mulberry32, TAU } from '@/lib/math';

export interface CandleSpot {
  /** Position on the top tier, in cake-local space. */
  x: number;
  z: number;
}

/** One ring for up to 8 candles, otherwise an outer and an inner ring. */
export const candleLayout = (count: number): CandleSpot[] => {
  const spots: CandleSpot[] = [];
  const ring = (n: number, r: number, offset: number) => {
    for (let i = 0; i < n; i++) {
      const a = offset + (i / n) * TAU;
      spots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
  };
  if (count <= 8) {
    ring(count, CAKE.candleRingR, Math.PI / 2);
  } else {
    const inner = Math.floor(count / 3);
    ring(count - inner, CAKE.candleRingR + 0.1, Math.PI / 2);
    ring(inner, 0.26, 0);
  }
  return spots;
};

/**
 * Which candle goes out when. The breath comes from the left of the screen, so
 * candles on that side die first; a little jitter keeps it from looking scripted.
 * Returns a rank (0 = first to go out) for each candle.
 */
export const extinguishRanks = (spots: CandleSpot[], cakeRotation: number): number[] => {
  const rand = mulberry32(11);
  const c = Math.cos(cakeRotation);
  const s = Math.sin(cakeRotation);
  const scored = spots.map((p, i) => ({ i, score: p.x * c + p.z * s + (rand() - 0.5) * 0.45 }));
  scored.sort((a, b) => a.score - b.score);
  const ranks = new Array<number>(spots.length);
  scored.forEach((entry, rank) => {
    ranks[entry.i] = rank;
  });
  return ranks;
};
