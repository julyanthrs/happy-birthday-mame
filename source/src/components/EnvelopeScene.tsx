import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  type Group,
  type Sprite,
  type SpriteMaterial,
} from 'three';
import { at } from '@/config/chapters';
import { birthdayContent } from '@/data/birthdayContent';
import { ENVELOPE, LETTER_WORLD } from '@/config/world';
import { whenFontsReady } from '@/lib/fonts';
import { lerp, smoothstep } from '@/lib/math';
import { pointer } from '@/story/pointer';
import { story } from '@/story/storyState';
import { getGlowTexture, getPaperTexture } from '@/three/textures';

const { w: W, h: H, flapH: FLAP_H, letterW: LW, letterSegH: SEG } = ENVELOPE;
const HIDE_AFTER = at('memories', 0.5);
const SINK_FROM = at('memoryBridge', 0.4);
const SINK_TO = at('memories', 0.26);
const LETTER_LIFT = LETTER_WORLD.y - ENVELOPE.y;
const THICK = 0.012;

/** The envelope front: paper, faint fold seams, and the handwritten address. */
const paintFront = (canvas: HTMLCanvasElement): void => {
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  const w = canvas.width;
  const h = canvas.height;
  g.fillStyle = '#f8f0e3';
  g.fillRect(0, 0, w, h);
  const paper = getPaperTexture().image as CanvasImageSource;
  g.globalAlpha = 0.55;
  g.drawImage(paper, 0, 0, w, h);
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(120,80,50,0.16)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(w / 2, h * 0.5);
  g.lineTo(w, h);
  g.moveTo(0, 0);
  g.lineTo(w / 2, h * 0.5);
  g.lineTo(w, 0);
  g.stroke();
  const shade = g.createLinearGradient(0, h * 0.5, 0, h);
  shade.addColorStop(0, 'rgba(120,80,50,0)');
  shade.addColorStop(1, 'rgba(120,80,50,0.12)');
  g.fillStyle = shade;
  g.fillRect(0, h * 0.5, w, h * 0.5);

  g.textAlign = 'center';
  g.fillStyle = '#3b1d26';
  g.font = `400 ${h * 0.17}px "Reenie Beanie", cursive`;
  g.fillText(birthdayContent.envelope.title, w / 2, h * 0.81);
  g.fillStyle = 'rgba(59,29,38,0.7)';
  g.font = `italic 400 ${h * 0.05}px "Cormorant Garamond", serif`;
  g.fillText(birthdayContent.envelope.subtitle, w / 2, h * 0.91);
};

const triangle = (): ShapeGeometry => {
  const s = new Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(0, -FLAP_H);
  s.closePath();
  const geo = new ShapeGeometry(s);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4, uv.getY(i) * 0.4);
  return geo;
};

const halfSeal = (right: boolean): ExtrudeGeometry => {
  const s = new Shape();
  const start = right ? -Math.PI / 2 : Math.PI / 2;
  s.absarc(0, 0, 0.24, start, start + Math.PI, false);
  s.closePath();
  return new ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 20 });
};

/**
 * The envelope and its tri-fold letter. The flap swings open about its top
 * edge, the wax seal cracks in two, and the letter slides out, then opens by
 * hinging its top and bottom thirds — all driven by `story.env`.
 */
