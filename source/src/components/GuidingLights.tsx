import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { CAKE, ENVELOPE } from '@/config/world';
import { TAU, lerp } from '@/lib/math';
import { sampleCamera, type CameraSample } from '@/story/cameraPath';
import { ROUTE_END, ROUTE_START } from '@/story/timeline';
import { LightTrail } from '@/three/LightTrail';

const ROUTE_TAIL_UNITS = 90;

/** The three appearances of the guiding light: around the cake, down to the envelope, and onward to the finale. */
export function GuidingLights() {
  const orbit = useMemo(
    () => (t: number, out: Vector3) => {
      const a = 0.5 + t * TAU * 2.1;
      const r = 2.9 - 0.7 * t;
      out.set(Math.cos(a) * r, 0.5 + 3.0 * Math.pow(t, 0.9) + 0.22 * Math.sin(t * 18), Math.sin(a) * r);
    },
    [],
  );

  const fall = useMemo(() => {
    const curve = new CatmullRomCurve3(
      [
        new Vector3(0.1, CAKE.topY + 1.1, 0.4),
        new Vector3(1.7, 1.0, 2.4),
        new Vector3(-1.9, -3.2, 3.2),
        new Vector3(1.1, -8.8, 3.6),
        new Vector3(-0.9, ENVELOPE.y + 3.0, 2.2),
        new Vector3(0, ENVELOPE.y + 0.1, 0.8),
      ],
      false,
      'catmullrom',
      0.5,
    );
    return (t: number, out: Vector3) => {
      curve.getPoint(t, out);
    };
  }, []);

  const route = useMemo(() => {
    const cam: CameraSample = { cx: 0, cy: 0, cz: 0, lx: 0, ly: 0, lz: 0, fov: 0, fit: 0 };
    return (t: number, out: Vector3) => {
      const u = lerp(ROUTE_START, ROUTE_END, t);
      sampleCamera(u, cam);
      out.set(cam.cx + 0.9 * Math.sin(u * 0.013), cam.cy - 0.5 + 0.35 * Math.sin(u * 0.021), cam.cz - 3.2);
    };
  }, []);

  return (
    <>
      <LightTrail index={0} pointAt={orbit} tail={0.3} size={0.2} density={2} />
      <LightTrail index={1} pointAt={fall} tail={0.2} size={0.3} light density={2} />
      <LightTrail index={2} pointAt={route} tail={ROUTE_TAIL_UNITS / (ROUTE_END - ROUTE_START)} size={0.17} color="#ffe0a8" light density={2.4} strength={0.8} />
    </>
  );
}

