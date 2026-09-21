import { mulberry32 } from '@/lib/math';

export interface SampledText {
  /** Interleaved x,y in canvas pixels, centred on the text's bounding box (y up). */
  points: Float32Array;
  /** Bounding box width in pixels. */
  width: number;
  height: number;
}

export interface TextStyle {
  font: string;
  size: number;
  letterSpacing?: number;
}

/**
 * Renders text to an offscreen canvas and returns `count` random points that
 * lie on the glyphs — the target positions for the particles that spell it.
 */
export const sampleTextPoints = (text: string, style: TextStyle, count: number, seed: number): SampledText => {
  const pad = style.size * 0.6;
  const probe = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  probe.font = `${style.font.replace('%s', String(style.size))}`;
  probe.letterSpacing = `${style.letterSpacing ?? 0}px`;
  const measured = Math.ceil(probe.measureText(text).width);
  const w = measured + pad * 2;
  const h = Math.ceil(style.size * 1.6);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
  g.font = `${style.font.replace('%s', String(style.size))}`;
  g.letterSpacing = `${style.letterSpacing ?? 0}px`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineWidth = Math.max(2, style.size * 0.03);
  g.strokeText(text, pad, h / 2);
  g.fillText(text, pad, h / 2);

  const data = g.getImageData(0, 0, w, h).data;
  const xs: number[] = [];
  const ys: number[] = [];
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 140) {
        xs.push(x);
        ys.push(y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const rand = mulberry32(seed);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const points = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rand() * xs.length);
    points[i * 2] = xs[k] - cx + (rand() - 0.5) * 2;
    points[i * 2 + 1] = -(ys[k] - cy) + (rand() - 0.5) * 2;
  }
  return { points, width: maxX - minX, height: maxY - minY };
};

/** Draws a glowing single-line title into a canvas and returns it with its aspect ratio. */
export const drawGlowText = (
  text: string,
  style: TextStyle,
  colors: { fill: string; glow: string },
): { canvas: HTMLCanvasElement; aspect: number } => {
  const font = style.font.replace('%s', String(style.size));
  const probe = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  probe.font = font;
  probe.letterSpacing = `${style.letterSpacing ?? 0}px`;
  const measured = Math.ceil(probe.measureText(text).width);
  const padX = style.size * 0.7;
  const w = measured + padX * 2;
  const h = Math.ceil(style.size * 2.1);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.font = font;
  g.letterSpacing = `${style.letterSpacing ?? 0}px`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.shadowColor = colors.glow;
  g.shadowBlur = style.size * 0.35;
  g.fillStyle = colors.glow;
  g.fillText(text, padX, h / 2);
  g.shadowBlur = style.size * 0.12;
  g.fillStyle = colors.fill;
  g.fillText(text, padX, h / 2);
  return { canvas, aspect: w / h };
};
