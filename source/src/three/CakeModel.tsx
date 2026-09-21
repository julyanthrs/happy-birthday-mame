import { useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  type InstancedMesh,
} from 'three';
import { quality } from '@/config/qualityInstance';
import { CAKE } from '@/config/world';
import { mulberry32, TAU } from '@/lib/math';
import { story } from '@/story/storyState';

const BOTTOM_TOP = CAKE.bottomH;
const TOP_TOP = CAKE.topY;
const shadow = quality.shadows;

const materials = {
  pink: { color: '#e9b3bf', roughness: 0.58, metalness: 0 },
  cream: { color: '#fff3e6', roughness: 0.62, metalness: 0 },
  gold: { color: '#d8b06a', roughness: 0.28, metalness: 1 },
} as const;

const dummy = new Object3D();

/** Frosting drips hanging off a tier's top edge. */
const fillDrips = (mesh: InstancedMesh, radius: number, top: number, count: number, seed: number): void => {
  const rand = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + (rand() - 0.5) * 0.12;
    const len = 0.14 + rand() * 0.34;
    dummy.position.set(Math.cos(a) * (radius + 0.004), top - 0.03 - len / 2, Math.sin(a) * (radius + 0.004));
    dummy.scale.set(1, len / 0.31, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
};

const fillRing = (mesh: InstancedMesh, radius: number, y: number, count: number, scaleY = 1, offset = 0): void => {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + offset;
    dummy.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    dummy.scale.set(1, scaleY, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
};

const sparkleVertex = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform float uVH;
uniform float uAmount;
attribute float aPhase;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = pow(max(0.0, sin(uTime * (0.9 + aPhase) + aPhase * 40.0 + uScroll)), 6.0);
  vA = tw * uAmount;
  gl_PointSize = (0.05 + 0.1 * tw) * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z);
}
`;
const sparkleFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float star = max(0.0, 1.0 - abs(c.x) * 9.0) * max(0.0, 1.0 - abs(c.y) * 1.6) + max(0.0, 1.0 - abs(c.y) * 9.0) * max(0.0, 1.0 - abs(c.x) * 1.6);
  float a = clamp(smoothstep(0.5, 0.0, d) * 0.6 + star, 0.0, 1.0);
  gl_FragColor = vec4(uColor, a * vA);
  #include <colorspace_fragment>
}
`;

/** Tiny gold glints scattered over the frosting that catch the light now and then. */
function Sparkles() {
  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(33);
    const n = 26;
    const pos = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const onTop = i % 3 === 0;
      const r = (onTop ? CAKE.topR : CAKE.bottomR) + 0.03;
      const a = rand() * TAU;
      const y = onTop ? BOTTOM_TOP + 0.1 + rand() * (CAKE.topH - 0.25) : 0.15 + rand() * (CAKE.bottomH - 0.3);
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
      phase[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new BufferAttribute(phase, 1));
    const m = new ShaderMaterial({
      vertexShader: sparkleVertex,
      fragmentShader: sparkleFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uVH: { value: 1000 },
        uAmount: { value: 0 },
        uColor: { value: new Color('#ffe4a8') },
      },
    });
    return { geometry: g, material: m };
  }, []);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime * (story.reduced ? 0.3 : 1);
    u.uScroll.value = story.unit * 0.02;
    u.uVH.value = state.size.height * state.viewport.dpr;
    u.uAmount.value = 0.9 * story.cake.reveal;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />;
}

/**
 * A two-tier cake: dusty-pink base with cream drips, cream top with pink
 * drips, gold bands, pearls, piped rosettes and a gold plate. Repeated pieces
 * are instanced, so the whole cake is around a dozen draw calls.
 */
