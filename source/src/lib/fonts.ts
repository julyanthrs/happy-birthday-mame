/** Resolves once the web fonts the canvas drawings depend on are actually usable. */
const SPECS = [
  '500 100px "Cormorant Garamond"',
  '400 italic 60px "Cormorant Garamond"',
  '400 60px "Reenie Beanie"',
  '400 60px "La Belle Aurore"',
  '400 30px "DM Sans"',
];

let ready: Promise<void> | undefined;

export const whenFontsReady = (): Promise<void> => {
  if (!ready) {
    ready = Promise.all(SPECS.map((s) => document.fonts.load(s).catch(() => []))).then(() => document.fonts.ready).then(() => undefined);
  }
  return ready;
};
