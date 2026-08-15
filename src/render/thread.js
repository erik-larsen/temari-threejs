// Thread rendering.
//
// Polylines from the stitch generators arrive as unit-sphere points plus a
// `layer` (round number). Here they are pushed out to
//
//     radius * (1 + LAYER_LIFT * layer)
//
// so a later round physically sits above an earlier one — the stacking that
// makes the patterns read as wound thread rather than paint — and drawn with
// LineSegments2 / LineMaterial for screen-space-constant thickness, batched
// into one draw call per color.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/** Radial lift per layer, as a fraction of the sphere radius. */
export const LAYER_LIFT = 0.0022;

/**
 * A group of thread polylines sharing one color and thickness.
 * `linewidth` is in pixels (LineMaterial's world-units mode stays off).
 */
export function createThreadGroup({
  color = 0xffffff,
  linewidth = 2.5,
  radius = 1,
} = {}) {
  const material = new LineMaterial({
    color,
    linewidth,
    worldUnits: false,
    alphaToCoverage: true,
  });

  const object = new THREE.Group();
  let segmentsMesh = null;

  return {
    object,
    material,
    setPolylines(polylines) {
      if (segmentsMesh) {
        object.remove(segmentsMesh);
        segmentsMesh.geometry.dispose();
        segmentsMesh = null;
      }
      const positions = [];
      for (const line of polylines) {
        const lift = radius * (1 + LAYER_LIFT * (line.layer ?? 0));
        const pts = line.points;
        for (let i = 0; i + 1 < pts.length; i++) {
          positions.push(
            pts[i][0] * lift, pts[i][1] * lift, pts[i][2] * lift,
            pts[i + 1][0] * lift, pts[i + 1][1] * lift, pts[i + 1][2] * lift,
          );
        }
      }
      if (!positions.length) return;
      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(positions);
      segmentsMesh = new LineSegments2(geometry, material);
      // The sphere itself culls fine; thread hugging the surface flickers if
      // frustum culling uses the default bounding sphere before it's computed.
      segmentsMesh.computeLineDistances();
      segmentsMesh.frustumCulled = false;
      object.add(segmentsMesh);
    },
    setColor(hex) {
      material.color.set(hex);
    },
    setLinewidth(px) {
      material.linewidth = px;
    },
    setResolution(w, h) {
      material.resolution.set(w, h);
    },
    setVisible(v) {
      object.visible = v;
    },
    dispose() {
      if (segmentsMesh) {
        object.remove(segmentsMesh);
        segmentsMesh.geometry.dispose();
      }
      material.dispose();
    },
  };
}
