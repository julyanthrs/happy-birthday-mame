import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

/** Follows the OS "reduce motion" setting live. */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};
