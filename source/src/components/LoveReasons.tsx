import { Caption } from '@/components/Caption';
import { at } from '@/config/chapters';
import { birthdayContent as c } from '@/data/birthdayContent';
import { loveFocusFraction } from '@/config/world';
import { win } from '@/story/windows';

/** The heading and the one-line explanation under each glowing phrase. */
export function LoveReasons() {
  return (
    <>
      <Caption window={[at('memories', 0.9), at('love', 0.015), at('love', 0.05), at('love', 0.085)]} className="cap-center cap-love-heading" rise={14} blur={8}>
        <h2 className="display-xl glow">{c.thingsILove.heading}</h2>
      </Caption>
      {c.thingsILove.items.map((item, i) => {
        const f = loveFocusFraction(i);
        return (
          <Caption key={item.title} window={win('love', f - 0.058, f - 0.022, f + 0.024, f + 0.05)} className="cap-bottom cap-love" rise={12} blur={3}>
            <div className="love-note">
              <span className="love-rule" aria-hidden="true" />
              <p>{item.description}</p>
            </div>
          </Caption>
        );
      })}
    </>
  );
}
