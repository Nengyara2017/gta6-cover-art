// Editor state, undo/redo history, presets and photo uploads.
// State is plain JSON (photo ids only — uploaded pixels live in the
// module-level `uploads` map, never in state, so history stays cheap).

import { LAYOUTS, PRESETS, layoutPanelCount } from './cover.js';

export const SCENE_PHOTOS = ['boulevard', 'neon', 'pier', 'rooftop'];

export const uploads = new Map(); // id -> HTMLImageElement
let uploadSeq = 0;

export function defaultPanel(photo) {
  return { photo, zoom: 1, panX: 0, panY: 0, rotate: 0, flip: false };
}

export function defaultState() {
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    size: '1080x1080',
    title: 'VICE SUNSET',
    subtitle: 'a Lucia & Jason story',
    badge: 'VICE CITY — EST. 2026',
    stars: 5,
    titleSize: 1,
    titleY: 0.2,
    grain: true,
    vignette: true,
    fillAll: true,
    selected: 0,
    panels: [
      defaultPanel('boulevard'),
      defaultPanel('neon'),
      defaultPanel('pier'),
      defaultPanel('rooftop'),
      defaultPanel('boulevard'),
      defaultPanel('neon'),
      defaultPanel('pier'),
      defaultPanel('rooftop'),
      defaultPanel('boulevard'),
    ],
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export class History {
  constructor(limit = 60) {
    this.limit = limit;
    this.past = [];
    this.future = [];
  }

  push(state) {
    this.past.push(cloneState(state));
    if (this.past.length > this.limit) this.past.shift();
    this.future.length = 0;
  }

  undo(state) {
    if (!this.past.length) return null;
    this.future.push(cloneState(state));
    return this.past.pop();
  }

  redo(state) {
    if (!this.future.length) return null;
    this.past.push(cloneState(state));
    return this.future.pop();
  }

  get canUndo() { return this.past.length > 0; }
  get canRedo() { return this.future.length > 0; }
}

export function applyPreset(state, presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return state;
  const next = cloneState(state);
  next.layout = preset.layout;
  next.grade = preset.grade;
  next.title = preset.title;
  next.subtitle = preset.subtitle;
  next.selected = 0;
  return next;
}

export function setLayout(state, layout) {
  const next = cloneState(state);
  next.layout = layout;
  next.selected = 0;
  return next;
}

// Make sure every panel the layout shows has a photo; layouts with more
// panels than the state knows reuse the first panel's photo.
export function ensurePanels(state) {
  const next = cloneState(state);
  const n = layoutPanelCount(next.layout);
  while (next.panels.length < n) next.panels.push(defaultPanel(next.panels[0]?.photo || 'boulevard'));
  return next;
}

export function selectedPanel(state) {
  return state.panels[state.selected] || state.panels[0];
}

export function updateSelectedPanel(state, patch) {
  const next = cloneState(state);
  const panel = next.panels[next.selected] || next.panels[0];
  Object.assign(panel, patch);
  if (next.fillAll) {
    for (const p of next.panels) p.photo = panel.photo;
  }
  return next;
}

export function rotateSelected(state) {
  const next = cloneState(state);
  const panel = next.panels[next.selected] || next.panels[0];
  panel.rotate = ((panel.rotate || 0) + 90) % 360;
  return next;
}

export function flipSelected(state) {
  const next = cloneState(state);
  const panel = next.panels[next.selected] || next.panels[0];
  panel.flip = !panel.flip;
  return next;
}

export function resetSelectedPanel(state) {
  const next = cloneState(state);
  const panel = next.panels[next.selected] || next.panels[0];
  const photo = panel.photo;
  Object.assign(panel, defaultPanel(photo));
  return next;
}

// Read uploaded files into Images and register them as photo ids.
export async function addUploads(files) {
  const added = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('image failed'));
      img.src = dataUrl;
    });
    const id = `upload:${++uploadSeq}`;
    uploads.set(id, img);
    added.push({ id, name: file.name });
  }
  return added;
}

export function photoLabel(id) {
  if (id.startsWith('upload:')) {
    const n = id.slice('upload:'.length);
    return `Uploaded photo ${n}`;
  }
  return { boulevard: 'Boulevard Sunset', neon: 'Neon Street', pier: 'Pier Day', rooftop: 'Rooftop Dusk' }[id] || id;
}
