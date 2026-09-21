import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { mulberry32 } from '@/lib/math';

const make = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d') as CanvasRenderingContext2D, w, h);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

let glow: CanvasTexture | undefined;
/** Soft round glow, white. Tint it with the material colour. */
export const getGlowTexture = (): CanvasTexture =>
  (glow ??= make(128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.08, 'rgba(255,255,255,0.62)');
    grd.addColorStop(0.22, 'rgba(255,255,255,0.24)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.07)');
    grd.addColorStop(0.72, 'rgba(255,255,255,0.015)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }));

let star: CanvasTexture | undefined;
/** Four-point glint, white. */
export const getStarTexture = (): CanvasTexture =>
  (star ??= make(128, 128, (g, w, h) => {
    const c = w / 2;
    g.translate(c, c);
    const spike = (len: number, thick: number) => {
      const grd = g.createLinearGradient(-len, 0, len, 0);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.5, 'rgba(255,255,255,1)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(-len, 0);
      g.quadraticCurveTo(0, -thick, len, 0);
      g.quadraticCurveTo(0, thick, -len, 0);
      g.fill();
    };
    spike(c, 5);
    g.rotate(Math.PI / 2);
    spike(c, 5);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const halo = g.createRadialGradient(c, c, 0, c, c, c * 0.35);
    halo.addColorStop(0, 'rgba(255,255,255,0.9)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = halo;
    g.fillRect(0, 0, w, h);
  }));

let paper: CanvasTexture | undefined;
/** Seamless warm paper with fibres and specks. */
export const getPaperTexture = (): CanvasTexture => {
  if (paper) return paper;
  paper = make(512, 512, (g, w, h) => {
    const rand = mulberry32(5);
    g.fillStyle = '#f5ead6';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const a = 0.02 + rand() * 0.05;
      g.fillStyle = rand() > 0.5 ? `rgba(120,80,40,${a})` : `rgba(255,255,255,${a * 1.6})`;
      g.fillRect(x, y, 1 + rand() * 1.4, 1 + rand() * 1.4);
    }
    g.lineWidth = 0.6;
    for (let i = 0; i < 420; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const len = 6 + rand() * 18;
      const ang = rand() * Math.PI * 2;
      g.strokeStyle = `rgba(150,110,70,${0.03 + rand() * 0.05})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.stroke();
    }
  });
  paper.wrapS = paper.wrapT = RepeatWrapping;
  return paper;
};

let candle: CanvasTexture | undefined;
/** Gentle diagonal stripes for the candle bodies. */
export const getCandleTexture = (): CanvasTexture => {
  if (candle) return candle;
  candle = make(64, 128, (g, w, h) => {
    g.fillStyle = '#fbf1e4';
    g.fillRect(0, 0, w, h);
    g.lineWidth = 9;
    g.strokeStyle = '#e9a9b8';
    for (let i = -h; i < h * 2; i += 26) {
      g.beginPath();
      g.moveTo(-10, i);
      g.lineTo(w + 10, i + w + 20);
      g.stroke();
    }
    g.lineWidth = 2.5;
    g.strokeStyle = '#d9b46a';
    for (let i = -h + 13; i < h * 2; i += 26) {
      g.beginPath();
      g.moveTo(-10, i);
      g.lineTo(w + 10, i + w + 20);
      g.stroke();
    }
  });
  candle.wrapS = candle.wrapT = RepeatWrapping;
  return candle;
};
