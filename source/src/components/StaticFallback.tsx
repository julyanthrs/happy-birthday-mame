import { birthdayContent as c } from '@/data/birthdayContent';

const plain = (s: string): string => s.replace(/\*/g, '');

/** Shown only if the browser cannot run WebGL: the same words, without the animation. */
export function StaticFallback() {
  return (
    <main className="fallback">
      <article>
        <p className="eyebrow">{c.introMessage}</p>
        <h1>{c.letterGreeting}</h1>
        {c.letterParagraphs.map((p) => (
          <p key={p}>{plain(p)}</p>
        ))}
        <h2>{c.thingsILove.heading}</h2>
        <ul>
          {c.thingsILove.items.map((i) => (
            <li key={i.title}>
              <strong>{i.title}.</strong> {i.description}
            </li>
          ))}
        </ul>
        <p className="fallback-end">{c.finalMessage}</p>
        <p>{c.loveNote}</p>
        <p className="fallback-sign">
          {c.signOff} {c.sender}
        </p>
        <p>{c.postScript}</p>
      </article>
    </main>
  );
}
