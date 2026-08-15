import { describe, expect, it } from 'vitest';

import { eulerCharacteristic, valenceHistogram } from './complex.js';
import { combination10, combination8, getDivision, simpleDivision } from './divisions.js';
import { geodesicComplex, subdivideTriangulation, icosahedronBase, pentakisBase } from './geodesic.js';
import { icosahedral, icosahedronFaces, octahedral } from './symmetry.js';
import { dot } from './vec.js';

describe('mirror plane sets', () => {
  it('has 9 octahedral and 15 icosahedral planes', () => {
    expect(octahedral()).toHaveLength(9);
    expect(icosahedral()).toHaveLength(15);
  });

  it('gives 20 icosahedron faces', () => {
    const { vertices, faces } = icosahedronFaces();
    expect(vertices).toHaveLength(12);
    expect(faces).toHaveLength(20);
  });

  it('produces distinct unit normals', () => {
    for (const set of [octahedral(), icosahedral()]) {
      for (let i = 0; i < set.length; i++) {
        expect(Math.hypot(...set[i])).toBeCloseTo(1, 12);
        for (let j = i + 1; j < set.length; j++) {
          expect(Math.abs(dot(set[i], set[j]))).toBeLessThan(1 - 1e-6);
        }
      }
    }
  });
});

describe('simple divisions', () => {
  // n + 2 vertices, 3n edges, 2n spherical isosceles triangles.
  for (const n of [3, 4, 5, 6, 7, 8, 10, 12, 16]) {
    it(`S${n} gives ${n + 2} vertices, ${3 * n} edges, ${2 * n} faces`, () => {
      const c = simpleDivision(n);
      expect(c.vertices).toHaveLength(n + 2);
      expect(c.edges).toHaveLength(3 * n);
      expect(c.faces).toHaveLength(2 * n);
      expect(eulerCharacteristic(c)).toBe(2);
      // Two poles of valence n, plus n equator points of valence 4. At n = 4
      // the division is the octahedron and the two groups share a key.
      const expected = {};
      expected[n] = 2;
      expected[4] = (expected[4] ?? 0) + n;
      expect(valenceHistogram(c)).toEqual(expected);
    });
  }

  it('S4 is the octahedron', () => {
    const c = simpleDivision(4);
    expect(c.vertices).toHaveLength(6);
    expect(c.faces).toHaveLength(8);
    expect(valenceHistogram(c)).toEqual({ 4: 6 });
  });

  it('rejects n below 3 and non-integers', () => {
    expect(() => simpleDivision(2)).toThrow();
    expect(() => simpleDivision(6.5)).toThrow();
  });
});

describe('C8 — the 8-combination division', () => {
  const c = combination8();

  it('has 26 centres, 72 edges and 48 fundamental triangles', () => {
    expect(c.vertices).toHaveLength(26);
    expect(c.edges).toHaveLength(72);
    expect(c.faces).toHaveLength(48);
    expect(eulerCharacteristic(c)).toBe(2);
  });

  it('splits into 6 eight-point, 8 six-point and 12 four-point centres', () => {
    expect(valenceHistogram(c)).toEqual({ 8: 6, 6: 8, 4: 12 });
  });

  it('names the mentai as 6 squares, 8 triangles and 12 diamonds', () => {
    const byRegion = {};
    for (const v of c.vertices) byRegion[v.region] = (byRegion[v.region] ?? 0) + 1;
    expect(byRegion).toEqual({ square: 6, triangle: 8, diamond: 12 });
  });

  it('makes every face a triangle with one centre of each type', () => {
    for (const f of c.faces) {
      expect(f.vertices).toHaveLength(3);
      const valences = f.vertices.map((i) => c.vertices[i].valence).sort();
      expect(valences).toEqual([4, 6, 8]);
    }
  });
});

