// Editor state: what the cover is made of, plus undo/redo history and the
// one-click preset looks. The renderer (cover.js) only reads this state,
// so every control below just edits the state and asks for a repaint.

import { panelCount, PRESETS } from './cover.js';
import { SCENES, sceneCanvas } from './scenes.js';

export const SCENE_IDS = Object.keys(SCENES);

export function defaultPanels(layoutId, photoCount) {
  const n = panelCount(layoutId);
  const panels = [];
  for (let i = 0; i < n; i++) {
    panels.push({ photo: i % Math.max(1, photoCount), zoom: 100, panX: 0, panY: 0, rot: 0, flip: false });
  }
  return panels;
}

export function defaultState() {
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    title: 'VICE HEIST',
    subtitle: 'a Lucia & Jason story',
    badge: 'VICE CITY • EST. 2026',
    titleSize: 100,
    stars: 5,
    size: '1920x1080',
    fillAll: true,
    photos: [],
    panels: defaultPanels('vice-grid', 1),
    selected: 0,
    effects: { grain: true, vignette: true, halftone: true },
  };
}

// A photo is { name, img } where img is a canvas or an <img>. Scene photos
// are painted in code at a generous size so panels stay sharp.
export function makeScenePhoto(sceneId) {
  return { name: SCENES[sceneId].name, img: sceneCanvas(sceneId, 1200, 900), scene: sceneId };
}

export function loadSamplePhotos(state) {
  state.photos = SCENE_IDS.map(makeScenePhoto);
  state.panels = defaultPanels(state.layout, state.photos.length);
  state.selected = 0;
  return state;
}

export function applyPreset(state, presetName) {
  const preset = PRESETS.find((p) => p.name === presetName);
  if (!preset) return state;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.badge = preset.badge;
  state.panels = defaultPanels(state.layout, Math.max(1, state.photos.length));
  state.selected = 0;
  return state;
}

export function setLayout(state, layoutId) {
  const old = state.panels;
  state.layout = layoutId;
  const next = defaultPanels(layoutId, Math.max(1, state.photos.length));
  // Keep per-panel tweaks where the new layout has the same panel index.
  for (let i = 0; i < Math.min(old.length, next.length); i++) {
    next[i] = { ...next[i], zoom: old[i].zoom, panX: old[i].panX, panY: old[i].panY, rot: old[i].rot, flip: old[i].flip };
  }
  state.panels = next;
  state.selected = 0;
  return state;
}

// Undo/redo over plain snapshots of the state (photos hold image objects,
// so snapshots keep the photo list by reference and only copy the rest).
export function snapshot(state) {
  const { photos, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}

export function restoreSnapshot(state, snap) {
  const photos = state.photos;
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, snap, { photos });
  return state;
}

export class History {
  constructor(state) {
    this.state = state;
    this.past = [];
    this.future = [];
  }
  push() {
    this.past.push(snapshot(this.state));
    if (this.past.length > 60) this.past.shift();
    this.future = [];
  }
  undo() {
    if (this.past.length === 0) return false;
    this.future.push(snapshot(this.state));
    restoreSnapshot(this.state, this.past.pop());
    return true;
  }
  redo() {
    if (this.future.length === 0) return false;
    this.past.push(snapshot(this.state));
    restoreSnapshot(this.state, this.future.pop());
    return true;
  }
}
