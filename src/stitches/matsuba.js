// Matsuba kagari — pine needle.
//
// Straight stitches radiating from a base point in a spray, with a tie across
// the bundle near the centre. Worked into the bays between marking lines it
// reads as a scatter of pine needles; worked on the lines it becomes a
// starburst.

import { sampleArc } from '../core/arrangement.js';
import { alongSpoke, closeRing, resolveCenters, spokesOf } from './helpers.js';
import { slerp } from '../core/vec.js';

export const matsubaDefaults = {
  centers: null,
  needles: 3,      // stitches per bay
  spread: 0.34,    // how far across the bay the fan opens
  length: 0.42,    // needle length, as a fraction of the spoke
  tie: 0.16,       // where the binding stitch crosses the bundle
  showTie: true,
  segments: 6,
  layerStart: 1,
  colorKey: 'matsuba',
};

export function matsuba(division, options = {}) {
  const p = { ...matsubaDefaults, ...options };
  const { complex } = division;
  const out = [];

  for (const centerIndex of resolveCenters(division, p.centers)) {
    const centre = complex.vertices[centerIndex].pos;
    const spokes = spokesOf(complex, centerIndex);
    if (spokes.length < 3) continue;

    for (let i = 0; i < spokes.length; i++) {
      const a = spokes[i].pos;
      const b = spokes[(i + 1) % spokes.length].pos;
      const tips = [];

      for (let k = 0; k < p.needles; k++) {
        // Fan the needles across the bay, centred on its bisector.
        const across =
          p.needles === 1
            ? 0.5
            : 0.5 + p.spread * (k / (p.needles - 1) - 0.5);
        const direction = slerp(a, b, across);
        const tip = alongSpoke(centre, direction, p.length);
        tips.push(tip);
        out.push({
          points: sampleArc(centre, tip, p.segments),
          layer: p.layerStart,
          colorKey: p.colorKey,
          closed: false,
        });
      }

      if (p.showTie && tips.length > 1) {
        // The tie crosses every needle in the bundle at the same depth.
        const across = tips.map((tip) => slerp(centre, tip, p.tie / p.length));
        out.push({
          points: across.flatMap((pt, k) =>
            k === 0 ? [pt] : sampleArc(across[k - 1], pt, 3).slice(1),
          ),
          layer: p.layerStart + 1,
          colorKey: p.colorKey,
          closed: false,
        });
      }
    }
  }

  return out;
}

export { closeRing };
