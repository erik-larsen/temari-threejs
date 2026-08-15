// Named designs reproducing balls from the reference photographs.

import botan from './botan.json';
import homura from './homura.json';
import shion from './shion.json';
import uzumaki from './uzumaki.json';

export const PRESETS = { shion, uzumaki, homura, botan };

/** A fresh deep copy, safe for the GUI to mutate. */
export function loadPreset(id) {
  const preset = PRESETS[id];
  if (!preset) {
    throw new Error(`unknown preset '${id}'; expected one of ${Object.keys(PRESETS).join(', ')}`);
  }
  return structuredClone(preset);
}
