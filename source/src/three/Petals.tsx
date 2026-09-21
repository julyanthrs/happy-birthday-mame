import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DoubleSide, Object3D, type InstancedMesh } from 'three';
import { clamp, mulberry32, smoothstep, TAU } from '@/lib/math';
import { createPetalGeometry } from '@/three/shapes';
import { story } from '@/story/storyState';

const BOX = { x: 24, y: 17, z: 22 };
const PALETTE = ['#f2b5c0', '#efcfd3', '#ffd7c0', '#e8a0b0', '#f8e3dc', '#ffc2cf'];
const dummy = new Object3D();

const wrap = (v: number, size: number): number => ((v % size) + size) % size;

interface Props {
  count: number;
}

/**
 * Cupped rose petals that tumble through the air. They live in world space and
 * wrap around the camera, so flying forward makes them stream past. Scroll speed
 * feeds the fall rate — scroll fast and a gust carries them.
 */
export function Petals({ count }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => createPetalGeometry(), []);
  const flow = useRef(0);

  const petals = useMemo(() => {
    const rand = mulberry32(77);
    return Array.from({ length: count }, (_, i) => {
      const early = i < 3;
      return {
        bx: early ? (rand() - 0.5) * 3 : (rand() - 0.5) * BOX.x,
        by: rand() * BOX.y,
        bz: early ? -3.5 - i * 1.7 : rand() * BOX.z,
        speed: 0.25 + rand() * 0.5,
        sway: 0.5 + rand() * 1.2,
        phase: rand() * TAU,
        spin: [rand() * 1.4 + 0.3, rand() * 1.1 + 0.2, rand() * 0.9 + 0.1] as const,
        size: 0.8 + rand() * 0.9,
        color: new Color(PALETTE[Math.floor(rand() * PALETTE.length)]),
      };
    });
  }, [count]);

  const seeded = useRef(false);
  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const active = Math.min(count, Math.ceil(story.petals * count));
    m.count = active;
    m.visible = active > 0;
    if (active === 0) return;

    if (!seeded.current) {
      petals.forEach((p, i) => m.setColorAt(i, p.color));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      seeded.current = true;
    }

    const t = state.clock.elapsedTime * (story.reduced ? 0.3 : 1);
    flow.current += Math.min(dt, 0.05) * (0.55 + story.velocity * 4.2) * (story.reduced ? 0.4 : 1);
    const cam = state.camera.position;
    const raw = story.petals * count;

    for (let i = 0; i < active; i++) {
      const p = petals[i];
      const y = wrap(p.by - flow.current * p.speed, BOX.y) - BOX.y / 2;
      const x = wrap(p.bx + Math.sin(t * 0.5 * p.sway + p.phase) * 1.3 + BOX.x / 2, BOX.x) - BOX.x / 2;
      const z = wrap(p.bz - cam.z, BOX.z) - BOX.z;
      dummy.position.set(cam.x + x, cam.y + y, cam.z + z);
      dummy.rotation.set(t * p.spin[0] + p.phase, t * p.spin[1], t * p.spin[2] + p.phase * 0.5);
      const grow = smoothstep(0, 1, clamp(raw - i));
      dummy.scale.setScalar(p.size * grow);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial side={DoubleSide} roughness={0.6} emissive="#a3445d" emissiveIntensity={0.28} />
    </instancedMesh>
  );
}
