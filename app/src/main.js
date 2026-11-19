// Vice Coast Cover Studio — editor (app/src/main.js).
//
// Wires the controls in index.html to the render engine in cover.js:
// photo library, panel picking (click to select, drag to pan, scroll to
// zoom), sliders, caption fields, undo/redo and PNG export. Photos are
// read on the user's own machine and never leave it.

import {
  LAYOUTS,
  GRADES,
  SIZES,
  SAMPLE_PHOTOS,
  freshState,
  fitPanelsToLayout,
  panelCount,
  renderCover,
  exportCanvas,
  hitPanel,
} from './cover.js';
import { applyShotParams } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');
const statusEl = $('status');

const state = freshState();
let selected = 0;
let pickedPhotoId = null;
let dragging = false;
let dragStart = null;

// --- photo library ---------------------------------------------------------

const library = []; // { id, name, src, img }
const photos = {}; // id -> HTMLImageElement

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhotoToLibrary(id, name, src) {
  if (photos[id]) return photos[id];
  const img = await loadImage(src);
  photos[id] = img;
  library.push({ id, name, src, img });
  renderLibrary();
  return img;
}

function renderLibrary() {
  const lib = $('library');
  lib.textContent = '';
  for (const entry of library) {
    const thumb = document.createElement('img');
    thumb.src = entry.src;
    thumb.alt = entry.name;
    thumb.title = `${entry.name} — click, then click a panel to fill it`;
    if (entry.id === pickedPhotoId) thumb.classList.add('picked');
    thumb.addEventListener('click', () => {
      pickedPhotoId = pickedPhotoId === entry.id ? null : entry.id;
      renderLibrary();
      setStatus(
        pickedPhotoId
          ? `${entry.name} picked — click a panel to fill it.`
          : 'Photo unpicked.',
      );
    });
    lib.appendChild(thumb);
  }
}

async function loadSamples() {
  for (const sample of SAMPLE_PHOTOS) {
    try {
      await addPhotoToLibrary(sample.id, sample.name, sample.src);
    } catch (err) {
      setStatus(`Sample ${sample.name} failed to load.`);
    }
  }
}

// --- history (undo / redo) ---------------------------------------------------

const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    caption: state.caption,
    effects: state.effects,
    panels: state.panels,
  });
}

function restore(json) {
  const data = JSON.parse(json);
  Object.assign(state, data);
  fitPanelsToLayout(state);
  selected = Math.min(selected, state.panels.length - 1);
  syncControls();
  render();
}

function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

// --- rendering ---------------------------------------------------------------

function render() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  renderCover(ctx, canvas.width, canvas.height, state, photos);
  syncSelectedPanel();
}

function setStatus(text) {
  statusEl.textContent = text;
}

function syncSelectedPanel() {
  const count = panelCount(state.layout);
  $('selectedLabel').textContent = `Panel ${selected + 1} of ${count}`;
  const panel = state.panels[selected] || { zoom: 1, panX: 0, panY: 0 };
  $('zoomSlider').value = Math.round((panel.zoom || 1) * 100);
  $('zoomVal').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  $('panXSlider').value = Math.round((panel.panX || 0) * 100);
  $('panXVal').textContent = Math.round((panel.panX || 0) * 100);
  $('panYSlider').value = Math.round((panel.panY || 0) * 100);
  $('panYVal').textContent = Math.round((panel.panY || 0) * 100);
}

function syncControls() {
  document.querySelectorAll('#layoutRow .chip').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow .chip').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  $('titleInput').value = state.caption.title;
  $('subtitleInput').value = state.caption.subtitle;
  $('badgeInput').value = state.caption.badge;
  $('starsSelect').value = String(state.caption.stars);
  $('titleSizeSlider').value = state.caption.titleSize;
  $('titleSizeVal').textContent = `${state.caption.titleSize}%`;
  $('fxSun').checked = state.effects.sun;
  $('fxPalms').checked = state.effects.palms;
  $('fxSkyline').checked = state.effects.skyline;
  $('fxHalftone').checked = state.effects.halftone;
  $('fxGrain').checked = state.effects.grain;
  syncSelectedPanel();
}

// --- panel picking, panning, zooming -----------------------------------------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const p = canvasPoint(event);
  const hit = hitPanel(state, p.x, p.y, canvas.width, canvas.height);
  if (hit === -1) return;
  if (pickedPhotoId) {
    commit();
    state.panels[hit] = { ...state.panels[hit], photoId: pickedPhotoId };
    selected = hit;
    pickedPhotoId = null;
    renderLibrary();
    render();
    setStatus(`Panel ${hit + 1} filled.`);
    return;
  }
  selected = hit;
  dragging = true;
  dragStart = { x: p.x, y: p.y, panX: state.panels[hit].panX, panY: state.panels[hit].panY };
  canvas.setPointerCapture(event.pointerId);
  syncSelectedPanel();
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging || !dragStart) return;
  const p = canvasPoint(event);
  const panel = state.panels[selected];
  panel.panX = clamp(dragStart.panX + ((p.x - dragStart.x) / canvas.width) * 2.4, -1, 1);
  panel.panY = clamp(dragStart.panY + ((p.y - dragStart.y) / canvas.height) * 2.4, -1, 1);
  render();
});