export function CakeModel() {
  const seg = quality.cakeSegments;
  const dripGeo = useMemo(() => new CapsuleGeometry(0.055, 0.2, 4, 8), []);
  const dollopGeo = useMemo(() => new SphereGeometry(0.07, 12, 10), []);
  const pearlGeo = useMemo(() => new SphereGeometry(0.048, 14, 12), []);
  const flakeGeo = useMemo(() => new SphereGeometry(0.02, 6, 5), []);

  const bottomPearls = Math.round(quality.pearls * 0.62);
  const topPearls = quality.pearls - bottomPearls;
  const dripsBottom = quality.drips + 6;
  const dripsTop = quality.drips - 4;

  const setBottomDrips = useCallback((m: InstancedMesh | null) => m && fillDrips(m, CAKE.bottomR, BOTTOM_TOP, dripsBottom, 3), [dripsBottom]);
  const setTopDrips = useCallback((m: InstancedMesh | null) => m && fillDrips(m, CAKE.topR, TOP_TOP, dripsTop, 8), [dripsTop]);
  const setDollops = useCallback((m: InstancedMesh | null) => m && fillRing(m, CAKE.topR - 0.13, TOP_TOP + 0.03, 22, 0.8), []);
  const setBottomPearls = useCallback((m: InstancedMesh | null) => m && fillRing(m, CAKE.bottomR + 0.055, 0.16, bottomPearls), [bottomPearls]);
  const setTopPearls = useCallback((m: InstancedMesh | null) => m && fillRing(m, CAKE.topR + 0.06, BOTTOM_TOP + 0.06, topPearls, 1, 0.1), [topPearls]);
  const setFlakes = useCallback((m: InstancedMesh | null) => {
    if (!m) return;
    const rand = mulberry32(17);
    for (let i = 0; i < 40; i++) {
      const top = i % 3 === 0;
      const r = (top ? CAKE.topR : CAKE.bottomR) + 0.012;
      const a = rand() * TAU;
      const y = top ? BOTTOM_TOP + 0.15 + rand() * 0.45 : 0.28 + rand() * 0.42;
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      dummy.scale.setScalar(0.5 + rand() * 1.2);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* plate */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.2, 0.1, seg]} />
        <meshStandardMaterial {...materials.gold} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.16, 0.045, 12, seg]} />
        <meshStandardMaterial {...materials.gold} />
      </mesh>

      {/* bottom tier */}
      <mesh position={[0, BOTTOM_TOP / 2, 0]} castShadow={shadow} receiveShadow={shadow}>
        <cylinderGeometry args={[CAKE.bottomR, CAKE.bottomR, BOTTOM_TOP, seg]} />
        <meshStandardMaterial {...materials.pink} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[CAKE.bottomR + 0.014, CAKE.bottomR + 0.014, 0.1, seg]} />
        <meshStandardMaterial {...materials.gold} />
      </mesh>
      <mesh position={[0, BOTTOM_TOP - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CAKE.bottomR - 0.03, 0.085, 14, seg]} />
        <meshStandardMaterial {...materials.cream} />
      </mesh>
      <instancedMesh ref={setBottomDrips} args={[dripGeo, undefined, dripsBottom]} castShadow={shadow}>
        <meshStandardMaterial {...materials.cream} />
      </instancedMesh>
      <instancedMesh ref={setBottomPearls} args={[pearlGeo, undefined, bottomPearls]}>
        <meshPhysicalMaterial color="#fbf3ea" roughness={0.22} metalness={0.1} clearcoat={1} clearcoatRoughness={0.12} />
      </instancedMesh>

      {/* top tier */}
      <mesh position={[0, BOTTOM_TOP + CAKE.topH / 2, 0]} castShadow={shadow} receiveShadow={shadow}>
        <cylinderGeometry args={[CAKE.topR, CAKE.topR, CAKE.topH, seg]} />
        <meshStandardMaterial {...materials.cream} />
      </mesh>
      <mesh position={[0, BOTTOM_TOP + 0.07, 0]}>
        <cylinderGeometry args={[CAKE.topR + 0.014, CAKE.topR + 0.014, 0.09, seg]} />
        <meshStandardMaterial {...materials.gold} />
      </mesh>
      <mesh position={[0, TOP_TOP - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CAKE.topR - 0.025, 0.07, 14, seg]} />
        <meshStandardMaterial {...materials.pink} />
      </mesh>
      <instancedMesh ref={setTopDrips} args={[dripGeo, undefined, dripsTop]} castShadow={shadow}>
        <meshStandardMaterial {...materials.pink} />
      </instancedMesh>
      <instancedMesh ref={setDollops} args={[dollopGeo, undefined, 22]}>
        <meshStandardMaterial {...materials.cream} />
      </instancedMesh>
      <instancedMesh ref={setTopPearls} args={[pearlGeo, undefined, topPearls]}>
        <meshPhysicalMaterial color="#fbf3ea" roughness={0.22} metalness={0.1} clearcoat={1} clearcoatRoughness={0.12} />
      </instancedMesh>
      <instancedMesh ref={setFlakes} args={[flakeGeo, undefined, 40]}>
        <meshStandardMaterial color="#e6c072" metalness={1} roughness={0.2} emissive="#7a5a20" emissiveIntensity={0.5} />
      </instancedMesh>

      <Sparkles />
    </group>
  );
}

