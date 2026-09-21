import { Caption } from '@/components/Caption';
import { birthdayContent as c } from '@/data/birthdayContent';
import { win } from '@/story/windows';

/** Short lines that belong to a single moment: the envelope hint and the galaxy line. */
export function ChapterCaptions() {
  return (
    <>
      <Caption window={win('envelope', 0.04, 0.16, 0.34, 0.46)} className="cap-bottom cap-ink" rise={10} blur={4}>
        <p className="display-md ink">{c.envelope.hint}</p>
      </Caption>
      <Caption window={win('galaxy', 0.12, 0.24, 0.5, 0.64)} className="cap-bottom cap-wish" rise={12} blur={6}>
        <p className="display-md glow">{c.galaxyMessage}</p>
      </Caption>
    </>
  );
}
