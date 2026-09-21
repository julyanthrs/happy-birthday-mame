import { forwardRef, Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { Caption } from '@/components/Caption';
import { at } from '@/config/chapters';
import { birthdayContent as c, type Memory } from '@/data/birthdayContent';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { curve } from '@/lib/curve';
import { clamp, easeOutBack, invLerp, mulberry32, smoothstep } from '@/lib/math';
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

/** Every photo arrives its own way, so the sequence never feels like the same slide repeating. */
const ENTRANCES = ['left', 'drop', 'spin', 'right', 'flip', 'rise'] as const;

/** The colour of the room drifts from photo to photo. */
const TINTS: ReadonlyArray<readonly [number, number, number]> = [
  [255, 168, 150],
  [255, 208, 140],
  [206, 170, 255],
  [150, 204, 255],
  [255, 156, 196],
  [162, 230, 200],
];

const bump = (x: number): number => Math.sin(Math.PI * clamp(x));

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

/** Bokeh, hearts and sparks that drift past at different depths, so scrolling always feels like travelling. */
const MOTES = (() => {
  const r = mulberry32(2025);
  return Array.from({ length: 30 }, (_, i) => ({
    x: r(),
    y: r(),
    d: 0.25 + r() * 0.75,
    size: 10 + r() * 56,
    kind: i % 6 === 0 ? 'heart' : i % 4 === 0 ? 'spark' : 'bokeh',
    ph: r() * 6.28,
  }));
})();

const SPARKS = Array.from({ length: 10 }, (_, k) => ({
  a: k * 36 + (k % 2) * 11,
  d: 58 + ((k * 23) % 40),
  sz: 4 + ((k * 5) % 4),
  glyph: k % 3 === 0 ? '♥' : '✦',
}));

interface Spring {
  a: number;
  w: number;
}

/** A hanging photograph: it swings when you scroll and settles like a real pendulum. */
const stepSpring = (sp: Spring, kick: number, target: number, dt: number): number => {
  sp.w += (-26 * (sp.a - target) - 3.4 * sp.w + kick) * dt;
  sp.a = clamp(sp.a + sp.w * dt, -14, 14);
  return sp.a;
};

function Handwriting({ text }: { text: string }) {
  let index = 0;
  const words = text.split(' ');
  return (
    <>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className="w">
            {Array.from(word).map((ch, ci) => (
              <span key={ci} className="ch" style={{ '--i': index++ } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

interface PolaroidProps {
  memory: Memory;
}

const Polaroid = forwardRef<HTMLElement, PolaroidProps>(function Polaroid({ memory }, ref) {
  return (
    <figure ref={ref} className="polaroid">
      <span className="tape" aria-hidden="true" />
      <div className="photo">
        <img src={memory.image} alt="" draggable={false} decoding="async" />
        <span className="shine" aria-hidden="true" />
      </div>
      <figcaption>
        <span className="cap" style={{ '--n': memory.caption.length } as CSSProperties}>
          <Handwriting text={memory.caption} />
        </span>
        {memory.date ? <span className="date">{memory.date}</span> : null}
      </figcaption>
      <span className="sparks" aria-hidden="true">
        {SPARKS.map((sp, k) => (
          <i key={k} style={{ '--a': `${sp.a}deg`, '--d': sp.d, '--sz': sp.sz } as CSSProperties}>
            {sp.glyph}
          </i>
        ))}
      </span>
    </figure>
  );
});

const setVars = (fig: HTMLElement, dev: number, cap: number, shine: number, burst: number): void => {
  fig.style.setProperty('--dev', dev.toFixed(3));
  fig.style.setProperty('--cap', cap.toFixed(3));
  fig.style.setProperty('--shine', shine.toFixed(3));
  fig.style.setProperty('--burst', burst.toFixed(3));
  fig.classList.toggle('dev-done', dev > 0.995);
};

/**
 * Two moments: a few photographs drop onto the letter and lift away, then the
 * rest float toward you through real 3D space (CSS 3D transforms), one at a
 * time. Every position and effect is a pure function of scroll, so it all
 * plays in reverse when you scroll back up; only the pendulum swing, drifting
 * motes and idle bob keep moving on their own (decoration, never progress).
 */
export function MemoryStory() {
  const plane = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bridgeStage = useRef<HTMLDivElement>(null);
  const atmos = useRef<HTMLDivElement>(null);
  const tint = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const items = useRef<Array<HTMLElement | null>>([]);
  const figs = useRef<Array<HTMLElement | null>>([]);
  const bridge = useRef<Array<HTMLElement | null>>([]);
  const bridgeFigs = useRef<Array<HTMLElement | null>>([]);
  const motes = useRef<Array<HTMLElement | null>>([]);
  const springs = useRef<Spring[]>(MEMORIES.map(() => ({ a: 0, w: 0 })));
  const bridgeSprings = useRef<Spring[]>(BRIDGE.map(() => ({ a: 0, w: 0 })));
  const lastUnit = useRef(0);
  const size = useRef({ w: 1000, h: 700 });

  useEffect(() => {
    const update = (): void => {
      size.current = { w: window.innerWidth, h: window.innerHeight };
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useStoryFrame((s, dt) => {
    const u = s.unit;
    const { w, h } = size.current;
    const compact = w < 700;
    const fx = s.reduced ? 0 : 1;

    // How hard, and which way, the reader is scrolling right now: the photos swing on it.
    const du = u - lastUnit.current;
    lastUnit.current = u;
    const push = dt > 0 ? clamp(du / (dt * 240), -1.5, 1.5) : 0;

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

        const fig = bridgeFigs.current[k];
        if (fig) {
          // Each one "develops" as it lands and gives a little shimmer, then swings from the drop.
          setVars(fig, smoothstep(0.2, 0.85, t), 1, invLerp(0.45, 1, t), fx * invLerp(0.72, 1, t) * (1 - lift));
          const dir = k % 2 ? 1 : -1;
          const angle = stepSpring(bridgeSprings.current[k], fx * (push * 60 + (1 - t) * 50) * dir, 0, dt);
          fig.style.transform = fx ? `rotate(${angle.toFixed(2)}deg)` : '';
        }
      });
    }

    // ── The floating memories ────────────────────────────────────────────────
    const on = u > at('memories', 0.02) && u < at('love', 0.03);
    if (stage.current) stage.current.style.display = on ? '' : 'none';
    if (!on) return;

    const f = invLerp(at('memories'), at('memories', 1), u);
    const cam = cameraAt(f);
    const t = performance.now() / 1000;
    if (plane.current) {
      const calm = s.reduced ? 0 : 1;
      plane.current.style.transform = `rotateY(${(pointer.sx * 2.6 * calm).toFixed(2)}deg) rotateX(${(-pointer.sy * 1.6 * calm + s.velocity * 2.5 * calm).toFixed(2)}deg)`;
    }

    // ── Atmosphere: a tint that follows the photo in focus, drifting motes, a soft shutter flash ──
    const ambient = smoothstep(at('memories', 0.02), at('memories', 0.14), u) * (1 - smoothstep(at('memories', 0.94), at('love', 0.03), u));
    if (atmos.current) atmos.current.style.opacity = ambient.toFixed(3);
    if (tint.current) {
      const pos = clamp((cam - (FIRST - READ)) / SPACING, 0, COUNT - 1);
      const i0 = Math.floor(pos);
      const k = smoothstep(0, 1, pos - i0);
      const a0 = TINTS[i0 % TINTS.length];
      const a1 = TINTS[(i0 + 1) % TINTS.length];
      const rgb = a0.map((v, n) => Math.round(v + (a1[n] - v) * k));
      tint.current.style.setProperty('--tint', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`);
    }
    MOTES.forEach((m, i) => {
      const el = motes.current[i];
      if (!el) return;
      const y = (((m.y - u * 0.0009 * m.d - t * 0.005 * m.d * fx) % 1) + 1) % 1;
      const x = m.x * w + Math.sin(t * 0.4 + m.ph) * 14 * m.d * fx - pointer.sx * 26 * m.d * fx;
      const edge = Math.sin(Math.PI * y);
      const base = m.kind === 'bokeh' ? 0.1 + 0.24 * (1 - m.d) : 0.7 * (0.4 + 0.6 * m.d);
      const twinkle = m.kind === 'bokeh' ? 1 : 0.75 + 0.25 * Math.sin(t * 2.2 + m.ph * 3) * fx;
      el.style.opacity = (edge * base * twinkle).toFixed(3);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y * h).toFixed(1)}px, 0) scale(${(0.7 + 0.5 * m.d).toFixed(2)})`;
    });

    let flashPeak = 0;
    MEMORIES.forEach((_, i) => {
      const el = items.current[i];
      if (!el) return;
      const rel = depth(i) - cam;
      // Visible from further away than before, so the next photo is always emerging from the haze.
      const a = smoothstep(3300, 1800, rel) * smoothstep(120, 400, rel);
      el.style.visibility = a < 0.005 ? 'hidden' : 'visible';
      if (a < 0.005) return;

      const p = smoothstep(2400, 450, rel); // 0 far away → 1 in reading position
      const q = smoothstep(400, 130, rel); // 0 → 1 as it sweeps past the camera
      const e = (1 - p) * (1 - p) * fx;
      const ex = q * q * fx;
      const lay = LAYOUT[i % LAYOUT.length];
      const side = lay.x < 0 ? -1 : 1;
      const spread = compact ? 0.5 : 1;
      const bob = s.reduced ? 0 : Math.sin(t * 0.7 + i * 1.9) * 7;
      const blur = compact || s.reduced ? 0 : Math.max(0, Math.min(5, (rel - 1100) / 450));
      const par = (1 - clamp(rel / 3300)) * 26 * fx;

      // A different arrival for each photo.
      let ox = 0;
      let oy = 0;
      let rz = 0;
      let ry = 0;
      let rx = 0;
      let sc = 1;
      switch (ENTRANCES[i % ENTRANCES.length]) {
        case 'left':
          ox = -0.55 * w * e;
          rz = -26 * e;
          ry = 52 * e;
          break;
        case 'right':
          ox = 0.55 * w * e;
          rz = 26 * e;
          ry = -52 * e;
          break;
        case 'drop':
          oy = -0.65 * h * e;
          rz = side * 16 * e;
          rx = -26 * e;
          break;
        case 'rise':
          oy = 0.65 * h * e;
          rz = -side * 12 * e;
          rx = 26 * e;
          break;
        case 'spin':
          rz = side * 190 * e;
          sc = 1 - 0.3 * e;
          break;
        default:
          ry = side * 96 * e;
          oy = 0.08 * h * e;
      }
      // …and it sweeps off toward its own side instead of just fading out.
      ox += side * ex * w * 0.45;
      rz += side * ex * 14;
      ry += side * ex * 38;
      oy -= ex * h * 0.08;
      // A small pop as it settles into focus.
      sc *= 1 + 0.05 * smoothstep(0.9, 1, p) * (1 - q) * fx;
      ox += pointer.sx * par;
      oy -= pointer.sy * par * 0.6;

      el.style.opacity = a.toFixed(3);
      el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : '';
      el.style.transform = `translate3d(calc(-50% + ${(lay.x * w * spread + ox).toFixed(1)}px), calc(-50% + ${(lay.y * h + bob + oy).toFixed(1)}px), ${(-rel).toFixed(1)}px) rotateZ(${(lay.r + rz).toFixed(2)}deg) rotateY(${(lay.ry * Math.min(1, rel / 900) + ry).toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      el.style.setProperty('--glow', (smoothstep(950, 450, rel) * (1 - q) * fx).toFixed(3));

      const fig = figs.current[i];
      if (fig) {
        // The photo "develops" from a dark, sepia blur, a glint sweeps across it, the caption writes itself in,
        // and a burst of sparks and hearts goes off as it lands.
        setVars(fig, s.reduced ? 1 : smoothstep(1700, 700, rel), s.reduced ? 1 : smoothstep(1050, 480, rel), invLerp(1300, 450, rel), fx * invLerp(640, 300, rel) * (1 - q));
        const dir = i % 2 ? 1 : -1;
        const angle = stepSpring(springs.current[i], fx * push * 70 * dir, pointer.sx * 1.8 * fx, dt);
        fig.style.transform = fx ? `rotate(${angle.toFixed(2)}deg)` : '';
      }
      flashPeak = Math.max(flashPeak, bump(invLerp(640, 400, rel)) * (1 - q));
    });
    if (flash.current) flash.current.style.opacity = (flashPeak * 0.14 * fx).toFixed(3);
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
            <Polaroid
              memory={MEMORIES[k % COUNT]}
              ref={(fig) => {
                bridgeFigs.current[k] = fig;
              }}
            />
          </div>
        ))}
      </div>

      <div ref={stage} className="layer perspective-layer" style={{ display: 'none' }} aria-hidden="true">
        <div ref={atmos} className="memory-atmos">
          <div ref={tint} className="mem-tint" />
          {MOTES.map((m, i) => (
            <i
              key={i}
              className={`mote ${m.kind}`}
              ref={(el) => {
                motes.current[i] = el;
              }}
              style={m.kind === 'bokeh' ? { width: m.size * 2, height: m.size * 2, margin: -m.size } : { fontSize: m.size * 0.6 }}
            >
              {m.kind === 'heart' ? '♥' : m.kind === 'spark' ? '✦' : null}
            </i>
          ))}
        </div>
        <div ref={plane} className="memory-plane">
          {MEMORIES.map((memory, i) => (
            <div
              key={memory.image}
              className="memory-item"
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <span className="mem-glow" aria-hidden="true" />
              <Polaroid
                memory={memory}
                ref={(fig) => {
                  figs.current[i] = fig;
                }}
              />
            </div>
          ))}
        </div>
        <div ref={flash} className="mem-flash" />
      </div>
    </>
  );
}
