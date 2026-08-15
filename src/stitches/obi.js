// Obi — the band.
//
// The plainest temari stitch and usually the first one worked: rows of thread
// wound parallel to a great circle, building a sash around the ball. Each row
// is its own layer, so a wide obi stacks visibly.

import { anyPerpendicular, cross, normalize, rotateAbout } from '../core/vec.js';

export const obiDefaults = {
  axis: [0, 0, 1],   // the band sits perpendicular to this
  rows: 5,
  spacing: 0.045,    // angular gap between rows, radians
  offset: 0,         // shift the whole band off the great circle
  segments: 160,
  layerStart: 1,
  colorKey: 'obi',
};

export function obi(division, options = {}) {
  const p = { ...obiDefaults, ...options };
  const axis = normalize(p.axis);
  const out = [];

  for (let r = 0; r < p.rows; r++) {
    // Rows are laid symmetrically about the centre line of the band.
    const polar = Math.PI / 2 + p.offset + (r - (p.rows - 1) / 2) * p.spacing;
    out.push({
      points: smallCircle(axis, polar, p.segments),
      layer: p.layerStart + r,
      colorKey: p.colorKey,
      closed: true,
    });
  }

  return out;
}

/**
 * The circle of points at angle `polar` from `axis`, sampled `segments` times
 * plus a repeated first point to close it.
 */
export function smallCircle(axis, polar, segments = 160) {
  const u = anyPerpendicular(axis);
  // Tilt off the axis by `polar`, then sweep that vector all the way round.
  const seed = rotateAbout(axis, normalize(cross(axis, u)), polar);
  const points = [];
  for (let i = 0; i < segments; i++) {
    points.push(rotateAbout(seed, axis, (2 * Math.PI * i) / segments));
  }
  // Repeat the first point rather than rotating a full turn: a 2*pi rotation
  // lands a rounding error away from the start and leaves a hairline gap.
  points.push([...points[0]]);
  return points;
}
