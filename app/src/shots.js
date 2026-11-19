// ?shot= modes: the screenshots are the app's own drawing, like the house
// apps do. `?shot=cover` renders one cover full-viewport (no editor chrome);
// `?shot=editor` boots the editor with a photo loaded.
// Params: photo, caption, subtitle, layout, grade, size, stars.

import { renderCover } from './cover.js';
import { defaultState, ensurePanels } from './editor.js';
import { paintScene } from './scenes.js';

export function shotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    mode: q.get('shot') || '',
    photo: q.get('photo') || 'boulevard',
    caption: q.get('caption') || 'VICE SUNSET',
    subtitle: q.get('subtitle') || 'a Lucia & Jason story',
    layout: q.get('layout') || 'vice-grid',
    grade: q.get('grade') || 'sunset',
    size: q.get('size') || '1080x1080',
    stars: Number(q.get('stars') || 5),
  };
}

function resolvePhoto(photoId) {
  if (photoId === 'boulevard' || photoId === 'neon' || photoId === 'pier' || photoId === 'rooftop') {
    return paintScene(photoId, 1080, 1350);
  }
  return paintScene('boulevard', 1080, 1350);
}

function stateFromParams(p) {
  const state = defaultState();
  state.layout = p.layout;
  state.grade = p.grade;
  state.title = p.caption;
  state.subtitle = p.subtitle;
  state.stars = p.stars;
  state.fillAll = false;
  const photos = ['boulevard', 'neon', 'pier', 'rooftop'];
  const hero = photos.includes(p.photo) ? p.photo : 'boulevard';
  state.panels = state.panels.map((panel, i) => ({
    ...panel,
    photo: i === 0 ? hero : photos[(i + photos.indexOf(hero)) % photos.length],
  }));
  return ensurePanels(state);
}

// Returns true when a shot mode handled the page.
export function initShotMode() {
  const p = shotParams();
  if (!p.mode) return false;
  const [w, h] = p.size.split('x').map(Number);
  const state = stateFromParams(p);
  if (p.mode === 'cover') {
    document.body.classList.add('shot-cover');
    document.body.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'shot-canvas';
    document.body.appendChild(canvas);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    renderCover(canvas, state, vw, vh, resolvePhoto);
    document.title = `Cover — ${p.caption}`;
    return true;
  }
  // editor mode: the editor boots in main.js; stash the shot state for it.
  window.__shotState = state;
  return false;
}
