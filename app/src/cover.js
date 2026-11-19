// Vice Coast Cover Studio — cover render engine (app/src/cover.js).
//
// Draws every cover on a <canvas> from a plain state object: layout, grade,
// export size, one photo per panel with its own crop, and the caption. All
// decoration is drawn in code — a procedural sun, palm silhouettes, a
// skyline, a halftone title band and film grain — so the app needs no
// artwork files at all. Nothing here reaches the network.

export const LAYOUTS = {
  'vice-grid': { name: 'Vice Grid', panels: 3 },
  nine: { name: 'Nine Panel', panels: 9 },
  bleed: { name: 'Full Bleed', panels: 1 },
  snaps: { name: 'Tilted Snaps', panels: 3 },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#2b2060', '#7a3078', '#e86056', '#ff9e4c', '#ffc66e'],
    wash: 'rgba(255, 110, 60, 0.20)',
    tint: 'rgba(255, 80, 120, 0.10)',
    band: '#1c1030',
    title: '#fff3d6',
    accent: '#ffcf4d',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#05061f', '#101442', '#2c1854', '#3d1e6e'],
    wash: 'rgba(60, 120, 255, 0.22)',
    tint: 'rgba(255, 40, 180, 0.12)',
    band: '#0a0618',
    title: '#eafcff',
    accent: '#39e6ff',
  },
  gold: {
    name: 'Gold Hour',
    sky: ['#3a2410', '#8a4a1e', '#d97b2e', '#ffb347', '#ffe08a'],
    wash: 'rgba(255, 170, 40, 0.20)',
    tint: 'rgba(255, 200, 90, 0.10)',
    band: '#241206',
    title: '#fff8e0',
    accent: '#ffd34d',
  },
  teal: {
    name: 'Teal Vice',
    sky: ['#062a33', '#0a4a52', '#12808a', '#2bc4b0'],
    wash: 'rgba(40, 220, 200, 0.18)',
    tint: 'rgba(20, 160, 200, 0.12)',
    band: '#04222a',
    title: '#eafff8',
    accent: '#5cf2c8',
  },
  noir: {
    name: 'Noir',
    sky: ['#0a0a0c', '#1a1a20', '#33333c', '#55555f'],
    wash: 'rgba(255, 255, 255, 0.10)',
    tint: 'rgba(0, 0, 0, 0.22)',
    band: '#0b0b0e',
    title: '#f5f5f0',
    accent: '#e8e8e0',
  },
};

