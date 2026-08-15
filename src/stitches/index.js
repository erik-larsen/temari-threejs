// Registry of stitch generators.
//
// Every stitch is a pure function (division, params) -> Polyline[], so the
// renderer, the GUI and the preset loader all talk to them the same way.
//
// Note that a stitch is applied to *every* equivalent centre at once. The
// division already knows all 12 pentagon centres of a C10, so working one
// motif replicates it across the ball by symmetry with no extra machinery —
// which is also how a maker thinks about it.

import { hoshi, hoshiDefaults } from './hoshi.js';
import { kiku, kikuDefaults } from './kiku.js';
import { matsuba, matsubaDefaults } from './matsuba.js';
import { obi, obiDefaults } from './obi.js';
import { tsumu, tsumuDefaults } from './tsumu.js';

export const STITCHES = {
  obi: {
    name: 'Obi (band)',
    japanese: '帯',
    generate: obi,
    defaults: obiDefaults,
  },
  kiku: {
    name: 'Kiku herringbone',
    japanese: '上掛け千鳥かがり',
    generate: kiku,
    defaults: kikuDefaults,
  },
  hoshi: {
    name: 'Hoshi (star)',
    japanese: '星',
    generate: hoshi,
    defaults: hoshiDefaults,
  },
  matsuba: {
    name: 'Matsuba (pine needle)',
    japanese: '松葉かがり',
    generate: matsuba,
    defaults: matsubaDefaults,
  },
  tsumu: {
    name: 'Tsumu (spindle)',
    japanese: '紡',
    generate: tsumu,
    defaults: tsumuDefaults,
  },
};

/** Run one stitch spec against a division. */
export function generateStitch(division, spec) {
  const entry = STITCHES[spec.type];
  if (!entry) {
    throw new Error(
      `unknown stitch '${spec.type}'; expected one of ${Object.keys(STITCHES).join(', ')}`,
    );
  }
  return entry.generate(division, spec.params ?? {});
}

/** Run a whole list of stitch specs and concatenate the polylines. */
export function generateAll(division, specs) {
  return specs.flatMap((spec) => (spec.enabled === false ? [] : generateStitch(division, spec)));
}

export { hoshi, kiku, matsuba, obi, tsumu };
