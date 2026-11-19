// Cover geometry, colour grades, renderer and PNG export.
// Layouts are panel rects in normalised cover space (0..1). A panel may
// carry `rot` (degrees, for Tilted Snaps) or `clip` (polygon points, for
// Comic Bands). The renderer draws each panel's photo/scene, grades the
// whole cover, then paints the GTA-style title block on top.

export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid', panels: 3,
    rects: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 0.5, h: 0.38 },
      { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
    ],
  },
  'nine-panel': {
    label: 'Nine Panel', panels: 9,
    rects: Array.from({ length: 9 }, (_, i) => ({
      x: (i % 3) / 3, y: Math.floor(i / 3) / 3, w: 1 / 3, h: 1 / 3,
    })),
  },
  'full-bleed': {
    label: 'Full Bleed', panels: 1,
    rects: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  'tilted-snaps': {
    label: 'Tilted Snaps', panels: 3,
    rects: [
      { x: 0.04, y: 0.06, w: 0.44, h: 0.6, rot: -6 },
      { x: 0.3, y: 0.3, w: 0.44, h: 0.6, rot: 3 },
      { x: 0.56, y: 0.08, w: 0.4, h: 0.58, rot: 7 },
    ],
  },
  'sunset-strip': {
    label: 'Sunset Strip', panels: 4,
    rects: [
      { x: 0, y: 0, w: 1, h: 0.55 },
      { x: 0, y: 0.55, w: 1 / 3, h: 0.45 },
      { x: 1 / 3, y: 0.55, w: 1 / 3, h: 0.45 },
      { x: 2 / 3, y: 0.55, w: 1 / 3, h: 0.45 },
    ],
  },
  'comic-bands': {
    label: 'Comic Bands', panels: 3,
    rects: [
      { x: 0, y: 0, w: 1, h: 0.42, clip: [[0, 0], [1, 0], [1, 0.3], [0, 0.42]] },
      { x: 0, y: 0.3, w: 1, h: 0.42, clip: [[0, 0.42], [1, 0.3], [1, 0.6], [0, 0.72]] },
      { x: 0, y: 0.6, w: 1, h: 0.4, clip: [[0, 0.72], [1, 0.6], [1, 1], [0, 1]] },
    ],
  },
};

export const LAYOUT_ORDER = ['vice-grid', 'nine-panel', 'full-bleed', 'tilted-snaps', 'sunset-strip', 'comic-bands'];

