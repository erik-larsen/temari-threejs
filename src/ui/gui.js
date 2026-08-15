// lil-gui control panel.
//
// The GUI edits a plain design state object and calls `onChange` after every
// tweak; main.js owns the state and rebuilds geometry from it. Stitch
// parameters are wired up generically — any numeric parameter a stitch
// declares in its defaults gets a slider, with ranges looked up by name — so
// a new stitch type shows up in the panel without touching this file.

import GUI from 'lil-gui';

import { DIVISIONS } from '../core/divisions.js';
import { STITCHES } from '../stitches/index.js';
import { PRESETS } from '../presets/index.js';

/** Slider ranges by parameter name. Anything missing gets a free number box. */
const PARAM_RANGES = {
  rounds: [1, 14, 1],
  rows: [1, 14, 1],
  needles: [1, 9, 1],
  skip: [1, 5, 1],
  layerStart: [0, 30, 1],
  start: [0.02, 1, 0.01],
  step: [-0.3, 0.3, 0.005],
  depth: [0, 0.4, 0.005],
  twist: [0, 1, 0.01],
  spread: [0, 1, 0.01],
  length: [0.05, 1, 0.01],
  tie: [0.02, 0.5, 0.01],
  bulge: [0, 0.5, 0.005],
  spacing: [0.01, 0.2, 0.005],
  offset: [-0.6, 0.6, 0.01],
};

const HIDDEN_PARAMS = new Set(['segments', 'colorKey', 'centers', 'edges', 'axis']);

export function buildGui({ state, onChange, onPreset, onResetCamera }) {
  const gui = new GUI({ title: 'temari' });

  const actions = {
    preset: state.id ?? 'shion',
    resetCamera: onResetCamera,
  };

  gui
    .add(actions, 'preset', Object.fromEntries(Object.entries(PRESETS).map(([id, p]) => [p.name, id])))
    .name('preset')
    .onChange((id) => onPreset(id));

  gui
    .add(state, 'division', Object.fromEntries(Object.entries(DIVISIONS).map(([id, d]) => [d.name, id])))
    .name('division')
    .onChange(onChange);

  const mari = gui.addFolder('mari');
  mari.addColor(state, 'mari').name('color').onChange(onChange);

  const marking = gui.addFolder('marking lines');
  marking.add(state.marking, 'visible').onChange(onChange);
  marking.addColor(state.marking, 'color').onChange(onChange);
  marking.add(state.marking, 'linewidth', 0.5, 5, 0.1).onChange(onChange);

  state.stitches.forEach((spec, i) => {
    const entry = STITCHES[spec.type];
    const folder = gui.addFolder(`${i + 1} · ${entry?.name ?? spec.type}`);
    if (spec.enabled === undefined) spec.enabled = true;
    folder.add(spec, 'enabled').onChange(onChange);
    folder.addColor(spec, 'color').onChange(onChange);
    folder.add(spec, 'linewidth', 0.5, 6, 0.1).onChange(onChange);

    // Merge declared defaults under the spec's own params so every knob the
    // stitch understands is present and adjustable.
    spec.params = { ...entry?.defaults, ...spec.params };
    for (const [key, value] of Object.entries(spec.params)) {
      if (HIDDEN_PARAMS.has(key) || typeof value !== 'number') continue;
      const range = PARAM_RANGES[key];
      const ctrl = range
        ? folder.add(spec.params, key, range[0], range[1], range[2])
        : folder.add(spec.params, key);
      ctrl.onChange(onChange);
    }
    if (i > 0) folder.close();
  });

  gui.add(actions, 'resetCamera').name('reset camera');
  return gui;
}
