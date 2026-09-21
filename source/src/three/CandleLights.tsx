import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { PointLight } from 'three';
import type { CandleSpot } from '@/config/candles';
import { CAKE } from '@/config/world';
import { heartbeat } from '@/lib/beat';
import { candleStages, type FlameStages } from '@/three/Flame';
import { story } from '@/story/storyState';

interface Props {
  spots: CandleSpot[];
  /** How many real lights to use. Candles share them round-robin. */
  lightCount: number;
}

/** A small, fixed set of warm point lights that stand in for all the flames. */
export function CandleLights({ spots, lightCount }: Props) {
  const refs = useRef<Array<PointLight | null>>([]);
  const stages = useMemo<FlameStages>(() => ({ spark: 0, wick: 0, grow: 0, alive: 1, ember: 0 }), []);
  const count = Math.max(1, Math.min(lightCount, spots.length));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const beat = story.wishAmt * heartbeat(t);
    const strength = new Array<number>(count).fill(0);
    story.candles.forEach((c, i) => {
      candleStages(c, stages);
      strength[i % count] += Math.min(1, stages.grow) * stages.alive;
    });
    for (let k = 0; k < count; k++) {
      const light = refs.current[k];
      if (!light) continue;
      const flick = 0.9 + 0.1 * Math.sin(t * 12 + k * 1.7) * Math.sin(t * 5.1 + k);
      light.intensity = strength[k] * (1.5 + 0.9 * beat) * flick * (spots.length / count) * 0.62;
    }
  });

  return (
    <>
      {Array.from({ length: count }, (_, k) => {
        const s = spots[Math.min(spots.length - 1, Math.floor((k * spots.length) / count))];
        return (
          <pointLight
            key={k}
            ref={(l) => {
              refs.current[k] = l;
            }}
            position={[s.x * 0.6, CAKE.topY + CAKE.candleH + 0.4, s.z * 0.6]}
            color="#ffb56b"
            intensity={0}
            distance={9}
            decay={2}
          />
        );
      })}
    </>
  );
}
