import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { quality } from '@/config/qualityInstance';
import { heartbeat } from '@/lib/beat';
import { mixMood } from '@/lib/moodMix';
import { story } from '@/story/storyState';

type BloomHandle = { intensity: number };
type VignetteHandle = { darkness: number };

/** Bloom is what makes flames, dust and fireworks feel like light. Desktop and tablet only. */
export function Effects() {
  const bloom = useRef<BloomHandle | null>(null);
  const vignette = useRef<VignetteHandle | null>(null);

  useFrame((state) => {
    const m = mixMood(story.mood);
    const beat = story.wishAmt * heartbeat(state.clock.elapsedTime);
    if (bloom.current) bloom.current.intensity = m.bloom * (0.85 + 0.35 * beat) + story.bloomPulse;
    if (vignette.current) vignette.current.darkness = 0.7 - 0.5 * m.paper;
  });

  if (!quality.postprocessing) return null;
  return (
    <EffectComposer multisampling={quality.tier === 'desktop' ? 4 : 0}>
      <Bloom
        ref={bloom as never}
        mipmapBlur
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        intensity={0.9}
        radius={0.72}
      />
      <Vignette ref={vignette as never} offset={0.28} darkness={0.7} />
    </EffectComposer>
  );
}
