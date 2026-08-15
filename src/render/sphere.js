// The mari — the wrapped thread base ball the pattern is stitched onto.

import * as THREE from 'three';

export function createMari(radius = 1) {
  const geometry = new THREE.SphereGeometry(radius, 96, 64);
  const material = new THREE.MeshStandardMaterial({
    color: 0x1c2f38,
    roughness: 0.92,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);

  return {
    mesh,
    material,
    setColor(hex) {
      material.color.set(hex);
    },
    setOpacity(value) {
      material.transparent = value < 1;
      material.opacity = value;
      material.needsUpdate = true;
    },
    setVisible(v) {
      mesh.visible = v;
    },
  };
}
