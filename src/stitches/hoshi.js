// Hoshi — star patterns.
//
// Points are set at the same distance along every marking line out of a
// centre, then joined to the point `skip` positions around instead of the
// adjacent one. Skip 2 on a ten-point centre gives the sharp five-pointed
// burst that shows up on the pentagons of most C10 balls.
//
// A non-zero `twist` rotates each successive round part-way toward the next
// spoke. Wound inward with a twist, nested stars turn into the whirlpool
// motif that fills the hexagon field of the blue ball in the reference
// photographs.

import { sampleArc } from '../core/arrangement.js';
import { slerp } from '../core/vec.js';
import { alongSpoke, closeRing, resolveCenters, spokesOf } from './helpers.js';

export const hoshiDefaults = {
  centers: null,
  rounds: 3,
  start: 0.55,
  step: -0.13,   // negative winds the star inward round by round
  skip: 2,
  twist: 0,      // per-round rotation, as a fraction of one spoke gap
  segments: 8,
  layerStart: 1,
  colorKey: 'hoshi',
};

export function hoshi(division, options = {}) {
  const p = { ...hoshiDefaults, ...options };
  const { complex } = division;
  const out = [];

  for (const centerIndex of resolveCenters(division, p.centers)) {
    const centre = complex.vertices[centerIndex].pos;
    const spokes = spokesOf(complex, centerIndex);
    const n = spokes.length;
    if (n < 5) continue;

    // A star polygon only closes in one pass when skip and n are coprime;
    // otherwise it breaks into gcd(n, skip) separate rings.
    const skip = Math.max(1, Math.min(p.skip, n - 1));
    const rings = gcd(n, skip);

    for (let r = 0; r < p.rounds; r++) {
      const t = p.start + r * p.step;
      if (t <= 0.02 || t >= 1) continue;
      const onSpokes = spokes.map((s) => alongSpoke(centre, s.pos, t));
      // Accumulated twist, wrapped into whole-spoke steps plus a blend.
      const turned = (r * p.twist) % 1;
      const shift = Math.floor(r * p.twist) % n;
      const tips = onSpokes.map((_, i) => {
        const a = onSpokes[(i + shift) % n];
        const b = onSpokes[(i + shift + 1) % n];
        return turned < 1e-9 ? a : slerp(a, b, turned);
      });

      for (let ring = 0; ring < rings; ring++) {
        const points = [];
        let i = ring;
        do {
          const j = (i + skip) % n;
          points.push(...sampleArc(tips[i], tips[j], p.segments).slice(0, -1));
          i = j;
        } while (i !== ring);

        out.push({
          points: closeRing(points),
          layer: p.layerStart + r,
          colorKey: p.colorKey,
          closed: true,
        });
      }
    }
  }

  return out;
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
