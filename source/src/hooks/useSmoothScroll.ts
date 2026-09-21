import { useEffect, type RefObject } from 'react';
import { startStory } from '@/story/scroll';

/** Boots Lenis + the scrubbed timeline against the tall spacer element. */
export const useSmoothScroll = (spacer: RefObject<HTMLElement>, reduced: boolean): void => {
  useEffect(() => {
    if (!spacer.current) return undefined;
    return startStory(spacer.current, reduced);
  }, [spacer, reduced]);
};
