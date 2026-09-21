import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type PerspectiveCamera } from 'three';
import { clamp } from '@/lib/math';
import { pointer } from '@/story/pointer';
import { story } from '@/story/storyState';

/**
 * Turns the scripted camera in `story` into the real camera, adding the parts
 * that depend on the device: a wider vertical FOV on tall screens, tighter
 * framing for the envelope/letter, and a hint of pointer parallax.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame((state) => {
    const s = story;
    const aspect = size.width / Math.max(1, size.height);
    const spread = clamp(Math.pow(1.25 / aspect, 0.75), 1, 2.2);
    const fov = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(s.fov) / 2) * spread));
    if (Math.abs(camera.fov - fov) > 0.01 || camera.aspect !== aspect) {
      camera.fov = fov;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }

    const k = 1 / (1 + (spread - 1) * s.fit);
    const ox = (s.cam.x - s.look.x) * k;
    const oy = (s.cam.y - s.look.y) * k;
    const oz = (s.cam.z - s.look.z) * k;

    const a = s.orbit;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    let x = s.look.x + ox * cos + oz * sin;
    let y = s.look.y + oy;
    const z = s.look.z - ox * sin + oz * cos;

    let lx = s.look.x;
    let ly = s.look.y;
    if (!s.reduced) {
      const t = state.clock.elapsedTime;
      const strength = 0.18 + 0.32 * (1 - s.fit);
      x += pointer.sx * strength + Math.sin(t * 0.31) * 0.05;
      y += pointer.sy * strength * 0.6 + Math.sin(t * 0.23) * 0.035;
      lx += pointer.sx * strength * 0.35;
      ly += pointer.sy * strength * 0.2;
    }
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, s.look.z);
  });

  return null;
}
