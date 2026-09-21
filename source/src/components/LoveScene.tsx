import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  IcosahedronGeometry,
  MathUtils,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type BufferGeometry,
  type Group,
  type Mesh,
  type PerspectiveCamera,
  type Sprite,
  type SpriteMaterial,
} from 'three';
import { at } from '@/config/chapters';
import { birthdayContent } from '@/data/birthdayContent';
import { LOVE, loveFocusFraction, loveGlyphZ } from '@/config/world';
import { whenFontsReady } from '@/lib/fonts';
import { clamp, invLerp, smoothstep } from '@/lib/math';
import { drawGlowText } from '@/lib/textCanvas';
import { createHeartGeometry, createStarGeometry } from '@/three/shapes';
import { getGlowTexture } from '@/three/textures';
import { story } from '@/story/storyState';

const ITEMS = birthdayContent.thingsILove.items;
const PLANE_H = 1.6;
const GLYPH_DISTANCE = LOVE.ahead;
const SHOW_FROM = at('memories', 0.85);
const SHOW_TO = at('galaxy', 0.2);
const COLORS = ['#f0c56a', '#f59ab8', '#fdf3e6'] as const;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Six reveal styles, so every characteristic arrives in its own small way. */
const fragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uReveal;
uniform float uAlpha;
uniform float uTime;
uniform float uMode;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 uv = vUv;
  float r = uReveal;
  float bias = 0.0;
  float mask = 1.0;
  float edge = 0.0;
  if (uMode < 0.5) {
    uv.y += (1.0 - r) * 0.18;
    mask = 1.0 - smoothstep(r * 1.3 - 0.35, r * 1.3 - 0.05, uv.y);
  } else if (uMode < 1.5) {
    float n = noise(uv * vec2(16.0, 5.0));
    mask = smoothstep(n - 0.12, n, r * 1.25 - 0.1);
  } else if (uMode < 2.5) {
    uv.x += sin(uv.y * 18.0 + uTime * 3.0) * 0.03 * (1.0 - r);
    uv.y += sin(uv.x * 10.0 - uTime * 2.0) * 0.05 * (1.0 - r);
    mask = smoothstep(0.0, 0.6, r);
  } else if (uMode < 3.5) {
    bias = (1.0 - r) * 6.0;
    mask = smoothstep(0.0, 0.5, r);
  } else if (uMode < 4.5) {
    float side = step(0.5, uv.x) * 2.0 - 1.0;
    uv.x -= side * (1.0 - r) * (1.0 - r) * 0.35;
    mask = smoothstep(0.0, 0.4, r);
  } else {
    float head = r * 1.3 - 0.15;
    mask = 1.0 - smoothstep(head - 0.3, head - 0.05, uv.x);
    edge = exp(-pow((uv.x - (head - 0.16)) * 14.0, 2.0)) * (1.0 - step(0.999, r));
  }
  vec4 tex = texture2D(uMap, uv, bias);
  vec3 col = tex.rgb + vec3(1.0, 0.92, 0.75) * edge * tex.a * 1.4;
  gl_FragColor = vec4(col, tex.a * mask * uAlpha);
  #include <colorspace_fragment>
}
`;

interface Glyph {
  material: ShaderMaterial;
  aspect: number;
  texture: CanvasTexture;
}

const buildGlyphs = (): Glyph[] =>
  ITEMS.map((item, i) => {
    const { canvas, aspect } = drawGlowText(item.title, { font: '500 %spx "Cormorant Garamond"', size: 140, letterSpacing: 2 }, { fill: '#fff4de', glow: '#ffc873' });
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uMap: { value: texture }, uReveal: { value: 0 }, uAlpha: { value: 0 }, uTime: { value: 0 }, uMode: { value: i % 6 } },
    });
    return { material, aspect, texture };
  });

type OrnamentKind = 'heart' | 'star' | 'ring' | 'gem' | 'orb';
const KINDS: OrnamentKind[] = ['heart', 'star', 'ring', 'gem', 'orb'];

const ornamentGeometry = (kind: OrnamentKind): BufferGeometry => {
  switch (kind) {
    case 'heart':
      return createHeartGeometry(0.24);
    case 'star':
      return createStarGeometry(0.16);
    case 'ring':
      return new TorusGeometry(0.42, 0.06, 18, 64);
    case 'gem':
      return new IcosahedronGeometry(0.46, 0);
    default:
      return new SphereGeometry(0.34, 32, 24);
  }
};

const ORNAMENT_SIZE: Record<OrnamentKind, number> = { heart: 0.68, star: 0.72, ring: 0.66, gem: 0.62, orb: 0.6 };

/**
 * "Things I love about you": each characteristic arrives as glowing lettering
 * floating in the dark, with a small luminous object beside it. The camera
 * dwells on each one (see cameraPath.ts) before flying on.
 */
export function LoveScene() {
  const [glyphs, setGlyphs] = useState<Glyph[]>([]);
  const root = useRef<Group>(null);
  const groups = useRef<Array<Group | null>>([]);
  const meshes = useRef<Array<Mesh | null>>([]);
  const ornaments = useRef<Array<Mesh | null>>([]);
  const halos = useRef<Array<Sprite | null>>([]);
  const glow = useMemo(() => getGlowTexture(), []);
  const geometries = useMemo(() => ITEMS.map((_, i) => ornamentGeometry(KINDS[i % KINDS.length])), []);

  useEffect(() => {
    let alive = true;
    let built: Glyph[] = [];
    void whenFontsReady().then(() => {
      if (!alive) return;
      built = buildGlyphs();
      setGlyphs(built);
    });
    return () => {
      alive = false;
      built.forEach((g) => {
        g.texture.dispose();
        g.material.dispose();
      });
    };
  }, []);

  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    const u = story.unit;
    r.visible = u > SHOW_FROM && u < SHOW_TO;
    if (!r.visible) return;

    const f = invLerp(at('love'), at('love', 1), u);
    const t = state.clock.elapsedTime;
    const cam = state.camera as PerspectiveCamera;
    const visW = 2 * GLYPH_DISTANCE * Math.tan(MathUtils.degToRad(cam.fov) / 2) * cam.aspect;

    for (let i = 0; i < ITEMS.length; i++) {
      const g = groups.current[i];
      const glyph = glyphs[i];
      if (!g || !glyph) continue;
      const fc = loveFocusFraction(i);
      const reveal = smoothstep(fc - 0.078, fc - 0.012, f);
      const alpha = smoothstep(fc - 0.095, fc - 0.05, f) * (1 - smoothstep(fc + 0.03, fc + 0.062, f));
      g.visible = alpha > 0.004;
      if (!g.visible) continue;

      const approach = (1 - smoothstep(fc - 0.1, fc - 0.005, f)) * -4.5;
      const side = i % 2 === 0 ? -1 : 1;
      g.position.set(side * 0.35 * (story.reduced ? 0 : 1), story.cam.y + 0.1 + Math.sin(t * 0.6 + i) * 0.05, loveGlyphZ(i) + approach * (story.reduced ? 0.3 : 1));
      g.rotation.y = side * 0.1;

      const width = PLANE_H * glyph.aspect;
      const fit = Math.min(1, (visW * 0.82) / width);
      const mesh = meshes.current[i];
      if (mesh) {
        mesh.scale.set(width * fit, PLANE_H * fit, 1);
        mesh.position.y = -0.25;
      }
      const u2 = glyph.material.uniforms;
      u2.uReveal.value = reveal;
      u2.uAlpha.value = alpha;
      u2.uTime.value = t;

      const orn = ornaments.current[i];
      if (orn) {
        const kind = KINDS[i % KINDS.length];
        const spread = Math.min(1.7, visW * 0.22);
        orn.position.set(side * spread, 0.95 + Math.sin(t * 0.9 + i * 1.7) * 0.1, 0.4);
        const flat = kind === 'heart' || kind === 'star';
        orn.rotation.set(0.25 * Math.sin(t * 0.5 + i), flat ? 0.85 * Math.sin(t * 0.6 + i) : t * 0.7 + i, kind === 'ring' ? t * 0.4 : 0);
        orn.scale.setScalar(ORNAMENT_SIZE[kind] * smoothstep(0, 1, clamp(reveal * 1.4)) * alpha * (0.94 + 0.06 * Math.sin(t * 2 + i)));
        const halo = halos.current[i];
        if (halo) {
          halo.position.copy(orn.position);
          halo.scale.setScalar(Math.max(0.001, orn.scale.x * 3.2));
          (halo.material as SpriteMaterial).opacity = 0.55 * alpha;
        }
      }
    }
  });

  return (
    <group ref={root} visible={false}>
      {ITEMS.map((item, i) => {
        const color = new Color(COLORS[i % COLORS.length]);
        return (
          <group
            key={item.title}
            ref={(g) => {
              groups.current[i] = g;
            }}
            visible={false}
          >
            {glyphs[i] ? (
              <mesh
                ref={(m) => {
                  meshes.current[i] = m;
                }}
                material={glyphs[i].material}
                renderOrder={22}
              >
                <planeGeometry args={[1, 1]} />
              </mesh>
            ) : null}
            <mesh
              ref={(m) => {
                ornaments.current[i] = m;
              }}
              geometry={geometries[i]}
            >
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.3} roughness={0.28} flatShading={KINDS[i % KINDS.length] === 'gem'} />
            </mesh>
            <sprite
              ref={(sp) => {
                halos.current[i] = sp;
              }}
              renderOrder={21}
            >
              <spriteMaterial map={glow} color={color} blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
            </sprite>
          </group>
        );
      })}
    </group>
  );
}
