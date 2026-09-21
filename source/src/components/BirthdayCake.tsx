import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group } from 'three';
import { CandleFlames } from '@/components/CandleFlames';
import { CakeModel } from '@/three/CakeModel';
import { Orb } from '@/three/Orb';
import { cakeAnchor } from '@/story/cakeStage';
import { pointer } from '@/story/pointer';
import { story } from '@/story/storyState';

/**
 * The cake group. Its position, spin and scale all come from `story`, plus a
 * gentle turn toward the pointer. (Lights live inside, so this group is never
 * hidden — hiding a light would change the shader program.)
 */
export function BirthdayCake() {
  const group = useRef<Group>(null);
  const turn = useRef(0);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = story;
    const a = cakeAnchor(s.unit);
    g.position.set(a.x, a.y + s.cake.float - (1 - s.cake.reveal) * 0.3, a.z + s.cake.z);
    turn.current = MathUtils.damp(turn.current, s.reduced ? 0 : pointer.sx * 0.22, 4, dt);
    g.rotation.y = s.cake.rot + turn.current;
    g.scale.setScalar(s.cake.scale * (0.96 + 0.04 * s.cake.reveal));
  });

  return (
    <group ref={group}>
      <CakeModel />
      <CandleFlames />
      <Orb />
    </group>
  );
}