export function EnvelopeScene() {
  const root = useRef<Group>(null);
  const flap = useRef<Group>(null);
  const sealL = useRef<Group>(null);
  const sealR = useRef<Group>(null);
  const letter = useRef<Group>(null);
  const top = useRef<Group>(null);
  const bottom = useRef<Group>(null);
  const topMesh = useRef<Group>(null);
  const bottomMesh = useRef<Group>(null);
  const pulse = useRef<Sprite>(null);
  const burst = useRef<Sprite>(null);

  const paper = useMemo(() => {
    const t = getPaperTexture().clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(1, 1);
    t.needsUpdate = true;
    return t;
  }, []);
  const glow = useMemo(() => getGlowTexture(), []);
  const flapGeo = useMemo(() => triangle(), []);
  const sealGeoL = useMemo(() => halfSeal(false), []);
  const sealGeoR = useMemo(() => halfSeal(true), []);
  const front = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.round(1024 * (H / W));
    paintFront(canvas);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);

  useEffect(() => {
    let alive = true;
    void whenFontsReady().then(() => {
      if (!alive) return;
      paintFront(front.image as HTMLCanvasElement);
      front.needsUpdate = true;
    });
    return () => {
      alive = false;
    };
  }, [front]);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const s = story;
    const e = s.env;
    g.visible = e.appear > 0.001 && s.unit < HIDE_AFTER;
    if (!g.visible) return;
    const t = state.clock.elapsedTime;

    const sink = smoothstep(SINK_FROM, SINK_TO, s.unit);
    const k = (0.86 + 0.14 * e.appear) * (1 - 0.25 * sink);
    g.scale.setScalar(k);
    g.position.set(ENVELOPE.x + sink * 1.4, ENVELOPE.y + Math.sin(t * 0.8) * 0.03 * (1 - e.slide) - sink * 15, ENVELOPE.z - sink * 3);
    g.rotation.set(-0.06 + (s.reduced ? 0 : -pointer.sy * 0.06) + sink * 0.5, e.rotY + (s.reduced ? 0 : pointer.sx * 0.08), Math.sin(t * 0.5) * 0.012 + sink * 0.7);

    if (flap.current) flap.current.rotation.x = -Math.PI * 1.08 * e.flap;

    const drop = Math.pow(e.seal, 2.2);
    const shrink = 1 - smoothstep(0.78, 1, e.seal);
    if (sealL.current) {
      sealL.current.position.set(-0.02 - 0.34 * e.seal, -0.05 * e.seal - 2.1 * drop, 0.05 * e.seal);
      sealL.current.rotation.set(0.9 * drop, 0, 1.1 * e.seal);
      sealL.current.scale.setScalar(Math.max(0.001, shrink));
    }
    if (sealR.current) {
      sealR.current.position.set(0.02 + 0.34 * e.seal, -0.05 * e.seal - 1.9 * drop, 0.05 * e.seal);
      sealR.current.rotation.set(0.7 * drop, 0, -0.9 * e.seal);
      sealR.current.scale.setScalar(Math.max(0.001, shrink));
    }

    if (letter.current) {
      letter.current.position.set(0, lerp(-0.15, LETTER_LIFT, e.slide), lerp(0, LETTER_WORLD.z, e.slide));
      const calm = s.reduced ? 0 : 1;
      letter.current.rotation.set(-pointer.sy * 0.035 * calm * e.slide, pointer.sx * 0.05 * calm * e.slide, 0);
    }
    const flutter = s.reduced ? 0 : Math.sin(t * 1.3) * 0.02;
    if (top.current) top.current.rotation.x = Math.PI * e.fold2 + flutter * (1 - e.fold2);
    if (bottom.current) bottom.current.rotation.x = -Math.PI * e.fold1 - flutter * (1 - e.fold1);
    if (topMesh.current) topMesh.current.position.z = -THICK * 2 * e.fold2;
    if (bottomMesh.current) bottomMesh.current.position.z = -THICK * e.fold1;

    if (pulse.current) {
      pulse.current.visible = e.pulse > 0.01;
      pulse.current.scale.setScalar(1.4 + e.pulse * 3.4);
      (pulse.current.material as SpriteMaterial).opacity = e.pulse * 0.85;
    }
    if (burst.current) {
      const b = Math.sin(Math.PI * Math.min(1, e.seal * 1.6));
      burst.current.visible = b > 0.01 && e.seal < 0.999;
      burst.current.scale.setScalar(0.6 + b * 1.6);
      (burst.current.material as SpriteMaterial).opacity = b * 0.8;
    }
  });

  return (
    <group ref={root} visible={false}>
      {/* soft contact shadow */}
      <sprite position={[0.1, -0.25, -0.35]} scale={[6.2, 4.2, 1]}>
        <spriteMaterial map={glow} color="#5a3320" transparent opacity={0.22} depthWrite={false} fog={false} />
      </sprite>

      {/* back of the envelope */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={paper} color="#ece0c9" roughness={0.9} />
      </mesh>

      {/* the letter, tucked inside */}
      <group ref={letter} position={[0, -0.15, 0]}>
        <mesh>
          <planeGeometry args={[LW, SEG]} />
          <meshStandardMaterial map={paper} color="#fffaf0" roughness={0.9} side={DoubleSide} emissive="#e4dccd" emissiveIntensity={0.4} />
        </mesh>
        <group ref={top} position={[0, SEG / 2, 0]}>
          <group ref={topMesh}>
            <mesh position={[0, SEG / 2, 0]}>
              <planeGeometry args={[LW, SEG]} />
              <meshStandardMaterial map={paper} color="#fffaf0" roughness={0.9} side={DoubleSide} emissive="#e4dccd" emissiveIntensity={0.4} />
            </mesh>
          </group>
        </group>
        <group ref={bottom} position={[0, -SEG / 2, 0]}>
          <group ref={bottomMesh}>
            <mesh position={[0, -SEG / 2, 0]}>
              <planeGeometry args={[LW, SEG]} />
              <meshStandardMaterial map={paper} color="#fffaf0" roughness={0.9} side={DoubleSide} emissive="#e4dccd" emissiveIntensity={0.4} />
            </mesh>
          </group>
        </group>
      </group>

      {/* front of the envelope */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={front} roughness={0.85} />
      </mesh>

      {/* closing flap, hinged along the top edge */}
      <group ref={flap} position={[0, H / 2, 0.045]}>
        <mesh geometry={flapGeo}>
          <meshStandardMaterial map={paper} color="#f3e9d6" roughness={0.85} />
        </mesh>
        <mesh geometry={flapGeo} rotation={[0, Math.PI, 0]} position={[0, 0, -0.004]}>
          <meshStandardMaterial color="#c9788a" roughness={0.7} />
        </mesh>
      </group>

    <group position={[0, H / 2 - FLAP_H + 0.16, 0.09]}>
        <group ref={sealL}>
          <mesh geometry={sealGeoL}>
            <meshStandardMaterial color="#7a2340" roughness={0.38} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.066]}>
            <ringGeometry args={[0.12, 0.155, 24, 1, Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color="#d8b06a" metalness={1} roughness={0.28} side={DoubleSide} />
          </mesh>
        </group>
        <group ref={sealR}>
          <mesh geometry={sealGeoR}>
            <meshStandardMaterial color="#7a2340" roughness={0.38} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.066]}>
            <ringGeometry args={[0.12, 0.155, 24, 1, -Math.PI / 2, Math.PI]} />
            <meshStandardMaterial color="#d8b06a" metalness={1} roughness={0.28} side={DoubleSide} />
          </mesh>
        </group>
        <sprite ref={burst} position={[0, 0, 0.15]} renderOrder={30}>
          <spriteMaterial map={glow} color="#ffd9a0" blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
        </sprite>
      </group>

      {/* the guiding light lands here */}
      <sprite ref={pulse} position={[0, 0, 0.25]} renderOrder={31}>
        <spriteMaterial map={glow} color="#ffe3b0" blending={AdditiveBlending} transparent depthWrite={false} fog={false} opacity={0} toneMapped={false} />
      </sprite>
    </group>
  );
}
