// Tsumu — the spindle.
//
// Nested arcs bowed out to either side of a line between two centres, building
// the pointed lens that gives the stitch its name. Worked along the marking
// lines of a division it produces the interlocking leaf-shaped bands that
// cover so many of the balls in the reference photographs.

import { sampleArc } from '../core/arrangement.js';
import { cross, length, normalize, slerp, tangentDirection } from '../core/vec.js';
import { travel } from './helpers.js';

export const tsumuDefaults = {
  edges: null,      // null = every marking line in the division
  rows: 4,
  bulge: 0.16,      // widest offset from the centre line, radians
  bothSides: true,
  segments: 28,
  layerStart: 1,
  colorKey: 'tsumu',
};

export function tsumu(division, options = {}) {
  const p = { ...tsumuDefaults, ...options };
  const { complex } = division;
  const edges = p.edges ?? complex.edges.map((_, i) => i);
  const out = [];

  for (const ei of edges) {
    const edge = complex.edges[ei];
    if (!edge) continue;
    const a = complex.vertices[edge.a].pos;
    const b = complex.vertices[edge.b].pos;

    for (let r = 0; r < p.rows; r++) {
      // Row 0 is the tightest arc; later rows bow further out.
      const amount = (p.bulge * (r + 1)) / p.rows;
      const sides = p.bothSides ? [1, -1] : [1];
      for (const side of sides) {
        out.push({
          points: bowedArc(a, b, side * amount, p.segments),
          layer: p.layerStart + r,
          colorKey: p.colorKey,
          closed: false,
        });
      }
    }
  }

  return out;
}

/**
 * The arc from `a` to `b` pushed sideways off its great circle, peaking at
 * `amount` radians in the middle and closing to nothing at both ends.
 */
export function bowedArc(a, b, amount, segments = 28) {
  const axis = cross(a, b);
  if (length(axis) < 1e-9 || Math.abs(amount) < 1e-9) {
    return sampleArc(a, b, segments);
  }
  const normal = normalize(axis);

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = slerp(a, b, t);
    const push = amount * Math.sin(Math.PI * t);
    points.push(
      Math.abs(push) < 1e-12
        ? base
        : travel(base, tangentDirection(base, normal), push),
    );
  }
  return points;
}
