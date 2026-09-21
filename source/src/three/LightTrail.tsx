import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector3, type PointLight, type Sprite, type SpriteMaterial } from 'three';
import { quality } from '@/config/qualityInstance';
import { clamp, smoothstep } from '@/lib/math';
import { getStarTexture } from '@/three/textures';
import { story } from '@/story/storyState';

const vertex = /* glsl */ `
attribute float aFade;
uniform float uAlpha;
uniform float uSize;
uniform float uVH;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float f = aFade;
  vA = pow(f, 1.6) * uAlpha;
  float sz = uSize * (0.35 + f * 0.9);
  gl_PointSize = clamp(sz * uVH * 0.5 * projectionMatrix[1][1] / max(0.1, -mv.z), 1.0, 60.0);
}
`;
const fragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor * (0.8 + a), a * vA);
  #include <colorspace_fragment>
}
`;

interface Props {
  /** Which entry of `story.trails` drives this trail (0–1 along its path). */
  index: number;
  /** Writes the path position at progress `t` (0–1) into `out`. */
  pointAt: (t: number, out: Vector3) => void;
  /** Length of the tail as a fraction of the whole path. */
  tail: number;
  size?: number;
  color?: string;
  /** Adds a real point light riding on the head. */
  light?: boolean;
  /** Multiplies the number of points, for a smoother stream. */
  density?: number;
  /** Overall opacity, 0–1. */
  strength?: number;
}

/**
 * The recurring guiding light: a bright head with a fading comet tail. Every
 * position is computed from scroll progress alone, so it flies backwards too.
 */
export function LightTrail({ index, pointAt, tail, size = 0.16, color = '#ffd9a0', light = false, density = 1, strength = 1 }: Props) {
  const n = Math.round(quality.trailPoints * density);
  const head = useRef<Sprite>(null);
  const lamp = useRef<PointLight>(null);
  const tmp = useMemo(() => new Vector3(), []);

  const { geometry, material, positions } = useMemo(() => {
    const pos = new Float32Array(n * 3);
    const fade = new Float32Array(n);
    for (let i = 0; i < n; i++) fade[i] = 1 - i / (n - 1);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aFade', new BufferAttribute(fade, 1));
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uAlpha: { value: 0 }, uSize: { value: size }, uVH: { value: 1000 }, uColor: { value: new Color(color) } },
    });
    return { geometry: g, material: m, positions: pos };
  }, [n, size, color]);
  const star = useMemo(() => getStarTexture(), []);

  useFrame((state) => {
    const t = story.trails[index];
    const alpha = smoothstep(0, 0.03, t) * (1 - smoothstep(0.96, 1, t));
    material.uniforms.uAlpha.value = alpha * strength;
    const visible = alpha > 0.002;
    material.visible = visible;
    if (head.current) head.current.visible = visible;
    if (lamp.current) lamp.current.intensity = visible ? 14 * alpha : 0;
    if (!visible) return;

    material.uniforms.uVH.value = state.size.height * state.viewport.dpr;
    for (let i = 0; i < n; i++) {
      pointAt(clamp(t - (i / (n - 1)) * tail), tmp);
      positions[i * 3] = tmp.x;
      positions[i * 3 + 1] = tmp.y;
      positions[i * 3 + 2] = tmp.z;
    }
    (geometry.attributes.position as BufferAttribute).needsUpdate = true;
    pointAt(t, tmp);
    if (head.current) {
      head.current.position.copy(tmp);
      const m = head.current.material as SpriteMaterial;
      m.opacity = alpha;
      m.rotation = state.clock.elapsedTime * 0.8;
      head.current.scale.setScalar(size * 9 * (0.9 + 0.1 * Math.sin(state.clock.elapsedTime * 6)));
    }
    if (lamp.current) lamp.current.position.copy(tmp);
  });

  return (
    <>
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={25} />
      <sprite ref={head} renderOrder={26} visible={false}>
        <spriteMaterial map={star} color={color} blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
      </sprite>
      {light ? <pointLight ref={lamp} color={color} intensity={0} distance={16} decay={2} /> : null}
    </>
  );
}
