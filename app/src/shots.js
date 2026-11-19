// Screenshot scenes (?shot=...): the same modes the house apps use, so the
// screenshots are the app's own drawing — a cover the app exported, or the
// editor with a photo loaded — never an edited or borrowed picture.
//
//   ?shot=cover&size=1920x1080&photo=neon&caption=Neon%20Heat
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//
// Params: size (WxH), photo (scene id), caption (title), layout, grade,
// subtitle. The page sets window.__shotReady once the frame is painted,
// which the screenshot driver waits for.

import { SIZES, exportCoverCanvas } from './cover.js';
import { applyPreset, defaultPanels, loadSamplePhotos } from './editor.js';

export function shotParams() {
  const q = new URLSearchParams(location.search);
  if (!q.get('shot')) return null;
  return {
    mode: q.get('shot'),
    size: q.get('size') || '1920x1080',
    photo: q.get('photo') || 'boulevard',
    caption: q.get('caption') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    subtitle: q.get('subtitle') || '',
    preset: q.get('preset') || '',
  };
}

export function setupShot(state, repaint) {
  const shot = shotParams();
  if (!shot) return null;
  loadSamplePhotos(state);
  const photoIndex = { boulevard: 0, neon: 1, pier: 2, rooftop: 3 }[shot.photo] ?? 0;
  state.photos = [state.photos[photoIndex], ...state.photos.filter((_, i) => i !== photoIndex)];
  // Cover shots show a different scene in every panel (the multi-panel
  // poster look); the editor keeps one photo across all panels.
  state.fillAll = shot.mode !== 'cover';
  if (shot.preset) applyPreset(state, shot.preset);
  if (shot.layout) state.layout = shot.layout;
  if (shot.grade) state.grade = shot.grade;
  if (shot.caption) state.title = shot.caption;
  if (shot.subtitle) state.subtitle = shot.subtitle;
  // Rebuild per-panel assignments for the chosen layout so every panel of
  // a cover shot gets its own photo instead of defaulting to photo 0.
  state.panels = defaultPanels(state.layout, state.photos.length);
  state.selected = 0;

  if (shot.mode === 'cover') {
    // Full-frame cover: hide every bit of editor chrome and paint the
    // exported cover itself into the preview canvas. The canvas is sized
    // to the viewport (same aspect as the export size), so a screenshot
    // captures the whole cover and nothing else.
    const style = document.createElement('style');
    style.textContent = 'body{background:#000!important}.topbar,.controls,.foot,.stage-toolbar,.filmstrip,#dropHint{display:none!important}.workspace{display:block!important;padding:0!important;max-width:none!important}.stage-col{margin:0}.stage-wrap{border:0!important;border-radius:0!important;background:#000!important;min-height:0!important}#preview{max-height:none!important;max-width:none!important}';
    document.head.appendChild(style);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const canvas = document.getElementById('preview');
    const shotCanvas = exportCoverCanvas(state, w, h);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext('2d').drawImage(shotCanvas, 0, 0);
    document.title = `Cover — ${state.title}`;
  } else {
    repaint();
  }
  window.__shotReady = true;
  return shot.mode;
}

export function shotSize(shot) {
  const [w, h] = (shot?.size || '1920x1080').split('x').map(Number);
  return { w, h };
}

export function coverShotCanvas(state, w, h) {
  return exportCoverCanvas(state, w, h);
}

export { SIZES };
