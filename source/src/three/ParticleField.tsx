import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, ShaderMaterial, Vector3, type Points } from 'three';
import { mixMood } from '@/lib/moodMix';
import { mulberry32 } from '@/lib/math';
import { cakeAnchor } from '@/story/cakeStage';
import { story, type StoryState } from '@/story/storyState';

const vertex = /* glsl */ `
uniform vec3 uCam;
uniform vec3 uBox;
uniform float uTime;
uniform float uAmount;
uniform float uSize;
uniform float uVH;
uniform float uFog;
uniform float uRise;
attribute vec4 aRand;
varying float vAlpha;
void main() {
  vec3 p = position * uBox;
  p.x += sin(uTime * 0.13 * (0.5 + aRand.x) + aRand.y * 6.2831) * 0.7;
  p.z += cos(uTime * 0.11 * (0.5 + aRand.z) + aRand.w * 6.2831) * 0.7;
  p.y += uTime * uRise * (0.3 + aRand.z);
  vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
  vec4 mv = viewMatrix * vec4(uCam + rel, 1.0);
  gl_Position = projectionMatrix * mv;
  vec3 q = abs(rel) / uBox;
  float edge = 1.0 - smoothstep(0.36, 0.5, max(q.x, max(q.y, q.z)));
  float tw = 0.55 + 0.45 * sin(uTime * (0.8 + aRand.x * 2.0) + aRand.y * 20.0);
  float dist = length(mv.xyz);
  float fog = exp(-pow(uFog * dist, 2.0));
  float on = step(aRand.w, uAmount);
  vAlpha = on * edge * tw * fog * smoothstep(0.3, 1.2, dist);
  float sz = uSize * (0.45 + aRand.z);
  gl_PointSize = clamp(sz * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z), 1.0, 26.0);
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, a * vAlpha);
  #include <colorspace_fragment>
}
`;

interface Props {
  count: number;
  box: [number, number, number];
  size: number;
  /** 'camera' keeps the volume around the viewer; 'anchor' keeps it around the cake. */
  mode: 'camera' | 'anchor';
  offset?: [number, number, number];
  rise?: number;
  amount: (s: StoryState) => number;
  seed?: number;
  additive?: boolean;
}

const GOLD_LIGHT = new Color('#f6dfa8');
const GOLD_DARK = new Color('#a9772c');

/**
 * Drifting golden motes in a box that wraps around a centre, so a few hundred
 * points give the impression of endless dust — and real parallax when the
 * camera moves through them.
 */
export function ParticleField({ count, box, size, mode, offset = [0, 0, 0], rise = 0, amount, seed = 1, additive = false }: Props) {
  const ref = useRef<Points>(null);
  const centre = useMemo(() => new Vector3(), []);

  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos.set([rand(), rand(), rand()], i * 3);
      rnd.set([rand(), rand(), rand(), rand()], i * 4);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aRand', new BufferAttribute(rnd, 4));
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: additive ? AdditiveBlending : NormalBlending,
      uniforms: {
        uCam: { value: new Vector3() },
        uBox: { value: new Vector3(...box) },
        uTime: { value: 0 },
        uAmount: { value: 0 },
        uSize: { value: size },
        uVH: { value: 1000 },
        uFog: { value: 0.02 },
        uRise: { value: rise },
        uColor: { value: new Color() },
      },
    });
    return { geometry: g, material: m };
  }, [count, box, size, rise, seed, additive]);

  useFrame((state) => {
    const u = material.uniforms;
    const a = amount(story);
    if (ref.current) ref.current.visible = a > 0.002;
    if (a <= 0.002) return;
    if (mode === 'camera') {
      centre.copy(state.camera.position);
      centre.z -= box[2] * 0.18;
    } else {
      const anchor = cakeAnchor(story.unit);
      centre.set(anchor.x + offset[0], anchor.y + offset[1], anchor.z + offset[2]);
    }
    u.uCam.value.copy(centre);
    u.uTime.value = state.clock.elapsedTime * (story.reduced ? 0.25 : 1);
    u.uAmount.value = a;
    u.uVH.value = state.size.height * state.viewport.dpr;
    u.uFog.value = story.fog;
    (u.uColor.value as Color).copy(GOLD_LIGHT).lerp(GOLD_DARK, mixMood(story.mood).paper);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
