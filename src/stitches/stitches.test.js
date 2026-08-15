import { describe, expect, it } from 'vitest';

import { getDivision } from '../core/divisions.js';
import { STITCHES, generateAll, generateStitch } from './index.js';
import { bowedArc } from './tsumu.js';
import { smallCircle } from './obi.js';
import { angleBetween } from '../core/vec.js';

const c10 = getDivision('C10');
const s8 = getDivision('S8');

/** Every generated point must sit on the unit sphere. */
function expectOnSphere(polylines) {
  expect(polylines.length).toBeGreaterThan(0);
  for (const line of polylines) {
    expect(line.points.length).toBeGreaterThan(1);
    expect(Number.isInteger(line.layer)).toBe(true);
    for (const p of line.points) {
      expect(Math.hypot(...p)).toBeCloseTo(1, 9);
    }
  }
}

describe('stitch registry', () => {
  it('exposes a generator and defaults for every stitch', () => {
    for (const [id, entry] of Object.entries(STITCHES)) {
      expect(typeof entry.generate, id).toBe('function');
      expect(entry.defaults, id).toBeTypeOf('object');
      expect(entry.name, id).toBeTruthy();
    }
  });

  it('keeps every stitch on the unit sphere for both division kinds', () => {
    for (const id of Object.keys(STITCHES)) {
      for (const division of [c10, s8]) {
        expectOnSphere(generateStitch(division, { type: id }));
      }
    }
  });

  it('throws on an unknown stitch type', () => {
    expect(() => generateStitch(c10, { type: 'nope' })).toThrow(/unknown stitch/);
  });

  it('skips specs marked disabled', () => {
    const specs = [{ type: 'obi' }, { type: 'kiku', enabled: false }];
    const onlyObi = generateAll(c10, specs);
    expect(onlyObi.every((l) => l.colorKey === 'obi')).toBe(true);
  });
});

describe('kiku', () => {
  it('works one closed zigzag per round at each ten-point centre', () => {
    const rounds = 4;
    const lines = generateStitch(c10, { type: 'kiku', params: { rounds } });
    expect(lines).toHaveLength(12 * rounds);
    for (const line of lines) expect(line.closed).toBe(true);
  });

  it('stacks each round on its own layer so later rounds sit over earlier', () => {
    const lines = generateStitch(c10, { type: 'kiku', params: { rounds: 3 } });
    const layers = [...new Set(lines.map((l) => l.layer))].sort((a, b) => a - b);
    expect(layers).toEqual([1, 2, 3]);
  });

  it('steps each round further from its centre than the last', () => {
    const lines = generateStitch(s8, {
      type: 'kiku',
      params: { rounds: 3, centers: [0] },
    });
    const centre = s8.complex.vertices[0].pos;
    const meanRadius = (line) =>
      line.points.reduce((sum, p) => sum + angleBetween(centre, p), 0) /
      line.points.length;
    expect(meanRadius(lines[1])).toBeGreaterThan(meanRadius(lines[0]));
    expect(meanRadius(lines[2])).toBeGreaterThan(meanRadius(lines[1]));
  });

  it('stops rounds before they run past the neighbouring centre', () => {
    const lines = generateStitch(c10, {
      type: 'kiku',
      params: { rounds: 40, start: 0.2, step: 0.1 },
    });
    // 0.2 + r * 0.1 < 1 caps it at 8 rounds per centre, not 40.
    expect(lines).toHaveLength(12 * 8);
  });
});

describe('hoshi', () => {
  it('makes one ring per round on a coprime skip', () => {
    const lines = generateStitch(c10, {
      type: 'hoshi',
      params: { rounds: 2, skip: 3 },
    });
    expect(lines).toHaveLength(12 * 2); // gcd(10, 3) = 1
  });

  it('splits into gcd(n, skip) rings when the skip is not coprime', () => {
    const lines = generateStitch(c10, {
      type: 'hoshi',
      params: { rounds: 1, skip: 2 },
    });
    expect(lines).toHaveLength(12 * 2); // gcd(10, 2) = 2 rings per centre
  });

  it('ignores centres with too few spokes to form a star', () => {
    const lines = generateStitch(c10, {
      type: 'hoshi',
      params: { rounds: 1, centers: 4 },
    });
    expect(lines).toHaveLength(0);
  });
});

describe('obi', () => {
  it('lays one closed row per layer, symmetric about the great circle', () => {
    const lines = generateStitch(c10, { type: 'obi', params: { rows: 5 } });
    expect(lines).toHaveLength(5);
    const z = lines.map((l) => l.points[0][2]);
    // Rows are mirrored about the equator, so the offsets cancel.
    expect(z.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
  });

  it('puts a small circle at the requested polar angle', () => {
    const circle = smallCircle([0, 0, 1], Math.PI / 3, 40);
    for (const p of circle) expect(p[2]).toBeCloseTo(Math.cos(Math.PI / 3), 9);
    expect(circle[0]).toEqual(circle[circle.length - 1]);
  });
});

describe('tsumu', () => {
  it('bows the arc away from its great circle and closes at both ends', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const straight = bowedArc(a, b, 0, 20);
    const bowed = bowedArc(a, b, 0.2, 20);
    expect(bowed[0]).toEqual(straight[0]);
    expect(bowed[20]).toEqual(straight[20]);
    // The midpoint is pushed off the plane the straight arc lies in.
    expect(Math.abs(bowed[10][2])).toBeGreaterThan(0.19);
    expect(Math.abs(straight[10][2])).toBeLessThan(1e-9);
  });

  it('mirrors both sides when asked', () => {
    const one = generateStitch(c10, {
      type: 'tsumu',
      params: { rows: 1, bothSides: false, edges: [0] },
    });
    const two = generateStitch(c10, {
      type: 'tsumu',
      params: { rows: 1, bothSides: true, edges: [0] },
    });
    expect(one).toHaveLength(1);
    expect(two).toHaveLength(2);
  });
});

describe('matsuba', () => {
  it('emits needles plus one tie per bay', () => {
    const needles = 3;
    const lines = generateStitch(s8, {
      type: 'matsuba',
      params: { needles, centers: [0] },
    });
    // Eight bays around the pole, each with its needles and a binding stitch.
    expect(lines).toHaveLength(8 * (needles + 1));
  });

  it('omits the tie when switched off', () => {
    const lines = generateStitch(s8, {
      type: 'matsuba',
      params: { needles: 2, showTie: false, centers: [0] },
    });
    expect(lines).toHaveLength(8 * 2);
  });
});
