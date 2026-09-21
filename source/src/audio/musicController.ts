import { birthdayContent } from '@/data/birthdayContent';

/**
 * Background music. Never autoplays (browsers block it, and it would be rude):
 * the reader starts it, it fades in gently, and it can be paused from anywhere.
 */
export interface MusicState {
  playing: boolean;
  /** True if the file could not be loaded or played. */
  failed: boolean;
}

let audio: HTMLAudioElement | null = null;
let state: MusicState = { playing: false, failed: false };
let fadeFrame = 0;
const listeners = new Set<() => void>();

const set = (next: MusicState): void => {
  state = next;
  listeners.forEach((fn) => fn());
};

const ensure = (): HTMLAudioElement => {
  if (audio) return audio;
  audio = new Audio(birthdayContent.settings.musicSrc);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  audio.addEventListener('error', () => set({ playing: false, failed: true }));
  return audio;
};

const fadeTo = (target: number, ms: number, done?: () => void): void => {
  cancelAnimationFrame(fadeFrame);
  const a = ensure();
  const from = a.volume;
  const start = performance.now();
  const step = (now: number): void => {
    const k = Math.min(1, (now - start) / ms);
    a.volume = from + (target - from) * (k * k * (3 - 2 * k));
    if (k < 1) fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
};

export const playMusic = async (): Promise<void> => {
  const a = ensure();
  try {
    await a.play();
    set({ playing: true, failed: false });
    fadeTo(birthdayContent.settings.musicVolume, 2800);
  } catch {
    set({ playing: false, failed: true });
  }
};

export const pauseMusic = (): void => {
  set({ ...state, playing: false });
  fadeTo(0, 700, () => audio?.pause());
};

export const toggleMusic = (): void => {
  if (state.playing) pauseMusic();
  else void playMusic();
};

export const subscribeMusic = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const getMusicState = (): MusicState => state;

if (typeof document !== 'undefined') {
  // Don't keep playing to an empty room.
  document.addEventListener('visibilitychange', () => {
    if (!audio || !state.playing) return;
    if (document.hidden) audio.pause();
    else void audio.play().catch(() => undefined);
  });
}
