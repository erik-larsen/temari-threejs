// Mirror-plane normals for the spherical reflection groups behind temari
// divisions. Each normal defines one great circle — physically, one marking
// thread wrapped all the way around the ball.
//
// The correspondence that drives the whole project:
//
//   simple Sn  ->  Dnh  (n/2 meridians + equator)
//   C8         ->  Oh   (9 planes)  -> 26 centers, 48 fundamental triangles
//   C10        ->  Ih   (15 planes) -> 62 centers, 120 fundamental triangles
//
// TemariKai's hand-marking rule for C10 — space the centers "1/6 of the
// circumference plus 1/100" apart — is a workshop approximation of 63.435
// degrees, the icosahedron vertex angle. Hence Ih.

import { normalize } from './vec.js';

export const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Dihedral Dnh: the mirror planes of an `n`-section simple division.
 * Requires even `n` — each great circle through the poles contributes two
 * meridians, so odd divisions cannot be built from full circles.
 * See `simpleDivision` in divisions.js for the odd case.
 */
export function dihedral(n) {
  if (n % 2 !== 0) {
    throw new Error(`dihedral() needs an even section count, got ${n}`);
  }
  const normals = [];
  // A meridian great circle in the plane containing the z axis at bearing
  // `theta` has its normal lying in the equatorial plane at `theta + pi/2`.
  for (let k = 0; k < n / 2; k++) {
    const theta = (Math.PI * k) / (n / 2);
    normals.push([-Math.sin(theta), Math.cos(theta), 0]);
  }
  normals.push([0, 0, 1]); // the obi / equator
  return normals;
}

/** Octahedral Oh: 3 axial planes + 6 diagonal planes. */
export function octahedral() {
  const normals = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const r = Math.SQRT1_2;
  for (const s of [1, -1]) {
    normals.push([r, s * r, 0]);
    normals.push([r, 0, s * r]);
    normals.push([0, r, s * r]);
  }
  return normals;
}

/** Icosahedral Ih: the 15 two-fold axes, one per icosahedron edge pair. */
export function icosahedral() {
  const normals = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const a = 0.5;
  const b = PHI / 2;
  const c = 1 / (2 * PHI);
  // Cyclic permutations of (a, b, c) with the four sign patterns that give
  // distinct axes (the first component is pinned positive since v and -v
  // describe the same plane).
  const triples = [
    [a, b, c],
    [c, a, b],
    [b, c, a],
  ];
  for (const [x, y, z] of triples) {
    for (const sy of [1, -1]) {
      for (const sz of [1, -1]) {
        normals.push([x, sy * y, sz * z]);
      }
    }
  }
  return normals.map(normalize);
}

/** The 12 icosahedron vertices, unit length. */
export function icosahedronVertices() {
  const verts = [];
  for (const s1 of [1, -1]) {
    for (const s2 of [1, -1]) {
      verts.push([0, s1, s2 * PHI]);
      verts.push([s1, s2 * PHI, 0]);
      verts.push([s2 * PHI, 0, s1]);
    }
  }
  return verts.map(normalize);
}

/** The 20 triangular faces of the icosahedron, as index triples. */
export function icosahedronFaces() {
  const verts = icosahedronVertices();
  // Edge length of the unit icosahedron: two vertices are adjacent when their
  // separation matches the minimum pairwise distance.
  let minD2 = Infinity;
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d2 =
        (verts[i][0] - verts[j][0]) ** 2 +
        (verts[i][1] - verts[j][1]) ** 2 +
        (verts[i][2] - verts[j][2]) ** 2;
      if (d2 < minD2) minD2 = d2;
    }
  }
  const tol = minD2 * 1.1;
  const adjacent = (i, j) => {
    const d2 =
      (verts[i][0] - verts[j][0]) ** 2 +
      (verts[i][1] - verts[j][1]) ** 2 +
      (verts[i][2] - verts[j][2]) ** 2;
    return d2 < tol;
  };

  const faces = [];
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      if (!adjacent(i, j)) continue;
      for (let k = j + 1; k < 12; k++) {
        if (adjacent(i, k) && adjacent(j, k)) faces.push([i, j, k]);
      }
    }
  }
  return { vertices: verts, faces };
}
