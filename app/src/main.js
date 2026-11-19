// Bootstrap + editor wiring: builds the control grids, paints the live
// preview, and handles photos, panel dragging, export and undo/redo.
// The app runs fully offline: photos are read on this machine only.

import { GRADES, LAYOUTS, PRESETS, SIZES, exportCoverCanvas, layoutPanels, renderCover } from './cover.js';
import { History, applyPreset, defaultState, loadSamplePhotos, setLayout } from './editor.js';
import { setupShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
const history = new History(state);
loadSamplePhotos(state);

const preview = $('preview');
let previewW = 900;
let previewH = 900;

function previewSize() {
  const size = SIZES[state.size] ?? SIZES['1920x1080'];
  const scale = Math.min(900 / size.w, 900 / size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function repaint() {
  const { w, h } = previewSize();
  previewW = w;
  previewH = h;
  preview.width = w;
  preview.height = h;
  renderCover(preview.getContext('2d'), state, w, h);
  const size = SIZES[state.size];
  $('sizeLabel').textContent = size.label;
  $('dropHint').style.display = state.photos.length ? 'none' : 'block';
  $('undoBtn').disabled = history.past.length === 0;
  $('redoBtn').disabled = history.future.length === 0;
  syncPanelControls();
}

function syncPanelControls() {
  const panel = state.panels[state.selected] ?? state.panels[0];
  if (!panel) return;
  $('zoomInput').value = panel.zoom;
  $('panXInput').value = panel.panX;
  $('panYInput').value = panel.panY;
}

function buildPickGrid(el, items, activeKey, onPick) {
  el.innerHTML = '';
  for (const [key, item] of Object.entries(items)) {
    const btn = document.createElement('button');
    btn.className = 'pick' + (key === activeKey ? ' active' : '');
    btn.innerHTML = `<b>${item.name}</b><span>${item.desc}</span>${item.swatch ? `<span class="swatch" style="background:${item.swatch}"></span>` : ''}`;
    btn.addEventListener('click', () => {
      history.push();
      onPick(key);
      buildPickGrid(el, items, key, onPick);
      repaint();
    });
    el.appendChild(btn);
  }
}

function buildPresets() {
  const row = $('presetRow');
  row.innerHTML = '';
  for (const preset of PRESETS) {
    const btn = document.createElement('button');
    btn.textContent = preset.name;
    btn.title = `${preset.title} — ${preset.layout} + ${preset.grade}`;
    btn.addEventListener('click', () => {
      history.push();
      applyPreset(state, preset.name);
      $('titleInput').value = state.title;
      $('subtitleInput').value = state.subtitle;
      $('badgeInput').value = state.badge;
      buildPickGrid($('layoutGrid'), LAYOUTS, state.layout, (k) => setLayout(state, k));
      buildPickGrid($('gradeGrid'), GRADES, state.grade, (k) => { state.grade = k; });
      repaint();
      setStatus(`Preset “${preset.name}” applied — export when ready.`);
    });
    row.appendChild(btn);
  }
}

function buildFilmstrip() {
  const strip = $('filmstrip');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('canvas');
    thumb.className = 'thumb';
    thumb.width = 96;
    thumb.height = 96;
    thumb.title = photo.name;
    const tctx = thumb.getContext('2d');
    const iw = photo.img.naturalWidth || photo.img.width;
    const ih = photo.img.naturalHeight || photo.img.height;
    const s = Math.max(96 / iw, 96 / ih);
    tctx.drawImage(photo.img, (96 - iw * s) / 2, (96 - ih * s) / 2, iw * s, ih * s);
    if (state.fillAll ? i === 0 : (state.panels[state.selected]?.photo === i)) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
      history.push();
      if (state.fillAll) {
        state.photos = [photo, ...state.photos.filter((_, j) => j !== i)];
      } else if (state.panels[state.selected]) {
        state.panels[state.selected].photo = i;
      }
      buildFilmstrip();
      repaint();
    });
    strip.appendChild(thumb);
  });
}

function setStatus(text) {
  $('statusLine').textContent = text;
}

