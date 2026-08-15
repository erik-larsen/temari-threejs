// Kiku / uwagake chidori kagari — the chrysanthemum herringbone.
//
// The signature temari stitch. Around a centre, the thread runs an elongated
// zigzag: peaks land on the marking lines, valleys in the bays between them,
// and each successive round steps outward while being carried *over* the
// round before it ("uwa" = over). That interlock is what builds the widening
// inverted V of thread at the pole and makes the petals look woven rather
// than drawn.
//
// Parameters map onto what a maker actually controls: how many rounds, how far
// out the first one starts, how much each round steps, and how deep the
// zigzag bites.

import { sampleArc } from '../core/arrangement.js';
import {
  alongSpoke,
  betweenSpokes,
  clamp01,
  closeRing,
  resolveCenters,
  spokesOf,
} from './helpers.js';

export const kikuDefaults = {
  centers: null,     // null = the busiest centres in the division
  rounds: 6,
  start: 0.16,       // first peak, as a fraction of the spoke length
  step: 0.085,       // how far each round advances outward
  depth: 0.11,       // how far the valleys sit inside the peaks
  segments: 5,       // samples per zigzag leg
  layerStart: 1,
  colorKey: 'kiku',
};

export function kiku(division, options = {}) {
  const p = { ...kikuDefaults, ...options };
  const { complex } = division;
  const out = [];

  for (const centerIndex of resolveCenters(division, p.centers)) {
    const centre = complex.vertices[centerIndex].pos;
    const spokes = spokesOf(complex, centerIndex);
    if (spokes.length < 3) continue;

    for (let r = 0; r < p.rounds; r++) {
      const peak = p.start + r * p.step;
      const valley = peak - p.depth;
      // Stop before the round would run past the neighbouring centre; a real
      // maker likewise stops when the petals reach the next marking point.
      if (peak >= 1) break;
      if (valley <= 0.01) continue;

      const points = [];
      for (let i = 0; i < spokes.length; i++) {
        const a = spokes[i];
        const b = spokes[(i + 1) % spokes.length];
        const tip = alongSpoke(centre, a.pos, peak);
        const bay = betweenSpokes(centre, a.pos, b.pos, clamp01(valley));
        // Sample each leg so the zigzag follows the sphere rather than cutting
        // through it.
        points.push(...sampleArc(tip, bay, p.segments).slice(0, -1));
      }

      out.push({
        points: closeRing(points),
        layer: p.layerStart + r,
        colorKey: p.colorKey,
        closed: true,
      });
    }
  }

  return out;
}
