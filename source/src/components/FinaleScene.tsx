import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Object3D,
  ShaderMaterial,
  Vector3,
  type Group,
  type InstancedMesh,
  type PerspectiveCamera,
} from 'three';
import { at } from '@/config/chapters';
import { birthdayContent } from '@/data/birthdayContent';
import { quality } from '@/config/qualityInstance';
import { FINALE } from '@/config/world';
import { whenFontsReady } from '@/lib/fonts';
import { clamp, mulberry32, TAU } from '@/lib/math';
import { sampleTextPoints } from '@/lib/textCanvas';
import { createHeartGeometry } from '@/three/shapes';
import { story } from '@/story/storyState';

const SHOW_FROM = at('petals', 0.6);
const SHOW_TO = at('finalCake', 0.7);
const TEXT_DISTANCE = 12;
/** The camera drifts closer during the finale; size the text for its nearest point. */
const FIT_DISTANCE = 9;
const CENTER = new Vector3(0, FINALE.y + 0.6, FINALE.startZ - TEXT_DISTANCE);
const dummy = new Object3D();

const textVertex = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aTarget;
attribute vec4 aRand;
attribute float aLine;
uniform vec3 uCenter;
uniform float uSpark;
uniform float uFormA;
uniform float uFormB;
uniform float uBurst;
uniform float uTime;
uniform float uScale;
uniform float uOff1;
uniform float uOff2;
uniform float uVH;
varying float vAlpha;
varying vec3 vTint;
void main() {
  float form = aLine < 0.5 ? uFormA : uFormB;
  float delay = aRand.x * 0.55;
  float f = smoothstep(delay, delay + 0.45, form);
  vec3 start = uCenter + aStart;
  vec3 target = uCenter + vec3(aTarget.xy * uScale, aTarget.z) + vec3(0.0, aLine < 0.5 ? uOff1 : uOff2, 0.0);
  vec3 p = mix(start, target, f);
  float arc = sin(f * 3.14159) * (1.0 - f);
  p += vec3(sin(aRand.y * 20.0 + uTime * 0.6), cos(aRand.z * 20.0 + uTime * 0.5), sin(aRand.w * 10.0 + uTime * 0.4)) * arc * 2.4;
  p += vec3(sin(uTime * 1.3 + aRand.y * 40.0), cos(uTime * 1.1 + aRand.z * 40.0), 0.0) * 0.014 * f;
  vec3 dir = normalize(target - uCenter + (aRand.xyz - 0.5) * 4.0 + vec3(0.0, 0.001, 0.0));
  p += dir * uBurst * uBurst * (4.0 + aRand.w * 11.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float rank = fract(aRand.x * 7.13 + aRand.y * 3.7);
  float visible = smoothstep(rank, rank + 0.04, pow(uSpark, 3.0) * 1.05);
  float tw = 0.7 + 0.3 * sin(uTime * (1.5 + aRand.z * 3.0) + aRand.w * 30.0);
  vAlpha = visible * tw * (1.0 - smoothstep(0.35, 1.0, uBurst));
  float pick = fract(aRand.w * 5.31);
  vTint = pick < 0.68 ? vec3(1.0, 0.82, 0.48) : (pick < 0.88 ? vec3(1.0, 0.95, 0.82) : vec3(1.0, 0.7, 0.8));
  float size = (0.05 + aRand.z * 0.05) * (1.0 + f * 0.2);
  gl_PointSize = clamp(size * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z), 1.5, 22.0);
}
`;

const dotFragment = /* glsl */ `
varying float vAlpha;
varying vec3 vTint;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vTint * (0.9 + a * 0.6), a * vAlpha);
  #include <colorspace_fragment>
}
`;

const BURSTS = 6;
const fireworkVertex = /* glsl */ `
attribute vec3 aDir;
attribute float aBurst;
attribute float aRand;
uniform float uTime;
uniform float uAmount;
uniform vec3 uOrigin;
uniform float uVH;
varying float vAlpha;
varying vec3 vTint;
float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }
void main() {
  float period = 3.6 + aBurst * 0.37;
  float t = uTime + aBurst * 1.7;
  float cycle = floor(t / period);
  float local = (t - cycle * period);
  vec3 c = uOrigin + vec3((hash(aBurst + cycle * 7.0) - 0.5) * 20.0, (hash(aBurst * 3.0 + cycle * 3.0) - 0.3) * 8.0, -3.0 - hash(aBurst + cycle) * 6.0);
  float R = 3.6 + hash(aBurst * 5.0 + cycle) * 2.6;
  float r = (1.0 - exp(-local * 1.9)) * R * (0.6 + aRand * 0.4);
  vec3 p = c + aDir * r + vec3(0.0, -0.5 * 0.9 * local * local * 0.35, 0.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float on = step(hash(aBurst * 2.0 + cycle * 11.0), uAmount);
  float tw = 0.6 + 0.4 * sin(local * 16.0 + aRand * 50.0);
  vAlpha = on * (1.0 - smoothstep(1.3, 2.7, local)) * smoothstep(0.0, 0.08, local) * tw * uAmount;
  float pick = hash(aBurst * 13.0 + cycle * 5.0);
  vTint = pick < 0.5 ? vec3(1.0, 0.82, 0.5) : (pick < 0.8 ? vec3(1.0, 0.72, 0.82) : vec3(1.0, 0.96, 0.86));
  gl_PointSize = clamp(0.1 * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z), 1.0, 18.0);
}
`;

interface TextBuild {
  geometry: BufferGeometry;
  width: number;
}

const buildText = (): TextBuild => {
  const style = { font: '500 %spx "Cormorant Garamond"', size: 220, letterSpacing: 16 };
  const one = sampleTextPoints(birthdayContent.finale.particleLineOne, style, quality.textParticlesLineOne, 3);
  const two = sampleTextPoints(birthdayContent.finale.particleLineTwo, style, quality.textParticlesLineTwo, 5);
  const n = quality.textParticlesLineOne + quality.textParticlesLineTwo;
  const target = new Float32Array(n * 3);
  const start = new Float32Array(n * 3);
  const rnd = new Float32Array(n * 4);
  const line = new Float32Array(n);
  const rand = mulberry32(91);
  const fill = (src: Float32Array, count: number, offset: number, lineId: number) => {
    for (let i = 0; i < count; i++) {
      const k = offset + i;
      target.set([src[i * 2], src[i * 2 + 1], (rand() - 0.5) * 0.06], k * 3);
      const a = rand() * TAU;
      const rr = 5 + rand() * 13;
      start.set([Math.cos(a) * rr * 1.5, (rand() - 0.5) * 12, (rand() - 0.5) * 10 + 4], k * 3);
      rnd.set([rand(), rand(), rand(), rand()], k * 4);
      line[k] = lineId;
    }
  };
  fill(one.points, quality.textParticlesLineOne, 0, 0);
  fill(two.points, quality.textParticlesLineTwo, quality.textParticlesLineOne, 1);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aTarget', new BufferAttribute(target, 3));
  g.setAttribute('aStart', new BufferAttribute(start, 3));
  g.setAttribute('aRand', new BufferAttribute(rnd, 4));
  g.setAttribute('aLine', new BufferAttribute(line, 1));
  return { geometry: g, width: one.width };
};

/**
 * The finale in three layers: golden particles that gather into the words,
 * quiet fireworks behind them, and small glowing hearts rising past the camera.
 */
export function FinaleScene() {
  const root = useRef<Group>(null);
  const hearts = useRef<InstancedMesh>(null);
  const [text, setText] = useState<TextBuild | null>(null);

  useEffect(() => {
    let alive = true;
    let built: TextBuild | null = null;
    void whenFontsReady().then(() => {
      if (!alive) return;
      built = buildText();
      setText(built);
    });
    return () => {
      alive = false;
      built?.geometry.dispose();
    };
  }, []);

  const textMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: textVertex,
        fragmentShader: dotFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uCenter: { value: CENTER.clone() },
          uSpark: { value: 0 },
          uFormA: { value: 0 },
          uFormB: { value: 0 },
          uBurst: { value: 0 },
          uTime: { value: 0 },
          uScale: { value: 0.005 },
          uOff1: { value: 0.9 },
          uOff2: { value: -1.7 },
          uVH: { value: 1000 },
        },
      }),
    [],
  );

  const { fireGeo, fireMat } = useMemo(() => {
    const per = quality.fireworkParticles;
    const n = BURSTS * per;
    const dir = new Float32Array(n * 3);
    const burst = new Float32Array(n);
    const rnd = new Float32Array(n);
    const rand = mulberry32(55);
    for (let b = 0; b < BURSTS; b++) {
      for (let i = 0; i < per; i++) {
        const k = b * per + i;
        const th = rand() * TAU;
        const ph = Math.acos(2 * rand() - 1);
        dir.set([Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph) * 0.4], k * 3);
        burst[k] = b;
        rnd[k] = rand();
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aDir', new BufferAttribute(dir, 3));
    g.setAttribute('aBurst', new BufferAttribute(burst, 1));
    g.setAttribute('aRand', new BufferAttribute(rnd, 1));
    const m = new ShaderMaterial({
      vertexShader: fireworkVertex,
      fragmentShader: dotFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAmount: { value: 0 },
        uOrigin: { value: new Vector3(0, FINALE.y + 2, FINALE.startZ - TEXT_DISTANCE) },
        uVH: { value: 1000 },
      },
    });
    return { fireGeo: g, fireMat: m };
  }, []);

  const heartGeo = useMemo(() => createHeartGeometry(0.2), []);
  const heartData = useMemo(() => {
    const rand = mulberry32(31);
    return Array.from({ length: quality.hearts }, () => ({
      x: (rand() - 0.5) * 16,
      y: rand() * 16,
      z: -5 - rand() * 10,
      speed: 0.35 + rand() * 0.5,
      sway: rand() * TAU,
      size: 0.14 + rand() * 0.2,
      color: new Color().setRGB(1.5, 0.5 + rand() * 0.3, 0.7 + rand() * 0.2),
    }));
  }, []);
  const heartsSeeded = useRef(false);

  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    const u = story.unit;
    r.visible = u > SHOW_FROM && u < SHOW_TO;
    if (!r.visible) return;
    const t = state.clock.elapsedTime * (story.reduced ? 0.3 : 1);
    const cam = state.camera as PerspectiveCamera;
    const vh = state.size.height * state.viewport.dpr;
    const f = story.finale;

    const visW = 2 * FIT_DISTANCE * Math.tan(MathUtils.degToRad(cam.fov) / 2) * cam.aspect;
    const worldW = Math.min(11, visW * 0.82);
    const k = worldW / (text?.width ?? 2000);
    const tu = textMat.uniforms;
    tu.uSpark.value = f.spark;
    tu.uFormA.value = f.formA;
    tu.uFormB.value = f.formB;
    tu.uBurst.value = f.burst;
    tu.uTime.value = t;
    tu.uScale.value = k;
    tu.uOff1.value = 0.9 * (worldW / 11);
    tu.uOff2.value = -1.7 * (worldW / 11);
    tu.uVH.value = vh;

    fireMat.uniforms.uTime.value = t;
    fireMat.uniforms.uAmount.value = f.fireworks;
    fireMat.uniforms.uVH.value = vh;
    fireMat.visible = f.fireworks > 0.01;

    const m = hearts.current;
    if (m) {
      m.visible = f.hearts > 0.01;
      if (m.visible) {
        if (!heartsSeeded.current) {
          heartData.forEach((h, i) => m.setColorAt(i, h.color));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
          heartsSeeded.current = true;
        }
        heartData.forEach((h, i) => {
          const y = ((h.y + t * h.speed) % 16) - 8;
          const grow = clamp(f.hearts * 1.4 - (i / heartData.length) * 0.4);
          dummy.position.set(cam.position.x + h.x + Math.sin(t * 0.7 + h.sway) * 0.6, cam.position.y + y, cam.position.z + h.z);
          dummy.rotation.set(0.1 * Math.sin(t + h.sway), t * 0.8 + h.sway, 0);
          dummy.scale.setScalar(h.size * grow);
          dummy.updateMatrix();
          m.setMatrixAt(i, dummy.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={root} visible={false}>
      {text ? <points geometry={text.geometry} material={textMat} frustumCulled={false} renderOrder={28} /> : null}
      <points geometry={fireGeo} material={fireMat} frustumCulled={false} renderOrder={27} />
      <instancedMesh ref={hearts} args={[heartGeo, undefined, heartData.length]} frustumCulled={false} visible={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
