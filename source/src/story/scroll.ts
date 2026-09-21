/**
 * Scroll engine. Lenis smooths the wheel; one GSAP ScrollTrigger reports raw
 * scroll progress (0–1) across the whole page. `applyStory` is driven
 * directly, every time, from that real position — there is no separate
 * "story position" that can lag behind, chase, lease, or settle on its own.
 * If real scroll doesn't move, the story doesn't move, full stop, with zero
 * exceptions. If real scroll moves, the story moves by exactly that much,
 * immediately.
 *
 * Pacing (why "wish" needs more scrolling than "letter" per unit of story)
 * comes entirely from Lenis's own `wheelMultiplier`, tuned per chapter below:
 * it changes how many real scroll pixels one physical wheel/trackpad notch
 * produces, so slow chapters simply need more physical scrolling to get
 * through — it never introduces a time-based ceiling that the story could
 * fall behind and later have to auto-play to close. Earlier attempts at a
 * separate rate cap (chasing a lagging target, or force-correcting the real
 * scrollbar every frame) either produced visible auto-play after the reader
 * stopped, could permanently strand the story once real scroll hit the
 * bottom of the page owing unplayed debt, or fought the browser's own
 * scroll/layout engine on top of the R3F render and caused lag. This is
 * simpler and has none of those failure modes, at the cost of no longer
 * hard-guaranteeing that an extreme action (a scrollbar drag, an End-key
 * press) can't cross a chapter in one jump — the wheelMultiplier tuning
 * still makes that require a lot of physical scrolling to reach, it's just
 * not mathematically impossible the way a hard cap would be.
 * A single GSAP ticker runs the per-frame DOM work alongside this.
 */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { birthdayContent } from '@/data/birthdayContent';
import { chapterAtUnit, TOTAL_UNITS, type ChapterName } from '@/config/chapters';
import { clamp, damp } from '@/lib/math';
import { attachPointer, pointer } from '@/story/pointer';
import { invalidateFrame, runFrame } from '@/story/frameLoop';
import { resetStory, story } from '@/story/storyState';
import { applyStory } from '@/story/timeline';

gsap.registerPlugin(ScrollTrigger);

interface WheelTuning {
  virtualScroll?: { options: { wheelMultiplier: number; touchMultiplier: number } };
}

let lenis: Lenis | null = null;
let trigger: ScrollTrigger | null = null;

/** Scroll is deliberately slower in the moments that need to breathe. */
const WHEEL_BY_CHAPTER: Partial<Record<ChapterName, number>> = {
  cakeSpin: 0.95,
  lighting: 0.8,
  wish: 0.46,
  blow: 0.75,
  toEnvelope: 0.9,
  envelope: 0.85,
  unfold: 1,
  letter: 1,
  memoryBridge: 1,
  memories: 0.85,
  love: 0.9,
  finale: 0.9,
};
const DEFAULT_WHEEL = 1;

export const startStory = (spacer: HTMLElement, reduced: boolean): (() => void) => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  resetStory(birthdayContent.settings.candleCount, reduced);
  applyStory(0);
  invalidateFrame();

  const detachPointer = attachPointer();

  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, duration: 1.05, smoothWheel: true, wheelMultiplier: DEFAULT_WHEEL, touchMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
  }

  let lastY = window.scrollY;
  let lastChapter: ChapterName | null = null;

  trigger = ScrollTrigger.create({
    trigger: spacer,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => applyStory(self.progress * TOTAL_UNITS),
  });

  const tick = (time: number, deltaTime: number): void => {
    const dt = Math.min(0.05, deltaTime / 1000);
    lenis?.raf(time * 1000);

    pointer.sx = damp(pointer.sx, pointer.x, 5, dt);
    pointer.sy = damp(pointer.sy, pointer.y, 5, dt);
    pointer.speed *= Math.exp(-7 * dt);

    const y = window.scrollY;
    const rawSpeed = lenis ? Math.abs(lenis.velocity) : Math.abs(y - lastY);
    lastY = y;
    story.velocity = damp(story.velocity, clamp(rawSpeed / 55), 5, dt);

    const chapter = chapterAtUnit(story.unit);
    if (lenis && chapter !== lastChapter) {
      lastChapter = chapter;
      const vs = (lenis as unknown as WheelTuning).virtualScroll;
      if (vs) vs.options.wheelMultiplier = WHEEL_BY_CHAPTER[chapter] ?? DEFAULT_WHEEL;
    }

    runFrame(dt);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const refresh = (): void => {
    ScrollTrigger.refresh();
    invalidateFrame();
  };
  window.addEventListener('load', refresh);
  void document.fonts?.ready.then(refresh);

  return () => {
    window.removeEventListener('load', refresh);
    gsap.ticker.remove(tick);
    trigger?.kill();
    trigger = null;
    lenis?.destroy();
    lenis = null;
    detachPointer();
  };
};

/** Smoothly carries the reader back to the beginning. */
export const scrollToStart = (): void => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 3.6, easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
};

/** Jumps to the final message (for the keyboard "skip" link). */
export const scrollToEnd = (): void => {
  const target = document.documentElement.scrollHeight - window.innerHeight;
  if (lenis) lenis.scrollTo(target, { duration: 0 });
  else window.scrollTo({ top: target, behavior: 'auto' });
};

export const pauseScroll = (): void => lenis?.stop();
export const resumeScroll = (): void => lenis?.start();
