/**
 * One global pointer tracker. Scrolling is the main interaction; the pointer
 * only adds gentle parallax, tilt and sparkle, so everything reads from this
 * cheap shared object instead of attaching listeners everywhere.
 */
export const pointer = {
  /** Raw, normalised to -1..1 (y up). */
  x: 0,
  y: 0,
  /** Raw, in CSS pixels. */
  px: -100,
  py: -100,
  /** Damped copy that components can read for smooth parallax. */
  sx: 0,
  sy: 0,
  /** True once a real mouse has moved. */
  active: false,
  /** Speed of the last movement in px/frame (decays). */
  speed: 0,
};

let lastX = 0;
let lastY = 0;

export const attachPointer = (): (() => void) => {
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    pointer.active = true;
    pointer.px = e.clientX;
    pointer.py = e.clientY;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.speed = Math.min(60, pointer.speed + Math.hypot(e.clientX - lastX, e.clientY - lastY));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  return () => window.removeEventListener('pointermove', onMove);
};
