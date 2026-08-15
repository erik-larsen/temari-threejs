// The named temari divisions, all reduced to one cell-complex form.
//
//   simple Sn  n sections of longitude plus the obi (equator)
//   C8         the 8-combination: 6 eight-point centres, 26 mentai
//   C10        the 10-combination: 12 ten-point centres, 62 mentai
//   T32..T362  the tamentai multiface markings, which are geodesic spheres
//
// A maker marks a ball by wrapping thread around it, so an even simple
// division and both combination divisions are literally arrangements of full
// great circles and are built that way. An odd simple division cannot be —
// a great circle always lays down two meridians at once — so it is
// constructed directly from poles and equator points instead.

import { buildArrangement } from './arrangement.js';
import { finalizeComplex } from './complex.js';
import { geodesicComplex } from './geodesic.js';
import { dihedral, icosahedral, octahedral } from './symmetry.js';

/**
 * A simple division into `n` sections of longitude, with the obi.
 * Always yields n + 2 vertices, 3n edges and 2n spherical triangles.
 */
export function simpleDivision(n) {
  if (!Number.isInteger(n) || n < 3) {
    throw new Error(`simple division needs an integer n >= 3, got ${n}`);
  }
  if (n % 2 === 0) return buildArrangement(dihedral(n));

  const vertices = [
    { pos: [0, 0, 1], circles: [], valence: 0, neighbors: [], region: '' },
    { pos: [0, 0, -1], circles: [], valence: 0, neighbors: [], region: '' },
  ];
  for (let k = 0; k < n; k++) {
    const theta = (2 * Math.PI * k) / n;
    vertices.push({
      pos: [Math.cos(theta), Math.sin(theta), 0],
      circles: [],
      valence: 0,
      neighbors: [],
      region: '',
    });
  }

  const edges = [];
  for (let k = 0; k < n; k++) {
    const eq = 2 + k;
    const nextEq = 2 + ((k + 1) % n);
    edges.push({ a: 0, b: eq, circle: k });   // north pole to equator
    edges.push({ a: 1, b: eq, circle: k });   // south pole to equator
    edges.push({ a: eq, b: nextEq, circle: -1 }); // along the obi
  }

  return { normals: [], ...finalizeComplex(vertices, edges, 'dual') };
}

/** The 8-combination division: octahedral mirror planes. */
export const combination8 = () => buildArrangement(octahedral());

/** The 10-combination division: icosahedral mirror planes. */
export const combination10 = () => buildArrangement(icosahedral());

/**
 * Registry of ready-made divisions. Each entry builds lazily so start-up does
 * not pay for the 362-face geodesic nobody may look at.
 */
export const DIVISIONS = {
  S6:   { name: 'Simple 6',   group: 'D6h',  build: () => simpleDivision(6) },
  S8:   { name: 'Simple 8',   group: 'D8h',  build: () => simpleDivision(8) },
  S10:  { name: 'Simple 10',  group: 'D10h', build: () => simpleDivision(10) },
  S12:  { name: 'Simple 12',  group: 'D12h', build: () => simpleDivision(12) },
  S16:  { name: 'Simple 16',  group: 'D16h', build: () => simpleDivision(16) },
  S5:   { name: 'Simple 5',   group: 'D5h',  build: () => simpleDivision(5) },
  S7:   { name: 'Simple 7',   group: 'D7h',  build: () => simpleDivision(7) },
  C8:   { name: 'Combination 8',  group: 'Oh', build: combination8 },
  C10:  { name: 'Combination 10', group: 'Ih', build: combination10 },
  T32:  { name: 'Tamentai 32',  group: 'Ih', build: () => geodesicComplex('pentakis', 1) },
  T92:  { name: 'Tamentai 92',  group: 'Ih', build: () => geodesicComplex('icosahedron', 3) },
  T122: { name: 'Tamentai 122', group: 'Ih', build: () => geodesicComplex('pentakis', 2) },
  T272: { name: 'Tamentai 272', group: 'Ih', build: () => geodesicComplex('pentakis', 3) },
  T362: { name: 'Tamentai 362', group: 'Ih', build: () => geodesicComplex('icosahedron', 6) },
};

const cache = new Map();

/** Build (and memoize) a division by registry id, e.g. `getDivision('C10')`. */
export function getDivision(id) {
  if (!DIVISIONS[id]) {
    throw new Error(`unknown division '${id}'; expected one of ${Object.keys(DIVISIONS).join(', ')}`);
  }
  if (!cache.has(id)) {
    const complex = DIVISIONS[id].build();
    cache.set(id, { id, ...DIVISIONS[id], complex });
  }
  return cache.get(id);
}

/**
 * The vertices of a division grouped into the named mentai regions, which is
 * what stitches attach to. Sorted with the busiest centres first, so
 * `centers(div)[0]` is the pentagon set on a C10 and the pole set on a simple
 * division.
 */
export function centers(division) {
  const { complex } = division;
  return [...complex.centersByValence.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([valence, indices]) => ({
      valence,
      region: complex.vertices[indices[0]].region,
      indices,
    }));
}
