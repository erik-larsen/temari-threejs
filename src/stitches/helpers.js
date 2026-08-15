// Shared geometry for stitch generators.
//
// A stitch is a pure function (division, params) -> Polyline[]. A polyline is
// a run of unit-sphere points plus the round number it belongs to:
//
//   { points: number[][], layer: number, colorKey: string, closed: boolean }
//
// `layer` is what turns flat curves into thread. The renderer pushes each
// polyline out to radius * (1 + layer * epsilon), so a later round physically
// sits on top of the one before it — the same stacking that lets a real maker
// carry a thread *over* previous rounds.

import {
  EPS,
  add,
  angleBetween,
  cross,
  length,
  normalize,
  rotateAbout,
  slerp,
  tangentDirection,
} from '../core/vec.js';

/** Describe the marking lines radiating from a centre, in CCW order. */
export function spokesOf(complex, centerIndex) {
  const centre = complex.vertices[centerIndex];
  return centre.neighbors.map((ni) => ({
    index: ni,
    pos: complex.vertices[ni].pos,
    angle: angleBetween(centre.pos, complex.vertices[ni].pos),
  }));
}

/**
 * A point `fraction` of the way along the marking line from a centre to a
 * neighbour. Makers work in exactly these terms — "half the distance between
 * the equator and the pole" — so fractions, not absolute angles, are the
 * natural parameter.
 */
export function alongSpoke(centrePos, spokePos, fraction) {
  return slerp(centrePos, spokePos, clamp01(fraction));
}

/**
 * A point out along the bisector between two adjacent spokes, at `fraction` of
 * their mean length. This is where the valleys of a kiku zigzag land.
 */
export function betweenSpokes(centrePos, aPos, bPos, fraction) {
  const da = tangentDirection(centrePos, aPos);
  const db = tangentDirection(centrePos, bPos);
  let mid = add(da, db);
  // Diametrically opposed spokes have no bisector; step a quarter turn off the
  // first one instead. Adjacent spokes of a real division never hit this, but
  // a hand-built division might.
  mid = length(mid) < 1e-9 ? normalize(cross(centrePos, da)) : normalize(mid);

  const mean =
    0.5 * (angleBetween(centrePos, aPos) + angleBetween(centrePos, bPos));
  return travel(centrePos, mid, clamp01(fraction) * mean);
}

/** Move from unit `from` along tangent direction `dir` by `angle` radians. */
export function travel(from, dir, angle) {
  const axis = cross(from, dir);
  if (length(axis) < EPS) return [...from];
  return rotateAbout(from, normalize(axis), angle);
}

/** Resolve a centre selector into vertex indices. */
export function resolveCenters(division, selector) {
  const { complex } = division;
  if (Array.isArray(selector)) return selector.filter((i) => complex.vertices[i]);
  if (typeof selector === 'number') {
    return complex.centersByValence.get(selector) ?? [];
  }
  if (typeof selector === 'string') {
    const byRegion = [];
    complex.vertices.forEach((v, i) => {
      if (v.region === selector) byRegion.push(i);
    });
    if (byRegion.length) return byRegion;
  }
  // Default: the busiest centres, which is where the eye-catching stitching
  // goes — the pentagons of a C10, the poles of a simple division.
  const valences = [...complex.centersByValence.keys()].sort((a, b) => b - a);
  return complex.centersByValence.get(valences[0]) ?? [];
}

export function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/** Close a ring of points by repeating the first one. */
export function closeRing(points) {
  return points.length ? [...points, points[0]] : points;
}