// Gradient-map / duotone grades: a wash gradient plus shadow + highlight
// tints applied with multiply / screen, and a saturate/contrast filter.
export const GRADES = {
  sunset: {
    label: 'Sunset', sat: 1.25, con: 1.08,
    wash: [[0, 'rgba(255,94,120,0.10)'], [0.55, 'rgba(255,140,60,0.06)'], [1, 'rgba(120,40,180,0.12)']],
    shadow: 'rgba(60,10,90,0.20)', highlight: 'rgba(255,200,110,0.16)',
    title: ['#ffe259', '#ffa751', '#ff5e78', '#c86bff'],
  },
  'neon-night': {
    label: 'Neon Night', sat: 1.35, con: 1.12,
    wash: [[0, 'rgba(34,211,238,0.12)'], [0.5, 'rgba(255,46,136,0.08)'], [1, 'rgba(80,20,160,0.20)']],
    shadow: 'rgba(5,5,40,0.28)', highlight: 'rgba(120,240,255,0.14)',
    title: ['#7ef9ff', '#22d3ee', '#ff2e88', '#b537f2'],
  },
  'gold-hour': {
    label: 'Gold Hour', sat: 1.3, con: 1.06,
    wash: [[0, 'rgba(255,210,90,0.14)'], [1, 'rgba(200,90,20,0.14)']],
    shadow: 'rgba(80,40,0,0.18)', highlight: 'rgba(255,230,150,0.2)',
    title: ['#fff3b0', '#ffd166', '#ff9f1c', '#ff6b35'],
  },
  'teal-vice': {
    label: 'Teal Vice', sat: 1.3, con: 1.07,
    wash: [[0, 'rgba(45,212,191,0.14)'], [1, 'rgba(10,60,90,0.18)']],
    shadow: 'rgba(0,40,60,0.22)', highlight: 'rgba(150,255,230,0.14)',
    title: ['#c8fff4', '#5eead4', '#2dd4bf', '#0ea5e9'],
  },
  'magenta-rush': {
    label: 'Magenta Rush', sat: 1.4, con: 1.1,
    wash: [[0, 'rgba(255,0,128,0.16)'], [0.5, 'rgba(180,0,255,0.08)'], [1, 'rgba(255,80,180,0.14)']],
    shadow: 'rgba(70,0,60,0.24)', highlight: 'rgba(255,150,220,0.16)',
    title: ['#ffd6f2', '#ff5ec4', '#e0218a', '#7b2ff7'],
  },
  'noir-vice': {
    label: 'Noir Vice', sat: 0.55, con: 1.22,
    wash: [[0, 'rgba(255,255,255,0.05)'], [1, 'rgba(0,0,0,0.22)']],
    shadow: 'rgba(0,0,0,0.3)', highlight: 'rgba(255,255,255,0.1)',
    title: ['#ffffff', '#e8e8e8', '#bdbdbd', '#7a7a7a'],
  },
  'pastel-dawn': {
    label: 'Pastel Dawn', sat: 1.05, con: 0.96,
    wash: [[0, 'rgba(255,190,220,0.16)'], [0.5, 'rgba(190,220,255,0.10)'], [1, 'rgba(255,230,180,0.12)']],
    shadow: 'rgba(120,80,140,0.1)', highlight: 'rgba(255,255,255,0.18)',
    title: ['#fff7ae', '#ffb3d9', '#a5b4fc', '#7dd3fc'],
  },
};

export const GRADE_ORDER = ['sunset', 'neon-night', 'gold-hour', 'teal-vice', 'magenta-rush', 'noir-vice', 'pastel-dawn'];

export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1920', label: 'Story 1080 × 1920', w: 1080, h: 1920 },
];

export const PRESETS = {
  'lucia-nights': { label: 'Lucia Nights', layout: 'tilted-snaps', grade: 'neon-night', title: 'LUCIA', subtitle: 'nights in Vice City' },
  'jason-drive': { label: 'Jason Drive', layout: 'sunset-strip', grade: 'gold-hour', title: 'JASON DRIVE', subtitle: 'one last job on the coast' },
  'vice-sunset': { label: 'Vice Sunset', layout: 'vice-grid', grade: 'sunset', title: 'VICE SUNSET', subtitle: 'a Lucia & Jason story' },
  'neon-heat': { label: 'Neon Heat', layout: 'comic-bands', grade: 'magenta-rush', title: 'NEON HEAT', subtitle: 'the city never sleeps' },
};

export const PRESET_ORDER = ['lucia-nights', 'jason-drive', 'vice-sunset', 'neon-heat'];

export const TITLE_FONT = '"Arial Narrow", "Liberation Sans Narrow", "Noto Sans Condensed", sans-serif';
export const SCRIPT_FONT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';

const GAP = 0.012; // panel gap, normalised

function panelPx(rect, W, H) {
  return {
    x: rect.x * W + (rect.x > 0 ? GAP * W / 2 : 0),
    y: rect.y * H + (rect.y > 0 ? GAP * H / 2 : 0),
    w: rect.w * W - (rect.x > 0 ? GAP * W / 2 : 0) - (rect.x + rect.w < 1 ? GAP * W / 2 : 0),
    h: rect.h * H - (rect.y > 0 ? GAP * H / 2 : 0) - (rect.y + rect.h < 1 ? GAP * H / 2 : 0),
  };
}

