import { Caption } from '@/components/Caption';
import { at } from '@/config/chapters';
import { birthdayContent as c } from '@/data/birthdayContent';
import { win } from '@/story/windows';

/** The pause before the candles go out: a quiet sequence of short lines. */
export function WishScene() {
  return (
    <>
      <Caption window={win('wish', 0.02, 0.13, 0.26, 0.36)} className="cap-bottom cap-wish-small" rise={10} blur={4}>
        <p className="eyebrow">{c.wishIntro}</p>
      </Caption>
      <Caption window={win('wish', 0.3, 0.44, 0.84, 0.94)} className="cap-bottom cap-wish" rise={14} blur={8}>
        <p className="display-lg glow">{c.wishMessage}</p>
      </Caption>
      <Caption window={[at('wish', 0.9), at('wish', 0.98), at('blow', 0.04), at('blow', 0.13)]} className="cap-bottom cap-wish" rise={10}>
        <p className="display-md">{c.readyMessage}</p>
      </Caption>
      <Caption window={win('blow', 0.12, 0.2, 0.34, 0.44)} className="cap-bottom cap-wish" rise={10} blur={4}>
        <p className="display-lg glow">{c.blowMessage}</p>
      </Caption>
      <Caption window={win('blow', 0.8, 0.92, 1.25, 1.55)} className="cap-bottom cap-wish" rise={10} blur={4}>
        <p className="display-md">{c.afterBlowMessage}</p>
      </Caption>
    </>
  );
}
