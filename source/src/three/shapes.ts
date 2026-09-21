import { ExtrudeGeometry, PlaneGeometry, Shape, type BufferGeometry } from 'three';

const heartShape = (): Shape => {
  const s = new Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.55, 0.2);
  s.bezierCurveTo(-0.55, 0.5, -0.2, 0.62, 0, 0.4);
  s.bezierCurveTo(0.2, 0.62, 0.55, 0.5, 0.55, 0.2);
  s.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5);
  return s;
};

/** A plump little extruded heart, roughly 1 unit wide, centred on the origin. */
export const createHeartGeometry = (depth = 0.22): BufferGeometry => {
  const g = new ExtrudeGeometry(heartShape(), { depth, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 4, curveSegments: 22 });
  g.center();
  return g;
};

/** A slim four-point star. */
export const createStarGeometry = (depth = 0.14): BufferGeometry => {
  const s = new Shape();
  const outer = 0.62;
  const inner = 0.14;
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
  g.center();
  return g;
};

/** A cupped, teardrop-shaped petal lying in the XY plane, tip toward +Y. */
export const createPetalGeometry = (): BufferGeometry => {
  const g = new PlaneGeometry(0.34, 0.5, 5, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const u = y / 0.5 + 0.5;
    const width = Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0, u)), 0.72)), 0.75) * 1.35;
    const nx = x * width;
    p.setXYZ(i, nx, y, 1.9 * nx * nx + 0.09 * Math.sin(u * Math.PI) + 0.12 * u * u * u);
  }
  g.computeVertexNormals();
  return g;
};