export const SIZES = {
  '1080x1080': { name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  '1080x1350': { name: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  '1920x1080': { name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export const SAMPLE_PHOTOS = [
  { id: 'sunset-drive', name: 'Sunset Drive', src: './samples/sunset-drive.jpg' },
  { id: 'neon-street', name: 'Neon Street', src: './samples/neon-street.jpg' },
];

export function freshState() {
  return {
    layout: 'vice-grid',
    grade: 'sunset',
    size: '1920x1080',
    caption: {
      title: 'VICE COAST',
      subtitle: 'one last ride',
      badge: 'VICE CITY',
      stars: 4,
      titleSize: 100,
    },
    effects: { grain: true, sun: true, palms: true, skyline: true, halftone: true },
    panels: [
      { photoId: 'sunset-drive', zoom: 1.0, panX: 0, panY: 0 },
      { photoId: 'neon-street', zoom: 1.0, panX: 0, panY: 0 },
      { photoId: 'sunset-drive', zoom: 1.15, panX: 0, panY: 0 },
    ],
  };
}

export function panelCount(layout) {
  return LAYOUTS[layout]?.panels ?? 3;
}

// Keep the panel list the length the layout needs, preserving each panel's
// photo and crop where a panel survives the switch.
export function fitPanelsToLayout(state) {
  const want = panelCount(state.layout);
  const next = state.panels.slice(0, want);
  while (next.length < want) {
    const donor = state.panels[next.length % Math.max(1, state.panels.length)] || {
      photoId: 'sunset-drive',
      zoom: 1,
      panX: 0,
      panY: 0,
    };
    next.push({ ...donor });
  }
  state.panels = next;
}

// Panel rectangles in normalised canvas coordinates (0..1), plus rotation.
// The title band owns the bottom strip; panels live above it.
export function layoutPanels(layout) {
  if (layout === 'nine') {
    const cells = [];
    const gap = 0.014;
    const top = 0.02;
    const areaH = 0.8;
    const cw = (0.96 - gap * 2) / 3;
    const ch = (areaH - gap * 2) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push({
          x: 0.02 + c * (cw + gap),
          y: top + r * (ch + gap),
          w: cw,
          h: ch,
          rot: 0,
        });
      }
    }
    return cells;
  }
  if (layout === 'bleed') {
    return [{ x: 0, y: 0, w: 1, h: 0.86, rot: 0 }];
  }
  if (layout === 'snaps') {
    return [
      { x: 0.045, y: 0.05, w: 0.42, h: 0.62, rot: -0.1 },
      { x: 0.32, y: 0.1, w: 0.42, h: 0.62, rot: 0.055 },
      { x: 0.58, y: 0.05, w: 0.4, h: 0.62, rot: -0.035 },
    ];
  }
  // vice-grid: hero on top, two below.
  return [
    { x: 0.02, y: 0.02, w: 0.96, h: 0.53, rot: 0 },
    { x: 0.02, y: 0.575, w: 0.47, h: 0.245, rot: 0 },
    { x: 0.51, y: 0.575, w: 0.47, h: 0.245, rot: 0 },
  ];
}

// --- procedural decoration ------------------------------------------------

function drawSun(ctx, w, h, grade, state) {
  // In the nine-panel layout the panels cover the sky, so the glow behind
  // them would only leak through the gutters as a stray wedge; the overlay
  // sun (drawSunOverlay) still provides the disc there.
  if (!state.effects.sun || state.layout === 'nine') return;
  const cx = w * 0.78;
  const cy = h * 0.3;
  const r = Math.min(w, h) * 0.13;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 3.2);
  glow.addColorStop(0, 'rgba(255, 214, 130, 0.55)');
  glow.addColorStop(0.5, 'rgba(255, 140, 90, 0.18)');
  glow.addColorStop(1, 'rgba(255, 140, 90, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe9a3');
  disc.addColorStop(0.55, '#ffb347');
  disc.addColorStop(1, '#ff5f6d');
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Retro slats cut across the lower half of the disc.
  ctx.fillStyle = grade.band;
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.08 + i * 0.22);
    ctx.fillRect(cx - r, y, r * 2, r * 0.045 * (1 + i * 0.5));
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - s * 0.6, x + lean, y - s);
  ctx.lineWidth = Math.max(3, s * 0.035);
  ctx.stroke();
  const tx = x + lean;
  const ty = y - s;
  // Fronds fan out across the top and droop at the tips, each with leaflets.
  for (let k = 0; k < 7; k++) {
    const theta = Math.PI * (-0.94 + k * 0.15);
    const len = s * (0.36 + 0.07 * Math.sin(k * 2.3));
    const fx = tx + Math.cos(theta) * len;
    const fy = ty + Math.sin(theta) * len * 0.55 + len * 0.38;
    const mx = tx + Math.cos(theta) * len * 0.55;
    const my = ty + Math.sin(theta) * len * 0.55 - len * 0.22;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, fx, fy);
    ctx.lineWidth = Math.max(2, s * 0.022);
    ctx.stroke();
    for (let j = 1; j <= 3; j++) {
      const t = j / 4;
      const bx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * mx + t * t * fx;
      const by = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * my + t * t * fy;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + len * 0.07, by + len * 0.12);
      ctx.lineWidth = Math.max(1, s * 0.012);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// The graphic sun: a retro disc with slats, layered over the poster's top
// right like a sticker, so it reads even where photos fill the panels.
function drawSunOverlay(ctx, w, h, grade, state) {
  if (!state.effects.sun) return;
  const cx = w * 0.86;
  const cy = h * 0.13;
  const r = Math.min(w, h) * 0.085;
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 3);
  glow.addColorStop(0, 'rgba(255, 214, 130, 0.5)');
  glow.addColorStop(1, 'rgba(255, 140, 90, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe9a3');
  disc.addColorStop(0.55, '#ffb347');
  disc.addColorStop(1, '#ff5f6d');
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = grade.band;
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.12 + i * 0.26);
    ctx.fillRect(cx - r, y, r * 2, r * 0.05 * (1 + i * 0.5));
  }
  ctx.restore();
}