function download(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function exportOne(sizeKey) {
  const size = SIZES[sizeKey];
  const canvas = exportCoverCanvas(state, size.w, size.h);
  download(canvas, `vice-coast-cover-${size.w}x${size.h}.png`);
  setStatus(`Exported ${size.w} × ${size.h} PNG — check your downloads.`);
}

function addPhotoFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) return;
  history.push();
  let pending = images.length;
  for (const file of images) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ name: file.name, img });
        if (--pending === 0) {
          state.panels.forEach((p) => { if (p.photo >= state.photos.length) p.photo = 0; });
          buildFilmstrip();
          repaint();
          setStatus(`${images.length} photo${images.length > 1 ? 's' : ''} added — click a panel, then a thumbnail, to place it.`);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

function panelAt(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * previewW;
  const y = ((clientY - rect.top) / rect.height) * previewH;
  const { panels } = layoutPanels(state.layout, previewW, previewH);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function wire() {
  buildPickGrid($('layoutGrid'), LAYOUTS, state.layout, (k) => setLayout(state, k));
  buildPickGrid($('gradeGrid'), GRADES, state.grade, (k) => { state.grade = k; });
  buildPresets();
  buildFilmstrip();

  $('addPhotosBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => { addPhotoFiles(e.target.files); e.target.value = ''; });
  $('sampleBtn').addEventListener('click', () => {
    history.push();
    loadSamplePhotos(state);
    buildFilmstrip();
    repaint();
    setStatus('Sample Vice City scenes loaded.');
  });
  $('fillAllBox').addEventListener('change', (e) => { history.push(); state.fillAll = e.target.checked; repaint(); });

  const bindText = (id, key) => {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; repaint(); });
    $(id).addEventListener('change', () => history.push());
  };
  bindText('titleInput', 'title');
  bindText('subtitleInput', 'subtitle');
  bindText('badgeInput', 'badge');
  $('titleSizeInput').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); repaint(); });
  $('titleSizeInput').addEventListener('change', () => history.push());
  $('starsInput').addEventListener('input', (e) => { state.stars = Number(e.target.value); repaint(); });
  $('starsInput').addEventListener('change', () => history.push());
  $('sizeSelect').addEventListener('change', (e) => { history.push(); state.size = e.target.value; repaint(); });
  for (const [id, key] of [['grainBox', 'grain'], ['vignetteBox', 'vignette'], ['halftoneBox', 'halftone']]) {
    $(id).addEventListener('change', (e) => { history.push(); state.effects[key] = e.target.checked; repaint(); });
  }

  const bindPanelRange = (id, key) => {
    $(id).addEventListener('input', (e) => {
      const panel = state.panels[state.selected];
      if (panel) { panel[key] = Number(e.target.value); repaint(); }
    });
    $(id).addEventListener('change', () => history.push());
  };
  bindPanelRange('zoomInput', 'zoom');
  bindPanelRange('panXInput', 'panX');
  bindPanelRange('panYInput', 'panY');
  $('rotateBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    history.push();
    panel.rot = (panel.rot + 90) % 360;
    repaint();
  });
  $('flipBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    history.push();
    panel.flip = !panel.flip;
    repaint();
  });
  $('swapPhotoBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel || state.photos.length === 0) return;
    history.push();
    panel.photo = (panel.photo + 1) % state.photos.length;
    buildFilmstrip();
    repaint();
  });

  $('exportBtn').addEventListener('click', () => exportOne(state.size));
  $('exportAllBtn').addEventListener('click', () => {
    Object.keys(SIZES).forEach((key, i) => setTimeout(() => exportOne(key), i * 450));
    setStatus('Exporting all 4 sizes…');
  });
  $('undoBtn').addEventListener('click', () => { if (history.undo()) { buildFilmstrip(); repaint(); } });
  $('redoBtn').addEventListener('click', () => { if (history.redo()) { buildFilmstrip(); repaint(); } });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); if (history.undo()) { buildFilmstrip(); repaint(); } }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); if (history.redo()) { buildFilmstrip(); repaint(); } }
  });

  // Panel picking: click selects, drag pans, wheel zooms.
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const i = panelAt(e.clientX, e.clientY);
    if (i < 0) return;
    state.selected = i;
    syncPanelControls();
    buildFilmstrip();
    repaint();
    drag = { x: e.clientX, y: e.clientY, panX: state.panels[i].panX, panY: state.panels[i].panY };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const panel = state.panels[state.selected];
    const rect = preview.getBoundingClientRect();
    panel.panX = Math.max(-100, Math.min(100, drag.panX + ((e.clientX - drag.x) / rect.width) * 220));
    panel.panY = Math.max(-100, Math.min(100, drag.panY + ((e.clientY - drag.y) / rect.height) * 220));
    repaint();
  });
  preview.addEventListener('pointerup', () => { if (drag) { history.push(); drag = null; } });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(100, Math.min(300, panel.zoom - Math.sign(e.deltaY) * 12));
    repaint();
  }, { passive: false });

  // Drag & drop photos onto the stage.
  const stage = document.querySelector('.stage-wrap');
  stage.addEventListener('dragover', (e) => e.preventDefault());
  stage.addEventListener('drop', (e) => {
    e.preventDefault();
    addPhotoFiles(e.dataTransfer.files);
  });
}

// Boot: a ?shot= URL paints its scene and stops; otherwise the editor opens.
const shotMode = setupShot(state, () => repaint());
wire();
if (shotMode !== 'cover') repaint();
window.__viceCoast = { state, exportOne, repaint };
setStatus('Ready — pick a layout, a grade, a caption, export.');
