/** A soft "lub-dub" heartbeat, 0–1, repeating every 1.3 seconds. */
export const heartbeat = (seconds: number): number => {
  const ph = (seconds % 1.3) / 1.3;
  const g = (c: number, w: number) => Math.exp(-Math.pow((ph - c) / w, 2));
  return g(0.04, 0.05) + 0.65 * g(0.24, 0.06);
};
