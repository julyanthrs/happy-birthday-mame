import { useMemo, useRef } from 'react';
import { PROGRESS_STOPS } from '@/config/palette';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { mixMood } from '@/lib/moodMix';
import { smoothstep } from '@/lib/math';

/**
 * A hairline of light down the right edge that fills as you go, shifting
 * gold → rose → cream → gold. Also publishes `--ui-fg`, the text colour for
 * fixed controls, so they stay legible on both the dark and the paper scenes.
 */
export function ScrollProgress() {
  const fill = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const lastTone = useRef(-1);

  const gradient = useMemo(
    () => `linear-gradient(to bottom, ${PROGRESS_STOPS.map((s) => `${s.color} ${(s.at * 100).toFixed(1)}%`).join(', ')})`,
    [],
  );

  useStoryFrame((s) => {
    const p = s.progress;
    if (fill.current) fill.current.style.clipPath = `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`;
    if (head.current) head.current.style.top = `${(p * 100).toFixed(2)}%`;
    if (root.current) root.current.style.opacity = (0.15 + 0.85 * smoothstep(0.001, 0.02, p)).toFixed(2);

    const paper = mixMood(s.mood).paper;
    if (Math.abs(paper - lastTone.current) > 0.02) {
      lastTone.current = paper;
      const mix = (a: number, b: number): number => Math.round(a + (b - a) * paper);
      document.documentElement.style.setProperty('--ui-fg', `rgb(${mix(244, 59)}, ${mix(232, 29)}, ${mix(210, 38)})`);
    }
  });

  return (
    <div ref={root} className="progress" aria-hidden="true">
      <div className="progress-track" />
      <div ref={fill} className="progress-fill" style={{ background: gradient }} />
      <div ref={head} className="progress-head" />
    </div>
  );
}
