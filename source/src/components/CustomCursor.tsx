import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { damp, mulberry32, TAU } from '@/lib/math';
import { pointer } from '@/story/pointer';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const MAX_SPARKS = 44;
const rand = mulberry32(404);

/**
 * A small golden light that follows the mouse, with a slow ring and a trail of
 * sparkles. Desktop with a real mouse only; it never gets in the way of reading.
 */
export function CustomCursor() {
  const enabled = useMemo(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches, []);
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const ringPos = useRef({ x: -100, y: -100 });
  const hover = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    document.documentElement.classList.add('has-cursor');
    const over = (e: PointerEvent): void => {
      hover.current = e.target instanceof Element && e.target.closest('button, a, [data-cursor]') !== null;
      ring.current?.classList.toggle('is-hover', hover.current);
    };
    const resize = (): void => {
      const c = canvas.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointerover', over);
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  useStoryFrame((_s, dt) => {
    if (!enabled) return;
    const shown = pointer.active;
    const d = dot.current;
    const r = ring.current;
    if (d) {
      d.style.opacity = shown ? '1' : '0';
      d.style.transform = `translate3d(${pointer.px}px, ${pointer.py}px, 0)`;
    }
    ringPos.current.x = damp(ringPos.current.x, pointer.px, 11, dt || 0.016);
    ringPos.current.y = damp(ringPos.current.y, pointer.py, 11, dt || 0.016);
    if (r) {
      r.style.opacity = shown ? '1' : '0';
      r.style.transform = `translate3d(${ringPos.current.x.toFixed(1)}px, ${ringPos.current.y.toFixed(1)}px, 0)`;
    }

    const c = canvas.current;
    const g = c?.getContext('2d');
    if (!c || !g || reduced) return;
    const list = sparks.current;
    if (shown && pointer.speed > 3 && list.length < MAX_SPARKS) {
      const n = pointer.speed > 20 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const a = rand() * TAU;
        list.push({ x: pointer.px + (rand() - 0.5) * 8, y: pointer.py + (rand() - 0.5) * 8, vx: Math.cos(a) * 12, vy: Math.sin(a) * 12 - 8, life: 1, size: 2 + rand() * 3.2 });
      }
    }
    if (list.length === 0) return;
    g.clearRect(0, 0, c.width, c.height);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt * 1.5;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 14 * dt;
      const a = p.life * p.life;
      g.globalAlpha = a;
      g.fillStyle = '#ffe2a6';
      g.beginPath();
      g.moveTo(p.x, p.y - p.size);
      g.quadraticCurveTo(p.x, p.y, p.x + p.size, p.y);
      g.quadraticCurveTo(p.x, p.y, p.x, p.y + p.size);
      g.quadraticCurveTo(p.x, p.y, p.x - p.size, p.y);
      g.quadraticCurveTo(p.x, p.y, p.x, p.y - p.size);
      g.fill();
    }
    g.globalAlpha = 1;
    if (list.length === 0) g.clearRect(0, 0, c.width, c.height);
  });

  if (!enabled) return null;
  return (
    <div aria-hidden="true">
      <canvas ref={canvas} className="cursor-trail" />
      <div ref={ring} className="cursor-ring" style={{ opacity: 0 }} />
      <div ref={dot} className="cursor-dot" style={{ opacity: 0 }} />
    </div>
  );
}