function drawPalms(ctx, w, h, grade) {
  const col = 'rgba(12, 6, 20, 0.92)';
  drawPalm(ctx, w * 0.02, h * 0.86, h * 0.34, w * 0.02, col);
  drawPalm(ctx, w * 0.99, h * 0.86, h * 0.28, -w * 0.015, col);
  drawPalm(ctx, w * 0.12, h * 0.87, h * 0.18, w * 0.008, col);
}

function drawSkyline(ctx, w, h, grade) {
  const base = h * 0.86;
  const col = 'rgba(10, 5, 18, 0.85)';
  // Deterministic skyline: heights come from a fixed table, not Math.random,
  // so two renders of the same state are byte-identical.
  const heights = [0.5, 0.8, 0.62, 0.95, 0.7, 1.0, 0.58, 0.85, 0.66, 0.9, 0.55, 0.78];
  const bw = w / heights.length;
  ctx.save();
  ctx.fillStyle = col;
  heights.forEach((f, i) => {
    const bh = h * 0.085 * f;
    ctx.fillRect(i * bw, base - bh, bw * 0.88, bh);
    if (i % 3 === 1) ctx.fillRect(i * bw + bw * 0.3, base - bh - h * 0.012, bw * 0.28, h * 0.012);
  });
  // Lit windows.
  ctx.fillStyle = grade.accent;
  ctx.globalAlpha = 0.85;
  heights.forEach((f, i) => {
    const bh = h * 0.085 * f;
    const rows = Math.max(1, Math.floor(bh / (h * 0.02)));
    for (let r = 0; r < rows; r++) {
      if ((i * 7 + r * 3) % 4 === 0) {
        ctx.fillRect(i * bw + bw * 0.2, base - bh + r * h * 0.02, bw * 0.12, h * 0.008);
      }
    }
  });
  ctx.restore();
}

