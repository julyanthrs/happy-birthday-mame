import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, type Group, type Mesh, type MeshBasicMaterial, type Sprite, type SpriteMaterial } from 'three';
import type { CandleSpot } from '@/config/candles';
import { CAKE } from '@/config/world';
import { clamp } from '@/lib/math';
import { Flame, candleStages, type FlameStages } from '@/three/Flame';
import { getCandleTexture, getGlowTexture, getStarTexture } from '@/three/textures';
import { story } from '@/story/storyState';

/** Springy rise: overshoots a touch, then settles. Input and output are 0–1. */
export const spring = (t: number): number => {
  const x = clamp(t);
  return 1 - Math.exp(-7 * x) * Math.cos(9 * x);
};

const BODY_R = 0.036;
const WICK_H = 0.07;

interface Props {
  index: number;
  spot: CandleSpot;
}

/** One candle: striped wax, wick, ember, flame, halo and the lighting spark. */
export function Candle({ index, spot }: Props) {
  const group = useRef<Group>(null);
  const ember = useRef<Mesh>(null);
  const halo = useRef<Sprite>(null);
  const spark = useRef<Sprite>(null);
  const stages = useMemo<FlameStages>(() => ({ spark: 0, wick: 0, grow: 0, alive: 1, ember: 0 }), []);
  const bodyMap = useMemo(() => {
    const t = getCandleTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(1, 1.6);
    return t;
  }, []);
  const glow = useMemo(() => getGlowTexture(), []);
  const star = useMemo(() => getStarTexture(), []);
  const embed = useMemo(() => new Color(), []);

  useFrame((state) => {
    const c = story.candles[index];
    const g = group.current;
    if (!g) return;
    g.visible = c.rise > 0.001;
    if (!g.visible) return;

    const r = spring(c.rise);
    g.position.y = CAKE.topY - CAKE.candleH * (1 - r);
    g.rotation.z = Math.exp(-6 * c.rise) * Math.sin(c.rise * 22 + index) * 0.14;

    candleStages(c, stages);
    const t = state.clock.elapsedTime;
    const flick = 0.88 + 0.12 * Math.sin(t * 13 + index * 2.1) * Math.sin(t * 7.3 + index);
    const h = stages.grow * stages.alive;

    if (halo.current) {
      const m = halo.current.material as SpriteMaterial;
      m.opacity = 0.5 * Math.min(1, h) * flick;
      halo.current.scale.setScalar(0.35 + 0.75 * Math.min(1.1, h));
      halo.current.visible = h > 0.01;
    }
    if (spark.current) {
      const m = spark.current.material as SpriteMaterial;
      m.opacity = stages.spark;
      spark.current.scale.setScalar(0.06 + 0.24 * stages.spark);
      m.rotation = t * 1.6 + index;
      spark.current.visible = stages.spark > 0.01;
    }
    if (ember.current) {
      const e = stages.ember;
      embed.setRGB(1.4 * e, 0.5 * e, 0.12 * e);
      (ember.current.material as MeshBasicMaterial).color.copy(embed);
    }
  });

  return (
    <group ref={group} position={[spot.x, CAKE.topY - CAKE.candleH, spot.z]} visible={false}>
      <mesh position={[0, CAKE.candleH / 2, 0]} castShadow>
        <cylinderGeometry args={[BODY_R, BODY_R * 1.08, CAKE.candleH, 18]} />
        <meshStandardMaterial map={bodyMap} roughness={0.55} metalness={0} />
      </mesh>
      <mesh position={[0, CAKE.candleH + WICK_H / 2 - 0.01, 0]}>
        <cylinderGeometry args={[0.005, 0.006, WICK_H, 6]} />
        <meshStandardMaterial color="#231514" roughness={0.9} />
      </mesh>
      <mesh ref={ember} position={[0, CAKE.candleH + WICK_H - 0.012, 0]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <group position={[0, CAKE.candleH + WICK_H - 0.02, 0]}>
        <Flame index={index} stages={stages} />
      </group>
      <sprite ref={halo} position={[0, CAKE.candleH + 0.2, 0]} renderOrder={11}>
        <spriteMaterial map={glow} color="#ffae5e" blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
      </sprite>
      <sprite ref={spark} position={[0, CAKE.candleH + WICK_H, 0]} renderOrder={13}>
        <spriteMaterial map={star} color="#fff0c8" blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
      </sprite>
    </group>
  );
}