canvas.addEventListener('pointerup', () => {
  if (dragging) commit();
  dragging = false;
  dragStart = null;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const p = canvasPoint(event);
  const hit = hitPanel(state, p.x, p.y, canvas.width, canvas.height);
  const index = hit === -1 ? selected : hit;
  selected = index;
  const panel = state.panels[index];
  panel.zoom = clamp((panel.zoom || 1) * (event.deltaY < 0 ? 1.08 : 0.93), 1, 3);
  render();
}, { passive: false });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// --- controls -----------------------------------------------------------------

$('photoInput').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  for (const file of files) {
    const id = `upload-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const url = URL.createObjectURL(file);
    try {
      await addPhotoToLibrary(id, file.name, url);
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  if (files.length) {
    pickedPhotoId = library[library.length - 1].id;
    renderLibrary();
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added — click a panel to fill it.`);
  }
  event.target.value = '';
});

document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    pickedPhotoId = btn.dataset.sample;
    renderLibrary();
    setStatus('Sample picked — click a panel to fill it.');
  });
});

document.querySelectorAll('#layoutRow .chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.layout === btn.dataset.layout) return;
    commit();
    state.layout = btn.dataset.layout;
    fitPanelsToLayout(state);
    selected = 0;
    syncControls();
    render();
  });
});

document.querySelectorAll('#gradeRow .chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.grade === btn.dataset.grade) return;
    commit();
    state.grade = btn.dataset.grade;
    syncControls();
    render();
  });
});

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (state.size === btn.dataset.size) return;
    commit();
    state.size = btn.dataset.size;
    syncControls();
    render();
  });
});

$('zoomSlider').addEventListener('input', () => {
  state.panels[selected].zoom = Number($('zoomSlider').value) / 100;
  render();
});
$('zoomSlider').addEventListener('change', commit);
$('panXSlider').addEventListener('input', () => {
  state.panels[selected].panX = Number($('panXSlider').value) / 100;
  render();
});
$('panXSlider').addEventListener('change', commit);
$('panYSlider').addEventListener('input', () => {
  state.panels[selected].panY = Number($('panYSlider').value) / 100;
  render();
});
$('panYSlider').addEventListener('change', commit);
$('resetCropBtn').addEventListener('click', () => {
  commit();
  state.panels[selected] = { ...state.panels[selected], zoom: 1, panX: 0, panY: 0 };
  render();
});

$('titleInput').addEventListener('input', () => {
  state.caption.title = $('titleInput').value;
  render();
});
$('titleInput').addEventListener('change', commit);
$('subtitleInput').addEventListener('input', () => {
  state.caption.subtitle = $('subtitleInput').value;
  render();
});
$('subtitleInput').addEventListener('change', commit);
$('badgeInput').addEventListener('input', () => {
  state.caption.badge = $('badgeInput').value;
  render();
});
$('badgeInput').addEventListener('change', commit);
$('starsSelect').addEventListener('change', () => {
  commit();
  state.caption.stars = Number($('starsSelect').value);
  render();
});
$('titleSizeSlider').addEventListener('input', () => {
  state.caption.titleSize = Number($('titleSizeSlider').value);
  $('titleSizeVal').textContent = `${state.caption.titleSize}%`;
  render();
});
$('titleSizeSlider').addEventListener('change', commit);

for (const [id, key] of [['fxSun', 'sun'], ['fxPalms', 'palms'], ['fxSkyline', 'skyline'], ['fxHalftone', 'halftone'], ['fxGrain', 'grain']]) {
  $(id).addEventListener('change', () => {
    commit();
    state.effects[key] = $(id).checked;
    render();
  });
}

$('undoBtn').addEventListener('click', undo);
$('redoBtn').addEventListener('click', redo);

// --- export -------------------------------------------------------------------

function downloadPNG() {
  const out = exportCanvas(state, photos);
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the browser could not make a PNG.');
        resolve(null);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-coast-cover-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Exported ${state.size.replace('x', ' × ')} PNG (${Math.round(blob.size / 1024)} KiB).`);
      resolve(blob);
    }, 'image/png');
  });
}

$('exportBtn').addEventListener('click', downloadPNG);

// --- boot -----------------------------------------------------------------------

// Handle for screenshot mode and for automated checks.
window.__viceCoast = {
  state,
  photos,
  library,
  render,
  exportCanvas: () => exportCanvas(state, photos),
  exportPNGDataURL: () =>
    new Promise((resolve) => {
      exportCanvas(state, photos).toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/png');
    }),
  addPhotoToLibrary,
  setStatus,
  ready: false,
};

async function boot() {
  syncControls();
  syncUndoButtons();
  await loadSamples();
  render();
  // Let the bundled fonts arrive, then draw once more with real lettering.
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('24px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to system fonts; the cover still renders.
  }
  render();
  await applyShotParams(window.__viceCoast);
  window.__viceCoast.ready = true;
}

boot();
