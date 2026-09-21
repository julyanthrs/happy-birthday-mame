import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial } from 'three';
import type { CandleSpot } from '@/config/candles';
import { CAKE } from '@/config/world';
import { pointer } from '@/story/pointer';
import { mulberry32 } from '@/lib/math';
import { story } from '@/story/storyState';

const MAX_CANDLES = 16;

const vertex = /* glsl */ `
uniform float uProg[${MAX_CANDLES}];
uniform float uTime;
uniform float uAir;
uniform float uVH;
attribute float aCandle;
attribute float aPhase;
attribute float aSeed;
varying float vAlpha;
varying float vSeed;
void main() {
  float pr = uProg[int(aCandle + 0.5)];
  float life = clamp(pr * 1.5 - aPhase * 0.5, 0.0, 1.0);
  float curl = life * 5.0 + aSeed * 6.2831 + uTime * 0.6;
  vec3 pos = position + vec3(
    sin(curl) * 0.09 * life + uAir * life * life * 0.45,
    life * 1.15,
    cos(curl * 0.83) * 0.08 * life
  );
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - life) * step(0.001, life) * 0.42;
  vSeed = aSeed;
  float size = 0.05 + life * 0.3;
  gl_PointSize = size * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z);
}
`;

const fragment = /* glsl */ `
varying float vAlpha;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float ripple = 0.85 + 0.15 * sin(atan(c.y, c.x) * 3.0 + vSeed * 20.0);
  float a = smoothstep(0.5 * ripple, 0.05, d);
  gl_FragColor = vec4(vec3(0.86, 0.79, 0.81), a * vAlpha);
  #include <colorspace_fragment>
}
`;

interface Props {
  spots: CandleSpot[];
  puffs: number;
}

/**
 * When a flame dies a thin plume curls up from its wick. Each candle's plume
 * is driven by its own `smoke` progress, and drifts with the "air" — a slow
 * breath plus a nudge from the pointer.
 */
export function Smoke({ spots, puffs }: Props) {
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(21);
    const total = spots.length * puffs;
    const pos = new Float32Array(total * 3);
    const candle = new Float32Array(total);
    const phase = new Float32Array(total);
    const seed = new Float32Array(total);
    let k = 0;
    spots.forEach((s, i) => {
      for (let j = 0; j < puffs; j++) {
        pos.set([s.x, CAKE.topY + CAKE.candleH + 0.06, s.z], k * 3);
        candle[k] = i;
        phase[k] = j / puffs;
        seed[k] = rand();
        k++;
      }
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aCandle', new BufferAttribute(candle, 1));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      uniforms: {
        uProg: { value: new Array<number>(MAX_CANDLES).fill(0) },
        uTime: { value: 0 },
        uAir: { value: 0 },
        uVH: { value: 1000 },
      },
    });
    return { geometry: g, material: m };
  }, [spots, puffs]);

  useFrame((state) => {
    const u = material.uniforms;
    const prog = u.uProg.value as number[];
    let any = false;
    for (let i = 0; i < spots.length && i < MAX_CANDLES; i++) {
      prog[i] = story.candles[i].smoke;
      if (prog[i] > 0 && prog[i] < 1) any = true;
    }
    material.visible = any;
    if (!any) return;
    const t = state.clock.elapsedTime;
    u.uTime.value = t * (story.reduced ? 0.3 : 1);
    u.uAir.value = Math.sin(t * 0.7) * 0.5 + pointer.sx * 0.9;
    u.uVH.value = state.size.height * state.viewport.dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={14} />;
}
