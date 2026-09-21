import { Caption } from '@/components/Caption';
import { at } from '@/config/chapters';
import { birthdayContent as c } from '@/data/birthdayContent';
import { win } from '@/story/windows';

/** Words that sit under the particle text: the thank-you, then the love note. */
export function BirthdayFinale() {
  return (
    <>
      <Caption window={win('finale', 0.47, 0.55, 0.73, 0.8)} className="cap-bottom cap-finale" rise={14} blur={6}>
        <p className="display-md glow">{c.finalMessage}</p>
      </Caption>
      <Caption window={[at('finale', 0.79), at('finale', 0.87), at('finale', 0.97), at('finalCake', 0.16)]} className="cap-center cap-love-note" rise={12} blur={6}>
        <p className="display-lg glow">{c.loveNote}</p>
      </Caption>
    </>
  );
}
