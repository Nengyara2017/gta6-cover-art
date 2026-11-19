// Bootstrap + editor UI wiring for Vice Coast Cover Studio 2.

import {
  EXPORT_SIZES, GRADE_ORDER, GRADES, LAYOUT_ORDER, LAYOUTS, PRESET_ORDER, PRESETS,
  coverBlob, layoutPanelCount, panelRects, renderCover,
} from './cover.js';
import {
  History, SCENE_PHOTOS, addUploads, applyPreset, cloneState, defaultState,
  ensurePanels, flipSelected, photoLabel, resetSelectedPanel, rotateSelected,
  selectedPanel, setLayout, updateSelectedPanel, uploads,
} from './editor.js';
import { paintScene } from './scenes.js';
import { initShotMode } from './shots.js';

const $ = (id) => document.getElementById(id);
const history = new History();
let state = defaultState();

function makeResolver(W, H) {
  return (id) => {
    if (uploads.has(id)) return uploads.get(id);
    if (SCENE_PHOTOS.includes(id)) return paintScene(id, W, H);
    return paintScene('boulevard', W, H);
  };
}

function previewDims() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
  const max = 720;
  const scale = Math.min(1, max / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function render() {
  const canvas = $('cover-canvas');
  const { w, h } = previewDims();
  renderCover(canvas, state, w, h, makeResolver(w, h));
  $('undo-btn').disabled = !history.canUndo;
  $('redo-btn').disabled = !history.canRedo;
  syncPanelControls();
}

function commit(next) {
  history.push(state);
  state = next;
  render();
}

function syncPanelControls() {
  const panel = selectedPanel(state);
  $('panel-photo').value = panel.photo;
  $('zoom-range').value = panel.zoom;
  $('panx-range').value = panel.panX;
  $('pany-range').value = panel.panY;
  $('zoom-val').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panx-val').textContent = panel.panX.toFixed(2);
  $('pany-val').textContent = panel.panY.toFixed(2);
  $('rotate-val').textContent = `${panel.rotate || 0}°`;
  $('flip-btn').textContent = panel.flip ? 'Flipped ✓' : 'Flip horizontal';
  // panel chips
  const chips = $('panel-chips');
  chips.innerHTML = '';
  const n = layoutPanelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (i === state.selected ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => {
      state = cloneState(state);
      state.selected = i;
      render();
    });
    chips.appendChild(b);
  }
  $('panel-label').textContent = `Panel ${state.selected + 1} — ${photoLabel(panel.photo)}`;
}

function rebuildPhotoOptions() {
  const sel = $('panel-photo');
  sel.innerHTML = '';
  for (const name of SCENE_PHOTOS) {
    const o = document.createElement('option');
    o.value = name;
    o.textContent = photoLabel(name);
    sel.appendChild(o);
  }
  for (const [id] of uploads) {
    const o = document.createElement('option');
    o.value = id;
    o.textContent = photoLabel(id);
    sel.appendChild(o);
  }
  sel.value = selectedPanel(state).photo;
}

function setStatus(msg) {
  $('status').textContent = msg;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportSize(size) {
  const blob = await coverBlob(state, size.w, size.h, makeResolver(size.w, size.h));
  download(blob, `vice-coast-cover-${size.id}.png`);
  setStatus(`Exported ${size.label} PNG (${(blob.size / 1024).toFixed(0)} KB)`);
  return blob;
}

function buildPicker(containerId, items, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (item.id === current ? ' active' : '');
    b.textContent = item.label;
    if (item.swatch) b.style.setProperty('--sw', item.swatch);
    b.addEventListener('click', () => onPick(item.id));
    box.appendChild(b);
  }
}

function buildAllPickers() {
  buildPicker('layout-bar', LAYOUT_ORDER.map((id) => ({ id, label: LAYOUTS[id].label })), state.layout, (id) => {
    commit(ensurePanels(setLayout(state, id)));
    setStatus(`Layout: ${LAYOUTS[id].label}`);
  });
  buildPicker('grade-bar', GRADE_ORDER.map((id) => ({
    id, label: GRADES[id].label, swatch: `linear-gradient(135deg, ${GRADES[id].title[0]}, ${GRADES[id].title[2]})`,
  })), state.grade, (id) => {
    commit({ ...cloneState(state), grade: id });
    setStatus(`Grade: ${GRADES[id].label}`);
  });
  buildPicker('preset-bar', PRESET_ORDER.map((id) => ({ id, label: PRESETS[id].label })), '', (id) => {
    commit(applyPreset(state, id));
    setStatus(`Preset applied: ${PRESETS[id].label} — one click, photo to PNG`);
  });
}

