import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { at } from '@/config/chapters';
import { birthdayContent as c } from '@/data/birthdayContent';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { invLerp, smoothstep } from '@/lib/math';

type Mode = 'ink' | 'rise' | 'word' | 'blur' | 'soft' | 'mask' | 'fade';
/** Each paragraph arrives in its own way, so a long letter never feels mechanical. */
const MODES: Mode[] = ['ink', 'rise', 'word', 'blur', 'soft', 'mask', 'fade'];

interface Segment {
  text: string;
  mark: boolean;
}

/** "plain *underlined* plain" → segments. */
const parse = (source: string): Segment[] =>
  source
    .split('*')
    .map((text, i) => ({ text, mark: i % 2 === 1 }))
    .filter((seg) => seg.text.length > 0);

const START = 0.06;
const STEP = 0.125;
const DURATION = 0.11;
const paragraphStart = (i: number): number => START + i * STEP;

function Underline({ children }: { children: ReactNode }) {
  return (
    <span className="mark">
      <span className="mark-text">{children}</span>
      <svg className="mark-svg" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 6 C 18 2, 34 9, 52 5 S 88 8, 104 4 S 116 5, 118 4" pathLength="1" />
      </svg>
    </span>
  );
}

interface ParagraphProps {
  text: string;
  mode: Mode;
  paragraphRef: (el: HTMLParagraphElement | null) => void;
}

function Paragraph({ text, mode, paragraphRef }: ParagraphProps) {
  const segments = parse(text);
  let wordIndex = 0;
  const wordCount = text.replace(/\*/g, '').split(/\s+/).length;
  const style = { '--n': wordCount + 3 } as CSSProperties;

  return (
    <p ref={paragraphRef} className={`letter-p m-${mode}`} style={style}>
      {segments.map((seg, si) => {
        const inner: ReactNode =
          mode === 'word'
            ? seg.text.split(/(\s+)/).map((token, ti) =>
                /^\s+$/.test(token) ? (
                  token
                ) : (
                  <span key={ti} className="w" style={{ '--i': wordIndex++ } as CSSProperties}>
                    {token}
                  </span>
                ),
              )
            : seg.text;
        return seg.mark ? <Underline key={si}>{inner}</Underline> : <Fragment key={si}>{inner}</Fragment>;
      })}
    </p>
  );
}

/**
 * The letter text, laid over the 3D paper. Paragraphs reveal one after another
 * as you scroll; when the letter is taller than the screen the column glides
 * upward so the newest line is always in view.
 */
export function BirthdayLetter() {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const greeting = useRef<HTMLHeadingElement>(null);
  const paragraphs = useRef<Array<HTMLParagraphElement | null>>([]);
  const overflow = useRef(0);

  useEffect(() => {
    const measure = (): void => {
      if (!frame.current || !block.current) return;
      overflow.current = Math.max(0, block.current.offsetHeight - frame.current.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (block.current) ro.observe(block.current);
    if (frame.current) ro.observe(frame.current);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  useStoryFrame((s) => {
    const el = root.current;
    if (!el) return;
    const alpha = s.paper;
    el.style.opacity = alpha.toFixed(3);
    el.style.visibility = alpha < 0.004 ? 'hidden' : 'visible';
    if (alpha < 0.004) return;

    const f = invLerp(at('letter'), at('letter', 1), s.unit);
    greeting.current?.style.setProperty('--r', smoothstep(0, 0.05, f).toFixed(3));
    paragraphs.current.forEach((p, i) => {
      if (!p) return;
      const r = smoothstep(paragraphStart(i), paragraphStart(i) + DURATION, f);
      p.style.setProperty('--r', r.toFixed(3));
      p.style.setProperty('--u', smoothstep(paragraphStart(i) + 0.05, paragraphStart(i) + DURATION + 0.03, f).toFixed(3));
    });
    if (block.current) {
      const follow = smoothstep(0.08, 0.95, f);
      block.current.style.transform = `translate3d(0, ${(-overflow.current * follow).toFixed(1)}px, 0)`;
    }
  });

  return (
    <div ref={root} className="layer letter-layer" style={{ opacity: 0, visibility: 'hidden' }} aria-hidden="true">
      <div ref={frame} className="letter-frame">
        <div ref={block} className="letter-block">
          <h2 ref={greeting} className="letter-greeting">
            {c.letterGreeting}
          </h2>
          {c.letterParagraphs.map((text, i) => (
            <Paragraph
              key={i}
              text={text}
              mode={MODES[i % MODES.length]}
              paragraphRef={(p) => {
                paragraphs.current[i] = p;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

