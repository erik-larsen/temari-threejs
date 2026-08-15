// Spherical arrangement of great circles.
//
// Given the mirror-plane normals of a symmetry group, compute the cell complex
// the circles cut into the sphere: vertices where circles cross, arcs between
// them, and the faces they bound. For a reflection group the faces come out as
// the group's fundamental domains — 48 for Oh, 120 for Ih — which is the
// self-check the tests lean on.
//
// The only real difficulty is degeneracy. Temari markings are maximally
// degenerate: five circles meet at a single point on a C10 pole, where a naive
// implementation sees several near-coincident vertices and shatters the
// complex. Everything below funnels through one epsilon-merge.

import { finalizeComplex } from './complex.js';
import {
  EPS,
  anyPerpendicular,
  angleInBasis,
  cross,
  dot,
  normalize,
  planeIntersection,
} from './vec.js';

/** Two points are the same vertex when they are within this angle (radians). */
export const MERGE_TOL = 1e-6;
/** A point lies on a circle when |dot(point, normal)| is below this. */
const ON_CIRCLE_TOL = 1e-7;

const MERGE_COS = Math.cos(MERGE_TOL);

/**
 * Build the arrangement of the great circles given by unit `normals`.
 * Returns the finalized complex plus the normals it was built from.
 */
export function buildArrangement(normals) {
  const units = normals.map(normalize);
  const vertices = collectVertices(units);
  const edges = collectEdges(units, vertices);
  return { normals: units, ...finalizeComplex(vertices, edges) };
}

/** Every pairwise circle crossing, merged into distinct vertices. */
function collectVertices(normals) {
  const points = [];
  for (let i = 0; i < normals.length; i++) {
    for (let j = i + 1; j < normals.length; j++) {
      const hit = planeIntersection(normals[i], normals[j]);
      if (hit) points.push(hit[0], hit[1]);
    }
  }

  const merged = [];
  for (const p of points) {
    if (!merged.some((m) => dot(p, m) > MERGE_COS)) merged.push(p);
  }

  return merged.map((pos) => {
    // Re-derive circle membership from scratch rather than accumulating it
    // during the merge: a vertex belongs to every circle passing through it,
    // including ones whose pairwise intersection landed on a point that was
    // absorbed into this representative.
    const circles = [];
    normals.forEach((n, ci) => {
      if (Math.abs(dot(pos, n)) < ON_CIRCLE_TOL) circles.push(ci);
    });
    return { pos, circles, valence: 0, neighbors: [], region: '' };
  });
}

/** Split each circle at the vertices lying on it; consecutive pairs are arcs. */
function collectEdges(normals, vertices) {
  const edges = [];
  const seen = new Set();

  normals.forEach((n, ci) => {
    const onCircle = [];
    vertices.forEach((v, vi) => {
      if (v.circles.includes(ci)) onCircle.push(vi);
    });
    if (onCircle.length < 2) return;

    const u = anyPerpendicular(n);
    const w = cross(n, u);
    onCircle.sort(
      (p, q) =>
        angleInBasis(vertices[p].pos, u, w) - angleInBasis(vertices[q].pos, u, w),
    );

    for (let k = 0; k < onCircle.length; k++) {
      const a = onCircle[k];
      const b = onCircle[(k + 1) % onCircle.length];
      if (a === b) continue;
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, circle: ci });
    }
  });

  return edges;
}

/**
 * The complex's arcs as sampled polylines, one per edge, ready for the
 * renderer. These are the marking threads.
 */
export function markingPolylines(complex, segmentsPerArc = 16) {
  return complex.edges.map((e) =>
    sampleArc(complex.vertices[e.a].pos, complex.vertices[e.b].pos, segmentsPerArc),
  );
}

/**
 * Sample the great-circle arc between two unit points. Normalized linear
 * interpolation traces the same path as slerp and stays stable when the
 * endpoints nearly coincide.
 */
export function sampleArc(a, b, segments = 16) {
  const out = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = [
      a[0] * (1 - t) + b[0] * t,
      a[1] * (1 - t) + b[1] * t,
      a[2] * (1 - t) + b[2] * t,
    ];
    const len = Math.hypot(p[0], p[1], p[2]);
    out.push(len < EPS ? [...a] : [p[0] / len, p[1] / len, p[2] / len]);
  }
  return out;
}
