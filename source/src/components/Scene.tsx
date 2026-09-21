import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { BirthdayCake } from '@/components/BirthdayCake';
import { EnvelopeScene } from '@/components/EnvelopeScene';
import { FinaleScene } from '@/components/FinaleScene';
import { GuidingLights } from '@/components/GuidingLights';
import { LoveScene } from '@/components/LoveScene';
import { MemoryGalaxy } from '@/components/MemoryGalaxy';
import { PetalTransition } from '@/components/PetalTransition';
import { quality } from '@/config/qualityInstance';
import { CameraRig } from '@/three/CameraRig';
import { Effects } from '@/three/Effects';
import { FloatingHeart } from '@/three/FloatingHeart';
import { ParticleField } from '@/three/ParticleField';
import { SceneLighting } from '@/three/SceneLighting';

/** The fixed WebGL stage behind all the text. Everything in it reads from `story`. */
export function Scene() {
  return (
    <Canvas
      flat
      dpr={quality.dpr}
      shadows={quality.shadows ? 'soft' : false}
      gl={{ antialias: !quality.postprocessing, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 36, near: 0.1, far: 600, position: [0, 1.4, 22] }}
      aria-hidden="true"
    >
      <SceneLighting />
      <CameraRig />
      <Suspense fallback={null}>
        <BirthdayCake />
        <EnvelopeScene />
        <GuidingLights />
        <LoveScene />
        <MemoryGalaxy />
        <PetalTransition />
        <FinaleScene />
        <FloatingHeart />
        <ParticleField count={quality.dust} box={[46, 30, 46]} size={0.05} mode="camera" seed={4} amount={(s) => s.dust} />
      </Suspense>
      <Effects />
    </Canvas>
  );
}