function wireInputs() {
  $('title-input').addEventListener('input', (e) => {
    state = cloneState(state);
    state.title = e.target.value;
    render();
  });
  $('title-input').addEventListener('change', () => { history.push(state); });
  $('subtitle-input').addEventListener('input', (e) => {
    state = cloneState(state);
    state.subtitle = e.target.value;
    render();
  });
  $('subtitle-input').addEventListener('change', () => { history.push(state); });
  $('badge-input').addEventListener('input', (e) => {
    state = cloneState(state);
    state.badge = e.target.value;
    render();
  });
  $('badge-input').addEventListener('change', () => { history.push(state); });
  $('stars-input').addEventListener('input', (e) => {
    state = cloneState(state);
    state.stars = Number(e.target.value);
    $('stars-val').textContent = `${state.stars} / 5`;
    render();
  });
  $('stars-input').addEventListener('change', () => { history.push(state); });
  $('title-size').addEventListener('input', (e) => {
    state = cloneState(state);
    state.titleSize = Number(e.target.value);
    render();
  });
  $('title-size').addEventListener('change', () => { history.push(state); });
  $('title-y').addEventListener('input', (e) => {
    state = cloneState(state);
    state.titleY = Number(e.target.value);
    render();
  });
  $('title-y').addEventListener('change', () => { history.push(state); });
  $('grain-toggle').addEventListener('change', (e) => {
    commit({ ...cloneState(state), grain: e.target.checked });
  });
  $('vignette-toggle').addEventListener('change', (e) => {
    commit({ ...cloneState(state), vignette: e.target.checked });
  });
  $('fillall-toggle').addEventListener('change', (e) => {
    commit({ ...cloneState(state), fillAll: e.target.checked });
  });
  $('size-select').addEventListener('change', (e) => {
    state = cloneState(state);
    state.size = e.target.value;
    render();
  });
  $('panel-photo').addEventListener('change', (e) => {
    commit(updateSelectedPanel(state, { photo: e.target.value }));
  });
  $('zoom-range').addEventListener('input', (e) => {
    state = updateSelectedPanel(state, { zoom: Number(e.target.value) });
    render();
  });
  $('zoom-range').addEventListener('change', () => { history.push(state); });
  $('panx-range').addEventListener('input', (e) => {
    state = updateSelectedPanel(state, { panX: Number(e.target.value) });
    render();
  });
  $('panx-range').addEventListener('change', () => { history.push(state); });
  $('pany-range').addEventListener('input', (e) => {
    state = updateSelectedPanel(state, { panY: Number(e.target.value) });
    render();
  });
  $('pany-range').addEventListener('change', () => { history.push(state); });
  $('rotate-btn').addEventListener('click', () => {
    commit(rotateSelected(state));
  });
  $('flip-btn').addEventListener('click', () => {
    commit(flipSelected(state));
  });
  $('reset-panel-btn').addEventListener('click', () => {
    commit(resetSelectedPanel(state));
  });
  $('undo-btn').addEventListener('click', doUndo);
  $('redo-btn').addEventListener('click', doRedo);
  $('export-btn').addEventListener('click', async () => {
    const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[0];
    await exportSize(size);
  });
  $('export-all-btn').addEventListener('click', async () => {
    for (const size of EXPORT_SIZES) {
      await exportSize(size);
      await new Promise((r) => setTimeout(r, 350));
    }
    setStatus('Exported all 4 sizes');
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      doUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      doRedo();
    }
  });
}

function doUndo() {
  const prev = history.undo(state);
  if (prev) {
    state = prev;
    buildAllPickers();
    render();
    setStatus('Undid last edit');
  }
}

function doRedo() {
  const next = history.redo(state);
  if (next) {
    state = next;
    buildAllPickers();
    render();
    setStatus('Redid edit');
  }
}

function hitPanel(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const p = rects[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function wireCanvas() {
  const canvas = $('cover-canvas');
  let drag = null;
  let wheelBurst = null;
  canvas.addEventListener('pointerdown', (e) => {
    const i = hitPanel(canvas, e.clientX, e.clientY);
    if (i < 0) return;
    canvas.setPointerCapture(e.pointerId);
    history.push(state);
    state = cloneState(state);
    state.selected = i;
    drag = { x: e.clientX, y: e.clientY, panX: selectedPanel(state).panX, panY: selectedPanel(state).panY };
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - drag.x) / rect.width;
    const dy = (e.clientY - drag.y) / rect.height;
    state = updateSelectedPanel(state, {
      panX: Math.max(-1, Math.min(1, drag.panX + dx * 1.6)),
      panY: Math.max(-1, Math.min(1, drag.panY + dy * 1.6)),
    });
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const i = hitPanel(canvas, e.clientX, e.clientY);
    if (i >= 0 && i !== state.selected) {
      state = cloneState(state);
      state.selected = i;
    }
    if (!wheelBurst) history.push(state);
    clearTimeout(wheelBurst);
    wheelBurst = setTimeout(() => { wheelBurst = null; }, 450);
    const panel = selectedPanel(state);
    const zoom = Math.max(0.5, Math.min(4, panel.zoom * (e.deltaY < 0 ? 1.12 : 0.9)));
    state = updateSelectedPanel(state, { zoom });
    render();
  }, { passive: false });

  // upload: file picker + drag & drop
  $('upload-input').addEventListener('change', async (e) => {
    await handleFiles(e.target.files);
    e.target.value = '';
  });
  const drop = $('drop-zone');
  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', async (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    await handleFiles(e.dataTransfer.files);
  });
}

async function handleFiles(files) {
  const added = await addUploads(files);
  if (!added.length) {
    setStatus('No image files in that drop — try a JPG or PNG');
    return;
  }
  rebuildPhotoOptions();
  // put the first new photo on the selected panel
  commit(updateSelectedPanel(state, { photo: added[0].id }));
  setStatus(`Loaded ${added.length} photo${added.length > 1 ? 's' : ''}: ${added.map((a) => a.name).join(', ')}`);
}

// --- boot -----------------------------------------------------------------

const shotCover = initShotMode();
if (!shotCover) {
  if (window.__shotState) state = window.__shotState;
  // seed the caption inputs from state
  $('title-input').value = state.title;
  $('subtitle-input').value = state.subtitle;
  $('badge-input').value = state.badge;
  $('stars-input').value = state.stars;
  $('stars-val').textContent = `${state.stars} / 5`;
  $('title-size').value = state.titleSize;
  $('title-y').value = state.titleY;
  $('grain-toggle').checked = state.grain;
  $('vignette-toggle').checked = state.vignette;
  $('fillall-toggle').checked = state.fillAll;
  $('size-select').value = state.size;
  buildAllPickers();
  rebuildPhotoOptions();
  wireInputs();
  wireCanvas();
  render();
  setStatus('Ready — pick a preset, or a layout and a grade, then export.');
}
