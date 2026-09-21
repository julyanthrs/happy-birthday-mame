import { useEffect, useRef } from 'react';
import { subscribeFrame, type FrameFn } from '@/story/frameLoop';

/** Runs `fn` every frame with the live story. `fn` may change identity freely. */
export const useStoryFrame = (fn: FrameFn): void => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => subscribeFrame((s, dt, changed) => ref.current(s, dt, changed)), []);
};
