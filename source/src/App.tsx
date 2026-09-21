import { useEffect, useMemo, useRef } from 'react';
import { BirthdayFinale } from '@/components/BirthdayFinale';
import { BirthdayIntro } from '@/components/BirthdayIntro';
import { BirthdayLetter } from '@/components/BirthdayLetter';
import { ChapterCaptions } from '@/components/ChapterCaptions';
import { CustomCursor } from '@/components/CustomCursor';
import { FinalCake } from '@/components/FinalCake';
import { LoveReasons } from '@/components/LoveReasons';
import { MemoryStory } from '@/components/MemoryStory';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Scene } from '@/components/Scene';
import { ScrollProgress } from '@/components/ScrollProgress';
import { StaticFallback } from '@/components/StaticFallback';
import { Transcript } from '@/components/Transcript';
import { Veil } from '@/components/Veil';
import { WishScene } from '@/components/WishScene';
import { scrollSpacerVh } from '@/config/chapters';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { scrollToEnd } from '@/story/scroll';

const hasWebGL = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

function Experience() {
  const spacer = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useSmoothScroll(spacer, reduced);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduced);
  }, [reduced]);

  return (
    <main aria-label="A birthday gift">
      <a
        href="#end"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          scrollToEnd();
        }}
      >
        Skip to the last message
      </a>
      <Transcript />
      <div className="stage">
        <Scene />
      </div>
      <div className="overlay">
        <BirthdayIntro />
        <WishScene />
        <ChapterCaptions />
        <BirthdayLetter />
        <MemoryStory />
        <LoveReasons />
        <BirthdayFinale />
        <FinalCake />
      </div>
      <ScrollProgress />
      <MusicPlayer />
      <CustomCursor />
      <Veil />
      <div ref={spacer} id="end" aria-hidden="true" style={{ height: `${scrollSpacerVh}vh` }} />
    </main>
  );
}

export function App() {
  const webgl = useMemo(hasWebGL, []);
  return webgl ? <Experience /> : <StaticFallback />;
}