// Draw one panel image with cover-fit, pan/zoom/rotate/flip.
function drawPanelImage(ctx, img, rect, W, H, panel) {
  const p = panelPx(rect, W, H);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  ctx.save();
  ctx.beginPath();
  if (rect.clip) {
    ctx.moveTo(rect.clip[0][0] * W, rect.clip[0][1] * H);
    for (let i = 1; i < rect.clip.length; i++) ctx.lineTo(rect.clip[i][0] * W, rect.clip[i][1] * H);
    ctx.closePath();
  } else {
    ctx.rect(p.x, p.y, p.w, p.h);
  }
  ctx.clip();
  // tilted snaps get a white polaroid border
  if (rect.rot) {
    ctx.translate(cx, cy);
    ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(-p.w / 2 - 8, -p.h / 2 - 8, p.w + 16, p.h + 16);
    ctx.translate(-cx, -cy);
  }
  ctx.translate(cx, cy);
  if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
  if (panel.flip) ctx.scale(-1, 1);
  const zoom = panel.zoom || 1;
  const cover = Math.max(p.w / img.width, p.h / img.height) * zoom;
  ctx.translate((panel.panX || 0) * p.w * 0.4, (panel.panY || 0) * p.h * 0.4);
  ctx.drawImage(img, (-img.width * cover) / 2, (-img.height * cover) / 2, img.width * cover, img.height * cover);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, basePx) {
  let px = basePx;
  ctx.font = `900 ${px}px ${TITLE_FONT}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px *= 0.92;
    ctx.font = `900 ${px}px ${TITLE_FONT}`;
  }
  return px;
}

function star(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = '#ffd166';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255,209,102,0.85)';
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.stroke();
  }
}

// Seeded grain so every export of the same state is byte-identical.
function grain(ctx, W, H) {
  let a = 1337;
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const count = Math.floor((W * H) / 900);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.restore();
}

function halftone(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(7, w / 46);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = step * 0.16 * (1 + 0.5 * Math.sin(col * 0.7 + row));
      ctx.beginPath();
      ctx.arc(x + col * step + (row % 2 ? step / 2 : 0), y + row * step, Math.max(0.8, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, W, H, state, grade) {
  const titleY = H * (0.62 + (state.titleY ?? 0.2) * 0.3); // 0.62..0.92 of height
  const bandH = H * 0.34;
  const bandY = Math.max(0, titleY - bandH * 0.55);
  // legibility scrim
  const scrim = ctx.createLinearGradient(0, bandY - H * 0.06, 0, H);
  scrim.addColorStop(0, 'rgba(8,4,18,0)');
  scrim.addColorStop(0.45, 'rgba(8,4,18,0.55)');
  scrim.addColorStop(1, 'rgba(8,4,18,0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - H * 0.06, W, H - bandY + H * 0.06);
  // halftone strip across the title band
  halftone(ctx, W * 0.03, bandY + H * 0.01, W * 0.94, H * 0.05, 'rgba(255,255,255,0.13)');
  // badge ribbon
  const badge = (state.badge || '').trim();
  if (badge) {
    ctx.save();
    ctx.translate(W * 0.5, bandY + H * 0.055);
    ctx.rotate(-0.02);
    ctx.font = `900 ${Math.round(H * 0.016)}px ${TITLE_FONT}`;
    const bw = ctx.measureText(badge).width + W * 0.05;
    const bh = H * 0.032;
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -bh / 2);
    ctx.lineTo(bw / 2, -bh / 2);
    ctx.lineTo(bw / 2 + bh * 0.5, 0);
    ctx.lineTo(bw / 2, bh / 2);
    ctx.lineTo(-bw / 2, bh / 2);
    ctx.lineTo(-bw / 2 - bh * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, 1);
    ctx.restore();
  }
  // main title: gradient fill, dark outline, hard offset shadow, vertical squash
  const title = (state.title || 'VICE COAST').toUpperCase();
  const basePx = H * 0.115 * (state.titleSize ?? 1);
  const maxW = W * 0.92;
  const px = fitFont(ctx, title, maxW, basePx);
  const ty = bandY + H * 0.155;
  const grad = ctx.createLinearGradient(0, ty - px * 0.7, 0, ty + px * 0.25);
  grade.title.forEach((c, i) => grad.addColorStop(i / (grade.title.length - 1), c));
  ctx.save();
  ctx.translate(W / 2, ty);
  ctx.scale(1, 0.82);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${px}px ${TITLE_FONT}`;
  // hard offset shadow
  ctx.fillStyle = 'rgba(10,2,24,0.85)';
  ctx.fillText(title, px * 0.045, px * 0.06);
  // outline
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a2e';
  ctx.lineWidth = px * 0.055;
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  // neon script subtitle
  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    ctx.save();
    ctx.font = `italic 700 ${Math.round(H * 0.034)}px ${SCRIPT_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = H * 0.018;
    ctx.fillStyle = '#fff';
    ctx.fillText(subtitle, W / 2, ty + px * 0.62);
    ctx.restore();
  }
  // 5-star heat meter
  const stars = Math.max(0, Math.min(5, state.stars ?? 5));
  const sr = H * 0.016;
  const total = 5 * sr * 2.4;
  const sx = W / 2 - total / 2 + sr * 1.2;
  const sy = ty + px * 0.62 + H * 0.045;
  for (let i = 0; i < 5; i++) {
    star(ctx, sx + i * sr * 2.4, sy, sr, i < stars);
  }
}

function applyGrade(ctx, W, H, grade) {
  // saturate / contrast via a filtered self-copy
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.filter = `saturate(${grade.sat}) contrast(${grade.con})`;
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
  // wash gradient
  const wg = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of grade.wash) wg.addColorStop(at, color);
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, H);
  // shadow + highlight tints
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.shadow;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = grade.highlight;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Render the cover described by `state` onto `canvas` (sized W x H).
// resolvePhoto(photoId) -> canvas | HTMLImageElement | null.
export function renderCover(canvas, state, W, H, resolvePhoto) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS[state.layout] || LAYOUTS['vice-grid'];
  const grade = GRADES[state.grade] || GRADES.sunset;
  // base
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, W, H);
  layout.rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    let photoId = panel.photo || 'boulevard';
    if (state.fillAll && state.panels[0] && state.panels[0].photo) photoId = state.panels[0].photo;
    const img = resolvePhoto(photoId);
    if (!img) return;
    drawPanelImage(ctx, img, rect, W, H, panel);
  });
  // panel dividers for comic bands
  if (state.layout === 'comic-bands') {
    ctx.save();
    ctx.strokeStyle = '#0d0518';
    ctx.lineWidth = Math.max(3, H * 0.006);
    ctx.beginPath();
    ctx.moveTo(0, H * 0.42);
    ctx.lineTo(W, H * 0.3);
    ctx.moveTo(0, H * 0.72);
    ctx.lineTo(W, H * 0.6);
    ctx.stroke();
    ctx.restore();
  }
  applyGrade(ctx, W, H, grade);
  drawTitleBlock(ctx, W, H, state, grade);
  if (state.vignette !== false) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,0,15,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain !== false) grain(ctx, W, H);
  return canvas;
}

export function renderCoverToCanvas(state, W, H, resolvePhoto) {
  return renderCover(document.createElement('canvas'), state, W, H, resolvePhoto);
}

export function coverBlob(state, W, H, resolvePhoto) {
  return new Promise((resolve, reject) => {
    const canvas = renderCoverToCanvas(state, W, H, resolvePhoto);
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export failed'))), 'image/png');
  });
}

export function layoutPanelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS['vice-grid']).panels;
}

export function panelRects(layout, W, H) {
  return (LAYOUTS[layout] || LAYOUTS['vice-grid']).rects.map((r) => panelPx(r, W, H));
}
