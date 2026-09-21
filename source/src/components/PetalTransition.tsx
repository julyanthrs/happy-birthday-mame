import { quality } from '@/config/qualityInstance';
import { Petals } from '@/three/Petals';

/** Petals drift in at the end of the memories and return for the finale. Amount comes from `story.petals`. */
export function PetalTransition() {
  return <Petals count={quality.petals} />;
}
