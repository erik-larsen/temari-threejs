// Scene shell: renderer, camera, lights, orbit controls, resize, render loop.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(container = document.body) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161a);

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.01,
    100,
  );
  camera.position.set(2.2, 1.4, 2.6);

  // Soft three-point lighting: enough shading to read the sphere's curvature
  // without crushing thread colors into shadow.
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.6);
  key.position.set(3, 4, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.5);
  fill.position.set(-3, -1, -2);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.15;
  controls.maxDistance = 8;
  controls.enablePan = false;

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // LineMaterial resolution is updated per-frame in the loop below.
  };
  window.addEventListener('resize', onResize);

  const resolutionListeners = new Set();

  renderer.setAnimationLoop(() => {
    controls.update();
    for (const fn of resolutionListeners) {
      fn(renderer.domElement.width, renderer.domElement.height);
    }
    renderer.render(scene, camera);
  });

  return {
    renderer,
    scene,
    camera,
    controls,
    /** Register a per-frame callback that receives the drawing-buffer size. */
    onResolution(fn) {
      resolutionListeners.add(fn);
      return () => resolutionListeners.delete(fn);
    },
    resetCamera() {
      camera.position.set(2.2, 1.4, 2.6);
      controls.target.set(0, 0, 0);
    },
  };
}
