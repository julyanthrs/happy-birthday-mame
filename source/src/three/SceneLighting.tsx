import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Color, FogExp2, type DirectionalLight, type Group, type Object3D } from 'three';
import { quality } from '@/config/qualityInstance';
import { heartbeat } from '@/lib/beat';
import { mixMood } from '@/lib/moodMix';
import { cakeAnchor } from '@/story/cakeStage';
import { story } from '@/story/storyState';

/**
 * Background, fog and the three lights all follow `story.mood`, so the world
 * drifts from candlelit dark to warm paper to rose to midnight without any
 * component having to know about it. Light count never changes (that would
 * force shader recompiles) — intensities just go to zero.
 */
export function SceneLighting() {
  const scene = useThree((s) => s.scene);
  const rig = useRef<Group>(null);
  const key = useRef<DirectionalLight>(null);
  const keyTarget = useRef<Object3D>(null);
  const ambient = useRef<import('three').AmbientLight>(null);
  const rim = useRef<DirectionalLight>(null);

  useEffect(() => {
    scene.background = new Color('#050205');
    scene.fog = new FogExp2('#050205', 0.13);
    if (key.current && keyTarget.current) key.current.target = keyTarget.current;
    if (rim.current && keyTarget.current) rim.current.target = keyTarget.current;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useFrame((state) => {
    const s = story;
    const m = mixMood(s.mood);
    // The first frame can run before the effect below; never assume they exist.
    if (!(scene.background instanceof Color)) scene.background = new Color('#050205');
    if (!(scene.fog instanceof FogExp2)) scene.fog = new FogExp2('#050205', 0.13);
    scene.background.copy(m.bg);
    const fog = scene.fog;
    fog.color.copy(m.bg);
    fog.density = s.fog;
    scene.environmentIntensity = m.env * s.exposure;

    const beat = s.wishAmt * heartbeat(state.clock.elapsedTime);
    let lit = 0;
    let out = 0;
    for (const c of s.candles) {
      lit += c.light * (1 - c.out);
      out += c.out;
    }
    const n = Math.max(1, s.candles.length);
    const dimmed = 1 - 0.4 * (out / n) * (1 - m.paper);

    if (ambient.current) {
      ambient.current.color.copy(m.ambient);
      ambient.current.intensity = m.ambientI * s.exposure * (1 + 0.25 * beat);
    }
    if (key.current) {
      key.current.color.copy(m.key);
      key.current.intensity = m.keyI * s.exposure * dimmed * (1 + 0.3 * beat) + (lit / n) * 0.15;
    }
    if (rim.current) {
      rim.current.color.copy(m.rim);
      rim.current.intensity = m.rimI * s.exposure;
    }
    if (rig.current) {
      const a = cakeAnchor(s.unit);
      rig.current.position.set(a.x, a.y, a.z);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0} />
      <group ref={rig}>
        <directionalLight
          ref={key}
          position={[4.5, 7, 6.5]}
          intensity={0}
          castShadow={quality.shadows}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0006}
          shadow-normalBias={0.02}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={5}
          shadow-camera-bottom={-3}
          shadow-camera-near={1}
          shadow-camera-far={20}
        />
        <directionalLight ref={rim} position={[-5, 3.5, -6]} intensity={0} />
        <object3D ref={keyTarget} position={[0, 1.2, 0]} />
      </group>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#ffe2bf" position={[3, 4, 4]} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#ff9db5" position={[-5, 2, -3]} scale={[6, 6, 1]} />
        <Lightformer form="circle" intensity={1.6} color="#fff1dc" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
        <Lightformer form="rect" intensity={0.7} color="#ffd9a0" position={[0, -3, 5]} scale={[8, 2, 1]} />
      </Environment>
    </>
  );
}
