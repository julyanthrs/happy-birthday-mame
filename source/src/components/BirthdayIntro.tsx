import { Caption } from '@/components/Caption';
import { MusicCta } from '@/components/MusicPlayer';
import { at } from '@/config/chapters';
import { birthdayContent as c } from '@/data/birthdayContent';

/** First screen: a whisper of text in the dark, a scroll hint, and the option of music. */
export function BirthdayIntro() {
  return (
    <>
      <Caption window={[-10, -5, at('arrival', 0.4), at('arrival', 0.78)]} className="cap-center cap-intro" rise={10} blur={6}>
        <p className="intro-line arrive">{c.introMessage}</p>
      </Caption>
      <Caption window={[-10, -5, 22, 80]} className="cap-bottom cap-hint" interactive rise={8}>
        <div className="hint arrive-late">
          <span className="hint-label">{c.scrollHint}</span>
          <span className="hint-line" aria-hidden="true" />
          <MusicCta />
        </div>
      </Caption>
    </>
  );
}
