/**
 * Monotone cubic (PCHIP) interpolation through keyframes.
 * Smooth, never overshoots, and holds still where neighbouring keys share a
 * value — which is exactly what a camera "dwelling" on something needs.
 */
export type Keys = ReadonlyArray<readonly [number, number]>;

export const curve = (keys: Keys): ((x: number) => number) => {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  for (let i = 1; i < n; i++) xs[i] = Math.max(xs[i], xs[i - 1] + 1e-3);

  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] > 0) {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }

  let last = 0;
  return (x: number): number => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = last;
    if (x < xs[lo] || x >= xs[lo + 1]) {
      lo = 0;
      let hi = n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (xs[mid] <= x) lo = mid;
        else hi = mid;
      }
      last = lo;
    }
    const t = (x - xs[lo]) / h[lo];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * h[lo] * m[lo] +
      (-2 * t3 + 3 * t2) * ys[lo + 1] +
      (t3 - t2) * h[lo] * m[lo + 1]
    );
  };
};
