import { story, type StoryState } from '@/story/storyState';

/**
 * One shared per-frame hub for everything in the DOM that follows the story.
 * (R3F components use useFrame instead.) `changed` is false on frames where the
 * scroll position did not move, so scroll-only effects can skip their work.
 */
export type FrameFn = (s: StoryState, dt: number, changed: boolean) => void;

const subscribers = new Set<FrameFn>();
let lastUnit = Number.NaN;

export const subscribeFrame = (fn: FrameFn): (() => void) => {
  subscribers.add(fn);
  // Let a fresh subscriber paint the current state immediately.
  fn(story, 0, true);
  return () => {
    subscribers.delete(fn);
  };
};

export const runFrame = (dt: number): void => {
  const changed = story.unit !== lastUnit;
  lastUnit = story.unit;
  subscribers.forEach((fn) => fn(story, dt, changed));
};

/** Forces the next frame to report `changed` (after a resize, for example). */
export const invalidateFrame = (): void => {
  lastUnit = Number.NaN;
};
