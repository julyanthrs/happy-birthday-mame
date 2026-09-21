/**
 * Quality tiers. The experience is animation-heavy, so every expensive knob
 * (particles, post-processing, lights, geometry detail) scales with the device.
 */
export type Tier = 'desktop' | 'tablet' | 'mobile';

export interface Quality {
  tier: Tier;
  dpr: [number, number];
  postprocessing: boolean;
  shadows: boolean;
  dust: number;
  candleDust: number;
  petals: number;
  hearts: number;
  fireworkParticles: number;
  textParticlesLineOne: number;
  textParticlesLineTwo: number;
  galaxyPhotos: number;
  cakeSegments: number;
  drips: number;
  pearls: number;
  candleLights: number;
  smokePuffs: number;
  trailPoints: number;
}

const presets: Record<Tier, Omit<Quality, 'tier'>> = {
  desktop: {
    dpr: [1, 2],
    postprocessing: true,
    shadows: true,
    dust: 900,
    candleDust: 120,
    petals: 90,
    hearts: 36,
    fireworkParticles: 70,
    textParticlesLineOne: 3200,
    textParticlesLineTwo: 1500,
    galaxyPhotos: 30,
    cakeSegments: 72,
    drips: 22,
    pearls: 40,
    candleLights: 14,
    smokePuffs: 14,
    trailPoints: 56,
  },
  tablet: {
    dpr: [1, 1.75],
    postprocessing: true,
    shadows: false,
    dust: 520,
    candleDust: 70,
    petals: 55,
    hearts: 24,
    fireworkParticles: 46,
    textParticlesLineOne: 2000,
    textParticlesLineTwo: 950,
    galaxyPhotos: 20,
    cakeSegments: 56,
    drips: 18,
    pearls: 32,
    candleLights: 5,
    smokePuffs: 10,
    trailPoints: 40,
  },
  mobile: {
    dpr: [1, 1.5],
    postprocessing: false,
    shadows: false,
    dust: 260,
    candleDust: 36,
    petals: 32,
    hearts: 14,
    fireworkParticles: 30,
    textParticlesLineOne: 1300,
    textParticlesLineTwo: 620,
    galaxyPhotos: 12,
    cakeSegments: 40,
    drips: 14,
    pearls: 24,
    candleLights: 2,
    smokePuffs: 8,
    trailPoints: 28,
  },
};

export const detectQuality = (): Quality => {
  if (typeof window === 'undefined') return { tier: 'desktop', ...presets.desktop };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const width = Math.min(window.innerWidth, window.innerHeight * 1.8);
  const cores = navigator.hardwareConcurrency ?? 8;
  let tier: Tier = 'desktop';
  if (width < 700 || (coarse && window.innerWidth < 820)) tier = 'mobile';
  else if (coarse || window.innerWidth < 1100 || cores <= 4) tier = 'tablet';
  return { tier, ...presets[tier] };
};
