import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Vector3, type Mesh } from 'three';
import { heartbeat } from '@/lib/beat';
import { pointer } from '@/story/pointer';
import { story } from '@/story/storyState';
import { createHeartGeometry } from '@/three/shapes';

/** A tiny glowing heart that trails the pointer, only in a few tender moments. Desktop with a mouse only. */
export function FloatingHeart() {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => createHeartGeometry(0.2), []);
  const target = useMemo(() => new Vector3(), []);
  const pos = useMemo(() => new Vector3(), []);
  const seeded = useRef(false);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const amount = pointer.active && !story.reduced ? story.heart : 0;
    m.visible = amount > 0.01;
    if (!m.visible) return;
    const cam = state.camera;
    target.set(pointer.x, pointer.y, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(4.2).add(cam.position);
    if (!seeded.current) {
      pos.copy(target);
      seeded.current = true;
    }
    pos.x = MathUtils.damp(pos.x, target.x, 2.6, dt);
    pos.y = MathUtils.damp(pos.y, target.y, 2.6, dt);
    pos.z = MathUtils.damp(pos.z, target.z, 2.6, dt);
    const t = state.clock.elapsedTime;
    m.position.copy(pos);
    m.position.y += Math.sin(t * 1.6) * 0.05;
    m.rotation.set(0.15 * Math.sin(t), t * 0.9, 0.2 * Math.sin(t * 0.7));
    m.scale.setScalar(0.17 * amount * (1 + 0.12 * heartbeat(t)));
  });

  return (
    <mesh ref={mesh} geometry={geometry} visible={false} renderOrder={40}>
      <meshStandardMaterial color="#ff9db5" emissive="#ff5f8c" emissiveIntensity={1.1} metalness={0.25} roughness={0.3} />
    </mesh>
  );
}
