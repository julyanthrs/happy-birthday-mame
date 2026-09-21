import { useEffect, useState } from 'react';
import { whenFontsReady } from '@/lib/fonts';

/** A held breath of darkness while fonts and the first frames load, then it lifts. */
export function Veil() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let alive = true;
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });
    void Promise.all([whenFontsReady(), loaded]).then(() => {
      window.setTimeout(() => alive && setDone(true), 900);
    });
    const failsafe = window.setTimeout(() => alive && setDone(true), 6000);
    return () => {
      alive = false;
      window.clearTimeout(failsafe);
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`veil ${done ? 'is-done' : ''}`} aria-hidden="true" onTransitionEnd={() => done && setGone(true)}>
      <span className="veil-dot" />
    </div>
  );
}
