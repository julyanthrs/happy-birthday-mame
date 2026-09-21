import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

/** Nudges an element toward a nearby mouse pointer. Does nothing on touch or with reduced motion. */
export const useMagnetic = <T extends HTMLElement>(strength = 0.28, radius = 80): React.RefObject<T> => {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const move = (e: PointerEvent): void => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < radius + r.width / 2;
      el.style.transform = near ? `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)` : '';
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      el.style.transform = '';
    };
  }, [strength, radius]);
  return ref;
};
