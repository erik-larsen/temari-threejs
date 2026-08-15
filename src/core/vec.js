// Minimal vector helpers for unit-sphere geometry.
// Vectors are plain [x, y, z] arrays so this layer stays free of three.js.

export const EPS = 1e-9;

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const neg = (a) => [-a[0], -a[1], -a[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const length = (a) => Math.sqrt(dot(a, a));

export function normalize(a) {
  const l = length(a);
  if (l < EPS) throw new Error('cannot normalize a zero-length vector');
  return scale(a, 1 / l);
}

/** Angle between two vectors, numerically stable near 0 and pi. */
export function angleBetween(a, b) {
  return Math.atan2(length(cross(a, b)), dot(a, b));
}

/** Rotate `v` around unit axis `k` by `angle` radians (Rodrigues' formula). */
export function rotateAbout(v, k, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(
    add(scale(v, c), scale(cross(k, v), s)),
    scale(k, dot(k, v) * (1 - c)),
  );
}

/** Spherical linear interpolation between two unit vectors. */
export function slerp(a, b, t) {
  const omega = angleBetween(a, b);
  if (omega < EPS) return [...a];
  const so = Math.sin(omega);
  return add(
    scale(a, Math.sin((1 - t) * omega) / so),
    scale(b, Math.sin(t * omega) / so),
  );
}

/**
 * Sample the minor great-circle arc from unit `a` to unit `b`.
 * Returns `segments + 1` points, endpoints included.
 */
export function greatCircleArc(a, b, segments = 24) {
  const out = [];
  for (let i = 0; i <= segments; i++) out.push(slerp(a, b, i / segments));
  return out;
}

/**
 * The two antipodal points where the great circles of unit normals `n1` and
 * `n2` cross. Returns null when the circles coincide (parallel normals).
 */
export function planeIntersection(n1, n2) {
  const c = cross(n1, n2);
  if (length(c) < 1e-7) return null;
  const p = normalize(c);
  return [p, neg(p)];
}

/**
 * An arbitrary unit vector perpendicular to unit `v`. Picking the smallest
 * component as the seed keeps the cross product well conditioned.
 */
export function anyPerpendicular(v) {
  const ax = Math.abs(v[0]);
  const ay = Math.abs(v[1]);
  const az = Math.abs(v[2]);
  const seed = ax <= ay && ax <= az ? [1, 0, 0] : ay <= az ? [0, 1, 0] : [0, 0, 1];
  return normalize(cross(v, seed));
}

/**
 * Signed angle of `p` measured in the plane spanned by orthonormal `u`, `w`,
 * counter-clockwise from `u`. Result in [0, 2pi).
 */
export function angleInBasis(p, u, w) {
  const a = Math.atan2(dot(p, w), dot(p, u));
  return a < 0 ? a + 2 * Math.PI : a;
}

/**
 * Project `target` onto the tangent plane at unit `at` and return the unit
 * direction of travel from `at` toward `target`.
 */
export function tangentDirection(at, target) {
  const t = sub(target, scale(at, dot(at, target)));
  return normalize(t);
}
