// Shared cell-complex machinery: given vertices and edges on the sphere,
// derive the rotational order at each vertex and walk out the faces.
// Both the great-circle arrangement (C8, C10, simple divisions) and the
// geodesic builder (tamentai) finish through here, so downstream code sees
// one uniform structure regardless of how a division was constructed.

import { angleInBasis, cross, anyPerpendicular, tangentDirection } from './vec.js';

// Names for the mentai — the regions temari makers stitch onto. Each is
// centred on a vertex, but the shape a given valence implies depends on how
// the division was built, so the two constructions get their own tables.
//
// In a great-circle arrangement the mentai are the faces of the cantellated
// polyhedron: a centre on a symmetry axis of order n becomes an n-gon, while
// a centre on a 2-fold axis (valence 4) becomes a diamond rather than a
// degenerate 2-gon. Hence C10's 12 pentagons / 20 triangles / 30 diamonds and
// C8's 6 squares / 8 triangles / 12 diamonds.
const ARRANGEMENT_REGIONS = {
  4: 'diamond',
  6: 'triangle',
  8: 'square',
  10: 'pentagon',
  12: 'hexagon',
};

// On a geodesic sphere the mentai are the dual faces, and on a simple division
// the pole region opens into as many petals as there are lines meeting there.
// Both cases give a valence-n centre an n-sided region.
const DUAL_REGIONS = {
  3: 'triangle',
  4: 'diamond',
  5: 'pentagon',
  6: 'hexagon',
  7: 'heptagon',
  8: 'octagon',
  9: 'nonagon',
  10: 'decagon',
  12: 'dodecagon',
  16: 'hexadecagon',
};

export const REGION_TABLES = {
  arrangement: ARRANGEMENT_REGIONS,
  dual: DUAL_REGIONS,
};

/**
 * Order each vertex's neighbours counter-clockwise in its tangent plane as
 * seen from outside the sphere. This rotational order is what makes the face
 * walk possible.
 */
export function linkNeighbors(vertices, edges) {
  for (const v of vertices) v.neighbors = [];
  for (const e of edges) {
    vertices[e.a].neighbors.push(e.b);
    vertices[e.b].neighbors.push(e.a);
  }
  for (const v of vertices) {
    const u = anyPerpendicular(v.pos);
    const w = cross(v.pos, u);
    v.neighbors.sort((p, q) => {
      const dp = tangentDirection(v.pos, vertices[p].pos);
      const dq = tangentDirection(v.pos, vertices[q].pos);
      return angleInBasis(dp, u, w) - angleInBasis(dq, u, w);
    });
  }
}

/**
 * Trace face cycles through the half-edge structure. From the dart a->b the
 * next dart around the face is the neighbour one step counter-clockwise from
 * b->a in b's rotational order.
 */
export function walkFaces(vertices) {
  const visited = new Set();
  const faces = [];
  const key = (a, b) => `${a}>${b}`;

  vertices.forEach((v, a) => {
    for (const b of v.neighbors) {
      if (visited.has(key(a, b))) continue;

      const cycle = [];
      let from = a;
      let to = b;
      // Guard against a malformed complex looping forever.
      for (let guard = 0; guard < 100000; guard++) {
        visited.add(key(from, to));
        cycle.push(from);
        const ring = vertices[to].neighbors;
        const idx = ring.indexOf(from);
        const next = ring[(idx + 1) % ring.length];
        from = to;
        to = next;
        if (from === a && to === b) break;
      }
      faces.push({ vertices: cycle });
    }
  });

  return faces;
}

/**
 * Complete a complex in place: valences, rotational order, faces, region
 * names, and a valence -> vertex-index lookup for stitch placement.
 */
export function finalizeComplex(vertices, edges, naming = 'arrangement') {
  linkNeighbors(vertices, edges);
  const faces = walkFaces(vertices);
  const table = REGION_TABLES[naming] ?? ARRANGEMENT_REGIONS;

  const centersByValence = new Map();
  vertices.forEach((v, i) => {
    v.valence = v.neighbors.length;
    v.region = table[v.valence] ?? `${v.valence}-point`;
    if (!centersByValence.has(v.valence)) centersByValence.set(v.valence, []);
    centersByValence.get(v.valence).push(i);
  });

  return { vertices, edges, faces, centersByValence };
}

/** Euler characteristic of the complex; must be 2 for a sphere. */
export function eulerCharacteristic({ vertices, edges, faces }) {
  return vertices.length - edges.length + faces.length;
}

/** Count of vertices by valence, e.g. C10 gives `{10: 12, 6: 20, 4: 30}`. */
export function valenceHistogram({ vertices }) {
  const hist = {};
  for (const v of vertices) hist[v.valence] = (hist[v.valence] ?? 0) + 1;
  return hist;
}
