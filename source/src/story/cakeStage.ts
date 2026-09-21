import { at } from '@/config/chapters';
import { FINALE } from '@/config/world';

/** The cake appears twice: at the start, and again after the finale. */
export const FINAL_CAKE_START = at('finale', 0.8);
export const FINAL_CAKE_POS = { x: 0, y: FINALE.y - 1.45, z: FINALE.cakeZ } as const;
export const isFinalCakeStage = (unit: number): boolean => unit >= FINAL_CAKE_START;

/** Where the cake group sits (its plate centre) for this scroll position. */
export const cakeAnchor = (unit: number): { x: number; y: number; z: number } =>
  isFinalCakeStage(unit) ? FINAL_CAKE_POS : { x: 0, y: 0, z: 0 };
