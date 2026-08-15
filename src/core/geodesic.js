// Geodesic spheres for the tamentai (multiface) divisions.
//
// TemariKai gives two marking formulas — (1/3 X^2) * 10 + 2 for subdividing the
// C10 six-point triangles, and X^2 * 10 + 2 for the four-point diamonds. Both
// are the geodesic identity 10T + 2, so the named multiface markings are plain
// Goldberg-Coxeter spheres:
//
//   32-face   T=3   pentakis base, frequency 1
//   92-face   T=9   icosahedron base, frequency 3
//   122-face  T=12  pentakis base, frequency 2
//   272-face  T=27  pentakis base, frequency 3
//   362-face  T=36  icosahedron base, frequency 6
//
// The pentakis base is itself GC(1,1), so subdividing it at frequency n gives
// GC(n,n) — the class II markings — while subdividing the icosahedron gives
// the class I ones.

import { finalizeComplex } from './complex.js';
import { icosahedronFaces } from './symmetry.js';
import { dot, normalize } from './vec.js';

const MERGE_COS = Math.cos(1e-7);

/** Icosahedron triangulation: 12 vertices, 20 faces. GC(1,0), T = 1. */
export function icosahedronBase() {
  const { vertices, faces } = icosahedronFaces();
  return { vertices: vertices.map((v) => [...v]), faces };
}

/**
 * Pentakis dodecahedron triangulation: 12 icosahedron vertex directions plus
 * 20 face-centre directions. 32 vertices, 90 edges, 60 faces. GC(1,1), T = 3.
 *
 * Note which edges survive. The original icosahedron edges are *not* part of
 * this triangulation — keeping them would leave the 12 vertices with valence
 * 10 instead of 5, which is a different (and non-geodesic) complex that
 * happens to share the same V/E/F counts. Each icosahedron edge instead
 * contributes two triangles, one on each side, spanning its two endpoints and
 * the centres of its two adjacent faces.
 */
export function pentakisBase() {
  const { vertices, faces } = icosahedronFaces();
  const verts = vertices.map((v) => [...v]);

  const centreOfFace = faces.map(([a, b, c]) => {
    const centroid = normalize([
      verts[a][0] + verts[b][0] + verts[c][0],
      verts[a][1] + verts[b][1] + verts[c][1],
      verts[a][2] + verts[b][2] + verts[c][2],
    ]);
    return verts.push(centroid) - 1;
  });

  const edgeFaces = new Map();
  faces.forEach((f, fi) => {
    for (let k = 0; k < 3; k++) {
      const u = f[k];
      const v = f[(k + 1) % 3];
      const key = u < v ? `${u}:${v}` : `${v}:${u}`;
      if (!edgeFaces.has(key)) edgeFaces.set(key, []);
      edgeFaces.get(key).push(fi);
    }
  });

  const out = [];
  for (const [key, adjacent] of edgeFaces) {
    if (adjacent.length !== 2) {
      throw new Error(`icosahedron edge ${key} borders ${adjacent.length} faces`);
    }
    const [u, v] = key.split(':').map(Number);
    const c1 = centreOfFace[adjacent[0]];
    const c2 = centreOfFace[adjacent[1]];
    out.push([u, c1, c2], [v, c1, c2]);
  }

  return { vertices: verts, faces: out };
}

/**
 * Subdivide every triangle of `base` into frequency^2 smaller triangles on a
 * barycentric grid and project the result back onto the sphere.
 */
export function subdivideTriangulation(base, frequency) {
  if (!Number.isInteger(frequency) || frequency < 1) {
    throw new Error(`frequency must be a positive integer, got ${frequency}`);
  }

  const vertices = [];
  const faces = [];
  // Bucket by a coarse grid so vertex lookup stays near-linear at frequency 6,
  // where a naive scan would be several million comparisons.
  const buckets = new Map();
  const bucketKey = (p) =>
    `${Math.round(p[0] * 1e4)}|${Math.round(p[1] * 1e4)}|${Math.round(p[2] * 1e4)}`;

  const addVertex = (p) => {
    const unit = normalize(p);
    const kx = Math.round(unit[0] * 1e4);
    const ky = Math.round(unit[1] * 1e4);
    const kz = Math.round(unit[2] * 1e4);
    // Check the 27 neighbouring buckets so points straddling a bucket boundary
    // still merge.
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const hits = buckets.get(`${kx + dx}|${ky + dy}|${kz + dz}`);
          if (!hits) continue;
          for (const idx of hits) {
            if (dot(unit, vertices[idx]) > MERGE_COS) return idx;
          }
        }
      }
    }
    const idx = vertices.push(unit) - 1;
    const key = bucketKey(unit);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(idx);
    return idx;
  };

  const n = frequency;
  for (const [ia, ib, ic] of base.faces) {
    const A = base.vertices[ia];
    const B = base.vertices[ib];
    const C = base.vertices[ic];

    // grid[i][j] is the lattice point with barycentric weights
    // (n - i) on A, (i - j) on B, j on C.
    const grid = [];
    for (let i = 0; i <= n; i++) {
      grid.push([]);
      for (let j = 0; j <= i; j++) {
        const wa = (n - i) / n;
        const wb = (i - j) / n;
        const wc = j / n;
        grid[i].push(
          addVertex([
            A[0] * wa + B[0] * wb + C[0] * wc,
            A[1] * wa + B[1] * wb + C[1] * wc,
            A[2] * wa + B[2] * wb + C[2] * wc,
          ]),
        );
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        faces.push([grid[i][j], grid[i + 1][j], grid[i + 1][j + 1]]);
        if (j < i) faces.push([grid[i][j], grid[i + 1][j + 1], grid[i][j + 1]]);
      }
    }
  }

  return { vertices, faces };
}

/** Turn a triangulation into the shared complex form used by the renderer. */
export function triangulationToComplex({ vertices, faces }) {
  const edges = [];
  const seen = new Set();
  for (const f of faces) {
    for (let k = 0; k < f.length; k++) {
      const a = f[k];
      const b = f[(k + 1) % f.length];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b, circle: -1 });
    }
  }
  const verts = vertices.map((pos) => ({
    pos,
    circles: [],
    valence: 0,
    neighbors: [],
    region: '',
  }));
  return finalizeComplex(verts, edges, 'dual');
}

/**
 * Build a tamentai division by name. `base` is 'icosahedron' or 'pentakis'.
 * Vertex count is 10T + 2 where T = frequency^2 for the icosahedron base and
 * 3 * frequency^2 for the pentakis base.
 */
export function geodesicComplex(base, frequency) {
  const seed = base === 'pentakis' ? pentakisBase() : icosahedronBase();
  return triangulationToComplex(subdivideTriangulation(seed, frequency));
}
