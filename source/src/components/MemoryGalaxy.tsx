import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  type Group,
  type InstancedMesh,
  type Texture,
} from 'three';
import { at } from '@/config/chapters';
import { birthdayContent } from '@/data/birthdayContent';
import { quality } from '@/config/qualityInstance';
import { GALAXY } from '@/config/world';
import { mulberry32, TAU } from '@/lib/math';
import { getGlowTexture } from '@/three/textures';
import { story } from '@/story/storyState';

const SHOW_FROM = at('love', 0.75);
const SHOW_TO = at('petals', 0.7);
const dummy = new Object3D();

interface Placement {
  image: number;
  slot: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
  h: number;
  phase: number;
}

const glintVertex = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute float aPhase;
uniform float uTime;
uniform float uVH;
varying float vA;
void main() {
  float t = fract(uTime * 0.07 + aPhase);
  vec3 p = mix(aA, aB, t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vA = sin(t * 3.14159) * 0.9;
  gl_PointSize = clamp(0.09 * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z), 1.0, 22.0);
}
`;
const glintFragment = /* glsl */ `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.55), a * vA);
  #include <colorspace_fragment>
}
`;

function Photos({ urls, indices }: { urls: string[]; indices: number[] }) {
  const textures = useTexture(urls) as Texture[];
  const root = useRef<Group>(null);
  const photoMeshes = useRef<Array<InstancedMesh | null>>([]);
  const frameMeshes = useRef<Array<InstancedMesh | null>>([]);
  const halos = useRef<InstancedMesh>(null);
  const glow = useMemo(() => getGlowTexture(), []);

  const aspects = useMemo(
    () =>
      textures.map((t) => {
        t.colorSpace = SRGBColorSpace;
        t.anisotropy = 4;
        t.needsUpdate = true;
        const img = t.image as { width: number; height: number };
        return img.width / img.height;
      }),
    [textures],
  );

  const { placements, counts, lines } = useMemo(() => {
    const rand = mulberry32(2024);
    const total = quality.galaxyPhotos;
    const list: Placement[] = [];
    const per = new Array<number>(urls.length).fill(0);
    for (let j = 0; j < total; j++) {
      const image = indices[j % indices.length];
      const r = 3.4 + rand() * 8.5;
      const th = rand() * TAU;
      const z = GALAXY.startZ - 10 - ((j + rand() * 0.7) / total) * (GALAXY.length - 12);
      const x = Math.cos(th) * r * 1.25;
      list.push({
        image,
        slot: per[image]++,
        x,
        y: GALAXY.y + Math.sin(th) * r * 0.7,
        z,
        rotY: -Math.atan(x / 22) + (rand() - 0.5) * 0.6,
        rotZ: (rand() - 0.5) * 0.3,
        h: 1.2 + rand() * 1.5,
        phase: rand() * TAU,
      });
    }
    // Faint lines link photos that are near each other along the path.
    const seg: number[] = [];
    const a: number[] = [];
    const b: number[] = [];
    const ph: number[] = [];
    for (let j = 0; j < list.length; j++) {
      for (const step of [1, 3]) {
        const k = j + step;
        if (k >= list.length) continue;
        const p = list[j];
        const q = list[k];
        if (Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) > 24) continue;
        seg.push(p.x, p.y, p.z, q.x, q.y, q.z);
        for (let g = 0; g < 2; g++) {
          a.push(p.x, p.y, p.z);
          b.push(q.x, q.y, q.z);
          ph.push(rand());
        }
      }
    }
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new BufferAttribute(new Float32Array(seg), 3));
    const glintGeo = new BufferGeometry();
    glintGeo.setAttribute('position', new BufferAttribute(new Float32Array(a), 3));
    glintGeo.setAttribute('aA', new BufferAttribute(new Float32Array(a), 3));
    glintGeo.setAttribute('aB', new BufferAttribute(new Float32Array(b), 3));
    glintGeo.setAttribute('aPhase', new BufferAttribute(new Float32Array(ph), 1));
    return { placements: list, counts: per, lines: { lineGeo, glintGeo } };
  }, [urls.length, indices]);

  const glintMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glintVertex,
        fragmentShader: glintFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uVH: { value: 1000 } },
      }),
    [],
  );

  useEffect(
    () => () => {
      lines.lineGeo.dispose();
      lines.glintGeo.dispose();
      glintMat.dispose();
    },
    [lines, glintMat],
  );

  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    const u = story.unit;
    r.visible = u > SHOW_FROM && u < SHOW_TO;
    if (!r.visible) return;
    const t = state.clock.elapsedTime * (story.reduced ? 0.3 : 1);
    glintMat.uniforms.uTime.value = t;
    glintMat.uniforms.uVH.value = state.size.height * state.viewport.dpr;

    placements.forEach((p, j) => {
      const aspect = aspects[p.image];
      const y = p.y + Math.sin(t * 0.4 + p.phase) * 0.18;
      dummy.position.set(p.x, y, p.z);
      dummy.rotation.set(0.05 * Math.sin(t * 0.3 + p.phase), p.rotY + 0.05 * Math.sin(t * 0.25 + p.phase * 2), p.rotZ);
      dummy.scale.set(p.h * aspect, p.h, 1);
      dummy.updateMatrix();
      photoMeshes.current[p.image]?.setMatrixAt(p.slot, dummy.matrix);

      dummy.scale.set(p.h * aspect + 0.14, p.h + 0.3, 1);
      dummy.translateZ(-0.012);
      dummy.translateY(-0.06);
      dummy.updateMatrix();
      frameMeshes.current[p.image]?.setMatrixAt(p.slot, dummy.matrix);

      dummy.position.set(p.x, y, p.z - 0.05);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(p.h * aspect * 2.6, p.h * 2.6, 1);
      dummy.updateMatrix();
      halos.current?.setMatrixAt(j, dummy.matrix);
    });
    photoMeshes.current.forEach((m) => m && (m.instanceMatrix.needsUpdate = true));
    frameMeshes.current.forEach((m) => m && (m.instanceMatrix.needsUpdate = true));
    if (halos.current) halos.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={root} visible={false}>
      <instancedMesh ref={halos} args={[undefined, undefined, placements.length]} frustumCulled={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} color="#ffc98a" blending={AdditiveBlending} transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
      {urls.map((url, k) => (
        <group key={url}>
          <instancedMesh
            ref={(m) => {
              frameMeshes.current[k] = m;
            }}
            args={[undefined, undefined, Math.max(1, counts[k])]}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#f6efe4" toneMapped={false} />
          </instancedMesh>
          <instancedMesh
            ref={(m) => {
              photoMeshes.current[k] = m;
            }}
            args={[undefined, undefined, Math.max(1, counts[k])]}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={textures[k]} color={new Color('#efe6dc')} toneMapped={false} />
          </instancedMesh>
        </group>
      ))}
      <lineSegments geometry={lines.lineGeo} frustumCulled={false}>
        <lineBasicMaterial color="#e8c98a" transparent opacity={0.2} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points geometry={lines.glintGeo} material={glintMat} frustumCulled={false} />
    </group>
  );
}

/** A dark constellation of your photographs, joined by faint golden threads. */
export function MemoryGalaxy() {
  const { urls, indices } = useMemo(() => {
    const unique = Array.from(new Set(birthdayContent.photos.map((p) => p.image)));
    return { urls: unique, indices: birthdayContent.photos.map((p) => unique.indexOf(p.image)) };
  }, []);
  return (
    <Suspense fallback={null}>
      <Photos urls={urls} indices={indices} />
    </Suspense>
  );
}
