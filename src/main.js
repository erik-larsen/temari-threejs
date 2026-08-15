// Entry point: wire the geometry engine, stitch generators, renderer and GUI
// together around one design-state object.

import { markingPolylines } from './core/arrangement.js';
import { valenceHistogram } from './core/complex.js';
import { getDivision } from './core/divisions.js';
import { loadPreset } from './presets/index.js';
import { createScene } from './render/scene.js';
import { createMari } from './render/sphere.js';
import { createThreadGroup } from './render/thread.js';
import { generateStitch } from './stitches/index.js';
import { buildGui } from './ui/gui.js';

const ctx = createScene(document.body);
const mari = createMari(1);
ctx.scene.add(mari.mesh);

const hud = document.getElementById('hud');

let state = loadPreset('shion');
let gui = null;
let threadGroups = [];

function disposeThreads() {
  for (const g of threadGroups) {
    ctx.scene.remove(g.object);
    g.dispose();
  }
  threadGroups = [];
}

function rebuild() {
  disposeThreads();

  const division = getDivision(state.division);
  mari.setColor(state.mari);

  // Marking threads sit on layer 0, directly on the mari.
  if (state.marking.visible) {
    const group = createThreadGroup({
      color: state.marking.color,
      linewidth: state.marking.linewidth,
    });
    group.setPolylines(
      markingPolylines(division.complex).map((points) => ({ points, layer: 0 })),
    );
    ctx.scene.add(group.object);
    threadGroups.push(group);
  }

  for (const spec of state.stitches) {
    if (spec.enabled === false) continue;
    const group = createThreadGroup({ color: spec.color, linewidth: spec.linewidth });
    group.setPolylines(generateStitch(division, spec));
    ctx.scene.add(group.object);
    threadGroups.push(group);
  }

  const hist = valenceHistogram(division.complex);
  const mentai = Object.entries(hist)
    .sort((a, b) => b[0] - a[0])
    .map(([v, n]) => `${n}×${v}pt`)
    .join('  ');
  hud.textContent =
    `${division.name}  (${division.group})\n` +
    `V ${division.complex.vertices.length}  E ${division.complex.edges.length}  ` +
    `F ${division.complex.faces.length}\n${mentai}`;
}

ctx.onResolution((w, h) => {
  for (const g of threadGroups) g.setResolution(w, h);
});

function rebuildGui() {
  gui?.destroy();
  gui = buildGui({
    state,
    onChange: rebuild,
    onPreset(id) {
      state = loadPreset(id);
      rebuildGui();
      rebuild();
    },
    onResetCamera: () => ctx.resetCamera(),
  });
}

rebuildGui();
rebuild();
