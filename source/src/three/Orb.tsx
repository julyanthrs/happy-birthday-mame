import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type PointLight, type Sprite, type SpriteMaterial } from 'three';
import { getGlowTexture, getStarTexture } from '@/three/textures';
import { story } from '@/story/storyState';

/**
 * The very first thing you see: one tiny warm light in the dark. It swells,
 * lights the cake, then hands over to the candles.
 */
export function Orb() {
  const halo = useRef<Sprite>(null);
  const glint = useRef<Sprite>(null);
  const light = useRef<PointLight>(null);
  const glow = useMemo(() => getGlowTexture(), []);
  const star = useMemo(() => getStarTexture(), []);

  useFrame((state) => {
    const o = story.orb;
    const t = state.clock.elapsedTime;
    const pulse = 1 + 0.06 * Math.sin(t * 2.1);
    if (halo.current) {
      halo.current.visible = o > 0.001;
      halo.current.scale.setScalar((0.16 + o * 4.2) * pulse);
      (halo.current.material as SpriteMaterial).opacity = Math.min(1, 0.55 + o * 0.5);
    }
    if (glint.current) {
      glint.current.visible = o > 0.001;
      glint.current.scale.setScalar((0.1 + o * 1.5) * pulse);
      (glint.current.material as SpriteMaterial).rotation = t * 0.3;
      (glint.current.material as SpriteMaterial).opacity = 0.35 + o * 0.5;
    }
    if (light.current) light.current.intensity = 75 * Math.pow(o, 1.4);
  });

  return (
    <group position={[0, 2.9, 0.4]}>
      <sprite ref={halo} renderOrder={20}>
        <spriteMaterial map={glow} color="#ffd39a" blending={AdditiveBlending} transparent depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
      <sprite ref={glint} renderOrder={21}>
        <spriteMaterial map={star} color="#fff2d0" blending={AdditiveBlending} transparent depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
      <pointLight ref={light} color="#ffcf94" intensity={0} distance={26} decay={2} />
    </group>
  );
}