describe('C10 — the 10-combination division', () => {
  const c = combination10();

  it('has 62 centres, 180 edges and 120 fundamental triangles', () => {
    expect(c.vertices).toHaveLength(62);
    expect(c.edges).toHaveLength(180);
    expect(c.faces).toHaveLength(120);
    expect(eulerCharacteristic(c)).toBe(2);
  });

  it('splits into 12 ten-point, 20 six-point and 30 four-point centres', () => {
    expect(valenceHistogram(c)).toEqual({ 10: 12, 6: 20, 4: 30 });
  });

  it('names the mentai as 12 pentagons, 20 triangles and 30 diamonds', () => {
    const byRegion = {};
    for (const v of c.vertices) byRegion[v.region] = (byRegion[v.region] ?? 0) + 1;
    expect(byRegion).toEqual({ pentagon: 12, triangle: 20, diamond: 30 });
  });

  // This is the assertion that catches epsilon-merge bugs Euler would miss:
  // a shattered pole still balances V - E + F but ruins the face structure.
  it('makes every face a triangle with one centre of each type', () => {
    for (const f of c.faces) {
      expect(f.vertices).toHaveLength(3);
      const valences = f.vertices.map((i) => c.vertices[i].valence).sort();
      expect(valences).toEqual([10, 4, 6].sort());
    }
  });

  it('places the 12 ten-point centres at the icosahedron vertex angle', () => {
    const poles = c.centersByValence.get(10).map((i) => c.vertices[i].pos);
    // Each pentagon centre has exactly 5 nearest neighbours at 63.435 degrees,
    // the angle TemariKai approximates as 1/6 of the circumference plus 1/100.
    const expected = Math.acos(1 / Math.sqrt(5));
    expect((expected / (2 * Math.PI)).toFixed(4)).toBe('0.1762'); // vs 1/6 + 1/100
    for (const p of poles) {
      const close = poles.filter(
        (q) => q !== p && Math.abs(Math.acos(Math.min(1, dot(p, q))) - expected) < 1e-6,
      );
      expect(close).toHaveLength(5);
    }
  });
});

describe('tamentai geodesic divisions', () => {
  // TemariKai's (1/3 X^2) * 10 + 2 and X^2 * 10 + 2 are both 10T + 2.
  const cases = [
    ['T32', 32, 'pentakis', 1, 3],
    ['T92', 92, 'icosahedron', 3, 9],
    ['T122', 122, 'pentakis', 2, 12],
    ['T272', 272, 'pentakis', 3, 27],
    ['T362', 362, 'icosahedron', 6, 36],
  ];

  for (const [id, count, base, frequency, T] of cases) {
    it(`${id} has 10T + 2 = ${count} vertices for T = ${T}`, () => {
      const c = geodesicComplex(base, frequency);
      expect(c.vertices).toHaveLength(10 * T + 2);
      expect(c.vertices).toHaveLength(count);
      expect(eulerCharacteristic(c)).toBe(2);
      // A geodesic sphere is a triangulation: F = 20T, E = 30T.
      expect(c.faces).toHaveLength(20 * T);
      expect(c.edges).toHaveLength(30 * T);
    });

    it(`${id} has exactly 12 five-point centres, the rest six-point`, () => {
      const c = geodesicComplex(base, frequency);
      const hist = valenceHistogram(c);
      expect(hist[5]).toBe(12);
      expect(hist[6] ?? 0).toBe(count - 12);
      expect(Object.keys(hist).sort()).toEqual(count === 32 ? ['5', '6'] : ['5', '6']);
    });
  }

  it('keeps every vertex on the unit sphere', () => {
    const c = geodesicComplex('icosahedron', 6);
    for (const v of c.vertices) expect(Math.hypot(...v.pos)).toBeCloseTo(1, 12);
  });

  it('rejects a non-positive frequency', () => {
    expect(() => subdivideTriangulation(icosahedronBase(), 0)).toThrow();
    expect(() => subdivideTriangulation(pentakisBase(), 1.5)).toThrow();
  });
});

describe('division registry', () => {
  it('builds every registered division into a valid sphere complex', () => {
    for (const id of Object.keys(
      // eslint-disable-next-line no-undef
      { S5: 1, S6: 1, S7: 1, S8: 1, S10: 1, S12: 1, S16: 1, C8: 1, C10: 1, T32: 1, T92: 1, T122: 1, T272: 1, T362: 1 },
    )) {
      const d = getDivision(id);
      expect(eulerCharacteristic(d.complex), id).toBe(2);
      expect(d.complex.faces.length, id).toBeGreaterThan(0);
    }
  });

  it('memoizes so repeated lookups return the same object', () => {
    expect(getDivision('C10')).toBe(getDivision('C10'));
  });

  it('throws on an unknown id', () => {
    expect(() => getDivision('C11')).toThrow(/unknown division/);
  });
});
