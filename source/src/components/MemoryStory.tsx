import { forwardRef, useEffect, useRef } from 'react';
import { Caption } from '@/components/Caption';
import { at } from '@/config/chapters';
import { birthdayContent as c, type Memory } from '@/data/birthdayContent';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { curve } from '@/lib/curve';
import { easeOutBack, invLerp, smoothstep } from '@/lib/math';
import { pointer } from '@/story/pointer';
import { win } from '@/story/windows';

const PERSPECTIVE = 1100;
const SPACING = 1250;
const FIRST = 900;
const READ = 400;
const MEMORIES = c.memories;
const COUNT = MEMORIES.length;

/** Where each photo sits (fractions of the viewport), how it is turned, in degrees. */
const LAYOUT = [
  { x: -0.2, y: -0.03, r: -4, ry: 9 },
  { x: 0.19, y: 0.05, r: 3, ry: -9 },
  { x: -0.16, y: -0.07, r: -2.5, ry: 7 },
  { x: 0.2, y: 0.03, r: 4, ry: -8 },
  { x: -0.18, y: -0.02, r: -3.5, ry: 8 },
  { x: 0.14, y: 0.02, r: 2, ry: -6 },
] as const;

/** The first photos land on the letter before floating away. */
const BRIDGE = [
  { x: -0.17, y: -0.14, r: -7, from: -12 },
  { x: 0.15, y: -0.01, r: 5, from: 14 },
  { x: -0.05, y: 0.17, r: -3, from: -9 },
  { x: 0.1, y: 0.25, r: 8, from: 11 },
] as const;

const focus = (i: number): number => 0.22 + ((i + 0.5) / COUNT) * 0.72;
const depth = (i: number): number => FIRST + i * SPACING;

/** Camera depth along the photos: it dwells on each polaroid, then glides to the next. */
const cameraAt = (() => {
  const dwell = 0.022;
  const keys: Array<[number, number]> = [[0, -250]];
  for (let i = 0; i < COUNT; i++) keys.push([focus(i) - dwell, depth(i) - READ], [focus(i) + dwell, depth(i) - READ]);
  keys.push([1, depth(COUNT - 1) - READ + 900]);
  return curve(keys);
})();

interface PolaroidProps {
  memory: Memory;
}

const Polaroid = forwardRef<HTMLElement, PolaroidProps>(function Polaroid({ memory }, ref) {
  return (
    <figure ref={ref} className="polaroid">
      <span className="tape" aria-hidden="true" />
      <img src={memory.image} alt="" draggable={false} decoding="async" />
      <figcaption>
        <span className="cap">{memory.caption}</span>
        {memory.date ? <span className="date">{memory.date}</span> : null}
      </figcaption>
    </figure>
  );
});

/**
 * Two moments: a few photographs drop onto the letter and lift away, then the
 * rest float toward you through real 3D space (CSS 3D transforms), one at a
 * time, each with its handwritten caption.
 */
export function MemoryStory() {
  const plane = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bridgeStage = useRef<HTMLDivElement>(null);
  const items = useRef<Array<HTMLElement | null>>([]);
  const bridge = useRef<Array<HTMLElement | null>>([]);
  const size = useRef({ w: 1000, h: 700 });

  useEffect(() => {
    const update = (): void => {
      size.current = { w: window.innerWidth, h: window.innerHeight };
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useStoryFrame((s) => {
    const u = s.unit;
    const { w, h } = size.current;
    const compact = w < 700;

    // ── Photos landing on the letter, then lifting off ─────────────────────
    const fm = invLerp(at('memories'), at('memories', 0.16), u);
    const lift = smoothstep(0, 1, fm);
    const bridgeOn = u > at('memoryBridge', 0.15) && u < at('memories', 0.2);
    if (bridgeStage.current) bridgeStage.current.style.display = bridgeOn ? '' : 'none';
    if (bridgeOn) {
      BRIDGE.forEach((b, k) => {
        const el = bridge.current[k];
        if (!el) return;
        const t = invLerp(at('memoryBridge', 0.2 + 0.12 * k), at('memoryBridge', 0.44 + 0.12 * k), u);
        const drop = 1 - easeOutBack(t, 1.05);
        const spread = compact ? 0.6 : 1;
        const x = b.x * h * spread;
        const y = b.y * h - drop * h * 1.25 - lift * h * 0.2;
        const rot = b.r + (1 - t) * b.from;
        const z = lift * PERSPECTIVE;
        el.style.opacity = (Math.min(1, t * 4) * (1 - smoothstep(0.2, 0.95, lift))).toFixed(3);
        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px) rotateZ(${rot.toFixed(2)}deg) rotateX(${(lift * 28).toFixed(1)}deg)`;
      });
    }

    // ── The floating memories ────────────────────────────────────────────────
    const on = u > at('memories', 0.02) && u < at('love', 0.03);
    if (stage.current) stage.current.style.display = on ? '' : 'none';
    if (!on) return;

    const f = invLerp(at('memories'), at('memories', 1), u);
    const cam = cameraAt(f);
    if (plane.current) {
      const calm = s.reduced ? 0 : 1;
      plane.current.style.transform = `rotateY(${(pointer.sx * 2.6 * calm).toFixed(2)}deg) rotateX(${(-pointer.sy * 1.6 * calm + s.velocity * 2.5 * calm).toFixed(2)}deg)`;
    }
    const t = performance.now() / 1000;
    MEMORIES.forEach((_, i) => {
      const el = items.current[i];
      if (!el) return;
      const rel = depth(i) - cam;
      const a = smoothstep(2700, 1700, rel) * smoothstep(120, 400, rel);
      el.style.visibility = a < 0.005 ? 'hidden' : 'visible';
      if (a < 0.005) return;
      const p = LAYOUT[i % LAYOUT.length];
      const spread = compact ? 0.5 : 1;
      const bob = s.reduced ? 0 : Math.sin(t * 0.7 + i * 1.9) * 7;
      const blur = compact || s.reduced ? 0 : Math.max(0, Math.min(5, (rel - 1100) / 450));
      el.style.opacity = a.toFixed(3);
      el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : '';
      el.style.transform = `translate3d(calc(-50% + ${(p.x * w * spread).toFixed(1)}px), calc(-50% + ${(p.y * h + bob).toFixed(1)}px), ${(-rel).toFixed(1)}px) rotateZ(${p.r}deg) rotateY(${(p.ry * Math.min(1, rel / 900)).toFixed(2)}deg)`;
    });
  });

  return (
    <>
      <Caption window={win('memoryBridge', 0.02, 0.16, 0.5, 0.68)} className="cap-bottom cap-ink" rise={10} blur={4}>
        <p className="display-md ink">{c.letterBridge}</p>
      </Caption>

      <div ref={bridgeStage} className="layer perspective-layer" style={{ display: 'none' }} aria-hidden="true">
        {BRIDGE.map((_, k) => (
          <div
            key={k}
            className="memory-item bridge-item"
            ref={(el) => {
              bridge.current[k] = el;
            }}
          >
            <Polaroid memory={MEMORIES[k % COUNT]} />
          </div>
        ))}
      </div>

      <div ref={stage} className="layer perspective-layer" style={{ display: 'none' }} aria-hidden="true">
        <div ref={plane} className="memory-plane">
          {MEMORIES.map((memory, i) => (
            <div
              key={memory.image}
              className="memory-item"
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <Polaroid memory={memory} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
