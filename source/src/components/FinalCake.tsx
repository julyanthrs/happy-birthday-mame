import { Caption } from '@/components/Caption';
import { birthdayContent as c } from '@/data/birthdayContent';
import { scrollToStart } from '@/story/scroll';
import { useMagnetic } from '@/hooks/useMagnetic';
import { winFrom } from '@/story/windows';

/** The last frame: the sign-off, the postscript and a way back to the beginning. */
export function FinalCake() {
  const ref = useMagnetic<HTMLButtonElement>();
  return (
    <>
      <Caption window={winFrom('finalCake', 0.3, 0.5)} className="cap-bottom cap-sign" rise={10} blur={4}>
        <p className="sign-off">
          <span className="font-hand">{c.signOff}</span> <span className="font-sign">{c.sender}</span>
        </p>
      </Caption>
      <Caption window={winFrom('finalCake', 0.6, 0.8)} className="cap-bottom cap-ps" rise={8} blur={3}>
        <p className="ps">{c.postScript}</p>
      </Caption>
      <Caption window={winFrom('outro', 0.15, 0.55)} className="cap-bottom cap-replay" interactive rise={6}>
        <button ref={ref} type="button" className="btn-gold" onClick={scrollToStart}>
          {c.replayLabel}
        </button>
      </Caption>
    </>
  );
}
