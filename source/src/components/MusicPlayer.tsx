import { useSyncExternalStore } from 'react';
import { getMusicState, playMusic, subscribeMusic, toggleMusic } from '@/audio/musicController';
import { birthdayContent } from '@/data/birthdayContent';
import { useMagnetic } from '@/hooks/useMagnetic';

const useMusic = () => useSyncExternalStore(subscribeMusic, getMusicState);

/** Small, persistent music control in the corner. Never plays on its own. */
export function MusicPlayer() {
  const music = useMusic();
  const ref = useMagnetic<HTMLButtonElement>();
  const label = music.failed ? 'Music unavailable' : music.playing ? 'Pause music' : 'Play music';
  return (
    <button ref={ref} type="button" className="music-btn" onClick={toggleMusic} aria-pressed={music.playing} aria-label={label} disabled={music.failed}>
      <span className={`eq ${music.playing ? 'is-on' : ''}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="music-label">{music.playing ? 'Music on' : 'Music'}</span>
    </button>
  );
}

/** The gentle invitation on the first screen. */
export function MusicCta() {
  const music = useMusic();
  const ref = useMagnetic<HTMLButtonElement>();
  if (music.playing || music.failed) return null;
  return (
    <button ref={ref} type="button" className="cta-link" onClick={() => void playMusic()}>
      {birthdayContent.musicCta}
    </button>
  );
}
