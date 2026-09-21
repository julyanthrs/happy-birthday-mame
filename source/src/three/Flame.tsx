import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, PlaneGeometry, ShaderMaterial } from 'three';
import { smoothstep } from '@/lib/math';
import { story, type CandleState } from '@/story/storyState';

export interface FlameStages {
  /** Bright glinting dot at the wick. */
  spark: number;
  /** Wick starting to glow. */
  wick: number;
  /** 0–~1.1: how big the flame is (includes a little overshoot). */
  grow: number;
  /** 1 while burning, → 0 as it is blown out. */
  alive: number;
  /** Red ember left on the wick. */
  ember: number;
}

/** Shared by the flame, the sparks and the candle lights so they always agree. */
export const candleStages = (c: CandleState, out: FlameStages): FlameStages => {
  const l = c.light;
  out.spark = smoothstep(0, 0.1, l) * (1 - smoothstep(0.12, 0.3, l));
  out.wick = smoothstep(0.08, 0.3, l);
  out.grow = smoothstep(0.26, 0.62, l) * (1 + 0.14 * Math.sin(Math.PI * smoothstep(0.5, 0.9, l)));
  out.alive = 1 - smoothstep(0.35, 1, c.out);
  out.ember = out.wick * (c.out <= 0 ? 1 : 1 - smoothstep(0.2, 0.8, c.smoke));
  return out;
};

const vertex = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uFlicker;
uniform float uGrow;
uniform float uSeed;
uniform float uStable;
uniform vec2 uSize;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 center = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 toCam = cameraPosition - center;
  toCam.y = 0.0;
  float l = length(toCam);
  toCam = l > 1e-4 ? toCam / l : vec3(0.0, 0.0, 1.0);
  vec3 right = vec3(toCam.z, 0.0, -toCam.x);
  float h = uv.y;
  vec2 s = uSize * uGrow;
  float f = sin(uTime * 11.0 + uSeed * 6.0) * 0.5 + sin(uTime * 17.3 + uSeed * 3.0) * 0.5;
  float sway = f * 0.07 * uFlicker * (1.0 - uStable * 0.55) * h * h;
  vec3 wp = center
    + right * (position.x * s.x + sway * s.y)
    + vec3(0.0, 1.0, 0.0) * (position.y * s.y)
    + vec3(1.0, 0.0, 0.0) * (uWind * h * h * s.y * 0.6);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uStable;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y);
  float n = noise(vec2(p.y * 3.2 - uTime * 2.8, uSeed * 10.0 + uTime * 0.6));
  float x = p.x + (n - 0.5) * 0.35 * p.y * (1.0 - uStable * 0.4);
  float w = sin(3.14159 * pow(clamp(p.y, 0.0, 1.0), 0.55)) * 0.82;
  float d = abs(x) / max(w, 0.001);
  float body = smoothstep(1.0, 0.45, d) * step(0.0, p.y) * step(p.y, 1.0);
  float core = smoothstep(1.0, 0.0, d * 1.7) * smoothstep(0.62, 0.04, p.y);
  vec3 outer = vec3(1.0, 0.42, 0.10);
  vec3 mid = vec3(1.0, 0.72, 0.28);
  vec3 col = mix(outer, mid, smoothstep(0.9, 0.1, p.y + d * 0.4));
  col = mix(col, vec3(1.0, 0.95, 0.82), core);
  col += vec3(0.25, 0.4, 1.0) * (1.0 - smoothstep(0.0, 0.14, p.y)) * (1.0 - smoothstep(0.0, 0.8, d)) * 0.55;
  float a = body * (0.85 + 0.15 * n);
  gl_FragColor = vec4(col * 1.5, a);
  #include <colorspace_fragment>
}
`;

const geometry = new PlaneGeometry(1, 1, 1, 8);
geometry.translate(0, 0.5, 0);

interface Props {
  index: number;
  stages: FlameStages;
}

/** The flame itself: a camera-facing, wind-bent, noise-shaped shader ribbon. */
export function Flame({ index, stages }: Props) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uWind: { value: 0 },
          uFlicker: { value: 0.3 },
          uGrow: { value: 0 },
          uSeed: { value: (index * 0.37 + 0.11) % 1 },
          uStable: { value: 0 },
          uSize: { value: [0.2, 0.36] },
        },
      }),
    [index],
  );

  useFrame((state) => {
    const c = story.candles[index];
    const u = material.uniforms;
    const h = stages.grow * stages.alive;
    u.uGrow.value = h;
    u.uTime.value = state.clock.elapsedTime * (story.reduced ? 0.4 : 1);
    u.uWind.value = story.wind * (1 - smoothstep(0.55, 0.95, c.out));
    u.uFlicker.value = story.flicker * (story.reduced ? 0.3 : 1) * (1 + 1.6 * smoothstep(0, 0.6, c.out));
    u.uStable.value = smoothstep(0.62, 1, c.light) * (1 - smoothstep(0, 0.4, c.out));
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={12} />;
}
