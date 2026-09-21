import { birthdayContent as c } from '@/data/birthdayContent';

const plain = (s: string): string => s.replace(/\*/g, '');

/**
 * The whole experience as plain, linear text for screen readers (and anyone
 * whose browser can't run the animation). The animated copies on screen are
 * aria-hidden, so nothing is announced twice.
 */
export function Transcript() {
  return (
    <div className="sr-only">
      <h1>A birthday letter for {c.momName}</h1>
      <p>{c.introMessage}</p>
      <p>
        {c.wishIntro} {plain(c.wishMessage)} {c.blowMessage} {c.afterBlowMessage}
      </p>
      <section aria-label="The letter">
        <h2>{c.letterGreeting}</h2>
        {c.letterParagraphs.map((p) => (
          <p key={p}>{plain(p)}</p>
        ))}
        <p>{c.letterBridge}</p>
      </section>
      <section aria-label="Memories">
        <h2>Memories</h2>
        <ul>
          {c.memories.map((m) => (
            <li key={m.image}>
              {m.alt}. {m.caption} {m.date}
            </li>
          ))}
        </ul>
      </section>
      <section aria-label={c.thingsILove.heading}>
        <h2>{c.thingsILove.heading}</h2>
        <ul>
          {c.thingsILove.items.map((i) => (
            <li key={i.title}>
              {i.title}. {i.description}
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Happy birthday">
        <h2>
          {c.finale.headlineTop} {c.finale.headlineName}
        </h2>
        <p>{c.galaxyMessage}</p>
        <p>{c.finalMessage}</p>
        <p>{c.loveNote}</p>
        <p>
          {c.signOff} {c.sender}
        </p>
        <p>{c.postScript}</p>
      </section>
    </div>
  );
}
