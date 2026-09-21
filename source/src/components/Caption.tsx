import { useRef, type ElementType, type ReactNode } from 'react';
import { useStoryFrame } from '@/hooks/useStoryFrame';
import { trap, type Window4 } from '@/story/windows';

interface Props {
  window: Window4;
  children: ReactNode;
  className?: string;
  /** Pixels the text drifts up as it appears. */
  rise?: number;
  /** Pixels of blur it resolves from. */
  blur?: number;
  /** Lets clicks through only while visible enough to use. */
  interactive?: boolean;
  as?: ElementType;
}

/**
 * Text that fades with the scroll position. Updates the DOM directly each
 * frame (no React re-render), and hides itself from assistive tech and
 * pointer events whenever it is invisible. The full text is always available
 * in the screen-reader transcript, so these visual copies are aria-hidden.
 */
export function Caption({ window: win, children, className = '', rise = 16, blur = 0, interactive = false, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const last = useRef(-1);

  useStoryFrame((s) => {
    const el = ref.current;
    if (!el) return;
    const a = trap(s.unit, win);
    if (a === last.current) return;
    last.current = a;
    const r = s.reduced ? 0 : rise;
    const b = s.reduced ? 0 : blur;
    el.style.opacity = a.toFixed(3);
    el.style.visibility = a < 0.004 ? 'hidden' : 'visible';
    el.style.transform = `translate3d(0, ${((1 - a) * r).toFixed(1)}px, 0)`;
    el.style.filter = b && a < 0.999 ? `blur(${((1 - a) * b).toFixed(1)}px)` : '';
    if (interactive) el.style.pointerEvents = a > 0.6 ? 'auto' : 'none';
  });

  return (
    <Tag ref={ref} className={className} style={{ opacity: 0, visibility: 'hidden' }} aria-hidden={interactive ? undefined : true}>
      {children}
    </Tag>
  );
}