function drawHalftone(ctx, w, y, h, color) {
  const step = Math.max(10, w * 0.012);
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += step) {
    const rowT = (yy - y) / h;
    for (let xx = step / 2; xx < w; xx += step) {
      const r = step * 0.32 * (0.4 + rowT);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

let grainTile = null;
function grainPattern(ctx) {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 128;
  t.height = 128;
  const tc = t.getContext('2d');
  const img = tc.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 20);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tc.putImageData(img, 0, 0);
  grainTile = ctx.createPattern(t, 'repeat');
  return grainTile;
}

function drawGrain(ctx, w, h) {
  const pat = grainPattern(ctx);
  if (!pat) return;
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// --- photos ----------------------------------------------------------------

function drawPhotoInto(ctx, img, rect, panel) {
  const { x, y, w, h } = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const cover = Math.max(w / iw, h / ih) * (panel.zoom || 1);
  const dw = iw * cover;
  const dh = ih * cover;
  const dx = x + (w - dw) / 2 + (panel.panX || 0) * w * 0.4;
  const dy = y + (h - dh) / 2 + (panel.panY || 0) * h * 0.4;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPanelBorder(ctx, rect, w) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// --- caption ----------------------------------------------------------------

function drawStars(ctx, cx, y, size, count, color) {
  ctx.save();
  ctx.fillStyle = color;
  const gap = size * 1.5;
  const startX = cx - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    const x = startX + i * gap;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (Math.PI / 5) * k - Math.PI / 2;
      const r = k % 2 === 0 ? size : size * 0.45;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCaption(ctx, w, h, grade, state) {
  const bandH = h * 0.14;
  const bandY = h - bandH;
  const cap = state.caption;
  ctx.save();
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandY, w, bandH);
  if (state.effects.halftone) {
    ctx.globalAlpha = 0.16;
    drawHalftone(ctx, w, bandY, bandH * 0.5, grade.accent);
    ctx.globalAlpha = 1;
  }
  // Badge pill, top-left of the band.
  const badgePad = w * 0.012;
  ctx.font = `700 ${Math.round(h * 0.026)}px Anton, sans-serif`;
  const badgeW = ctx.measureText(cap.badge).width + badgePad * 2.4;
  const badgeH = h * 0.045;
  const badgeX = w * 0.02;
  const badgeY = bandY + h * 0.018;
  ctx.fillStyle = grade.accent;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.fillStyle = grade.band;
  ctx.textBaseline = 'middle';
  ctx.fillText(cap.badge, badgeX + badgePad * 1.2, badgeY + badgeH / 2 + 1);
  // Heat stars, top-right of the band.
  if (cap.stars > 0) {
    drawStars(ctx, w * 0.93, badgeY + badgeH / 2, h * 0.014, cap.stars, grade.accent);
  }
  // Title: Anton, uppercase, with a hard offset shadow.
  const titleSize = (h * 0.062 * cap.titleSize) / 100;
  ctx.font = `${Math.round(titleSize)}px Anton, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const titleY = bandY + bandH * 0.78;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillText(cap.title.toUpperCase(), w * 0.02 + titleSize * 0.045, titleY + titleSize * 0.045);
  ctx.fillStyle = grade.title;
  ctx.fillText(cap.title.toUpperCase(), w * 0.02, titleY);
  // Subtitle: Pacifico script, tucked under the title's right side.
  const titleW = ctx.measureText(cap.title.toUpperCase()).width;
  ctx.font = `${Math.round(h * 0.03)}px Pacifico, cursive`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(cap.subtitle, w * 0.02 + titleW + w * 0.02, titleY - titleSize * 0.12);
  ctx.restore();
}

// --- main render ------------------------------------------------------------

// Render the cover described by `state` onto `ctx` at pixel size w x h.
// `photos` maps photoId -> HTMLImageElement (already loaded).
export function renderCover(ctx, w, h, state, photos) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  fitPanelsToLayout(state);
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  drawSun(ctx, w, h, grade, state);
  if (state.effects.skyline) drawSkyline(ctx, w, h, grade);
  // Panels.
  const rects = layoutPanels(state.layout).map((r) => ({
    x: r.x * w,
    y: r.y * h,
    w: r.w * w,
    h: r.h * h,
    rot: r.rot,
  }));
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const img = photos[panel.photoId];
    ctx.save();
    ctx.beginPath();
    if (rect.rot) {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(rect.rot);
      ctx.translate(-cx, -cy);
    }
    if (state.layout === 'snaps') {
      // Polaroid frame: white border with a wider foot.
      ctx.fillStyle = '#fdfdf8';
      ctx.fillRect(rect.x - w * 0.008, rect.y - h * 0.008, rect.w + w * 0.016, rect.h + h * 0.05);
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    } else {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      drawPhotoInto(ctx, img, rect, panel);
    } else {
      const ph = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      ph.addColorStop(0, '#3a2a55');
      ph.addColorStop(1, '#12081f');
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.round(h * 0.022)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.textAlign = 'left';
    }
    // Grade wash over the photo.
    ctx.fillStyle = grade.wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    if (state.layout !== 'snaps') drawPanelBorder(ctx, rect, w);
  });
  if (state.effects.palms && state.layout !== 'nine') drawPalms(ctx, w, h, grade);
  drawSunOverlay(ctx, w, h, grade, state);
  drawCaption(ctx, w, h, grade, state);
  if (state.effects.grain) drawGrain(ctx, w, h);
}

// Render to a fresh offscreen canvas at the state's export size and return it.
export function exportCanvas(state, photos) {
  const size = SIZES[state.size] || SIZES['1920x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state, photos);
  return canvas;
}

// Hit-test a point in preview-canvas pixels against the panel rects.
export function hitPanel(state, px, py, cw, ch) {
  const rects = layoutPanels(state.layout);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = (r.x + r.w / 2) * cw;
    const cy = (r.y + r.h / 2) * ch;
    let dx = px - cx;
    let dy = py - cy;
    if (r.rot) {
      const cos = Math.cos(-r.rot);
      const sin = Math.sin(-r.rot);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }
    if (Math.abs(dx) <= (r.w * cw) / 2 && Math.abs(dy) <= (r.h * ch) / 2) return i;
  }
  return -1;
}
