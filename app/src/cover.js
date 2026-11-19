// The cover engine: six multi-panel layouts, seven Vice City colour grades,
// and the renderer that paints a finished cover — panels, lettering, badge,
// halftone, grain and vignette — onto any canvas at any export size.
// Everything is drawn in code: no image or font files are loaded.

import { mulberry32 } from './scenes.js';

export const LAYOUTS = {
  'vice-grid': { name: 'Vice Grid', desc: 'Hero + two stacked panels' },
  nine: { name: 'Nine Panel', desc: 'Classic 3 × 3 poster grid' },
  full: { name: 'Full Bleed', desc: 'One photo, edge to edge' },
  tilted: { name: 'Tilted Snaps', desc: 'Overlapping tilted snapshots' },
  strip: { name: 'Sunset Strip', desc: 'Wide hero + three below' },
  bands: { name: 'Comic Bands', desc: 'Diagonal GTA loading-screen bands' },
};

export const GRADES = {
  sunset: { name: 'Sunset', desc: 'Orange-pink dusk', top: '#ff5e62', bottom: '#7b2ff7', tint: '#ff9a3d', swatch: 'linear-gradient(90deg,#ff9a3d,#ff2e88,#7b2ff7)' },
  neon: { name: 'Neon Night', desc: 'Pink + teal after dark', top: '#ff2e88', bottom: '#123a6b', tint: '#22e6c8', swatch: 'linear-gradient(90deg,#ff2e88,#22e6c8,#123a6b)' },
  gold: { name: 'Gold Hour', desc: 'Warm honey light', top: '#ffc93d', bottom: '#b3541e', tint: '#ffe9a8', swatch: 'linear-gradient(90deg,#ffe9a8,#ffc93d,#b3541e)' },
  teal: { name: 'Teal Vice', desc: 'Turquoise ocean grade', top: '#2ec4b6', bottom: '#0b3d5c', tint: '#7ef0e2', swatch: 'linear-gradient(90deg,#7ef0e2,#2ec4b6,#0b3d5c)' },
  magenta: { name: 'Magenta Rush', desc: 'Hot pink rush', top: '#ff2e88', bottom: '#4a00e0', tint: '#ff7ac0', swatch: 'linear-gradient(90deg,#ff7ac0,#ff2e88,#4a00e0)' },
  noir: { name: 'Noir Vice', desc: 'Moody black + gold', top: '#3a3a4d', bottom: '#0a0a12', tint: '#ffc93d', swatch: 'linear-gradient(90deg,#3a3a4d,#0a0a12,#ffc93d)' },
  dawn: { name: 'Pastel Dawn', desc: 'Soft morning pastels', top: '#ffb6d5', bottom: '#8ec5fc', tint: '#fff3c4', swatch: 'linear-gradient(90deg,#ffb6d5,#fff3c4,#8ec5fc)' },
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 · square post' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 · portrait post' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 · landscape / story wide' },
  '1080x1920': { w: 1080, h: 1920, label: '1080 × 1920 · story' },
};

export const PRESETS = [
  { name: 'Lucia Nights', layout: 'neon', grade: 'neon', title: 'LUCIA NIGHTS', subtitle: 'neon heart, vice soul', badge: 'VICE CITY • AFTER DARK' },
  { name: 'Jason Drive', layout: 'vice-grid', grade: 'sunset', title: 'JASON DRIVE', subtitle: 'one last sunset run', badge: 'VICE CITY • EST. 2026' },
  { name: 'Vice Sunset', layout: 'strip', grade: 'gold', title: 'VICE SUNSET', subtitle: 'golden hour on Ocean Drive', badge: 'LEONIDA • 2026' },
  { name: 'Neon Heat', layout: 'bands', grade: 'magenta', title: 'NEON HEAT', subtitle: 'the city never sleeps', badge: '★ ★ ★ ★ ★ WANTED' },
];

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Panel geometry for a layout. Returns { panels, title } where panels are
// { x, y, w, h, rot, frame } in cover pixels and title is the title band.
export function layoutPanels(layoutId, W, H) {
  const titleH = Math.round(H * 0.18);
  const PH = H - titleH;
  const gap = Math.max(4, Math.round(W * 0.006));
  const P = { x: 0, y: 0, w: W, h: PH };
  let panels;
  switch (layoutId) {
    case 'nine': {
      const cw = (W - gap * 2) / 3, ch = (PH - gap * 2) / 3;
      panels = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        panels.push({ x: c * (cw + gap), y: r * (ch + gap), w: cw, h: ch, rot: 0, frame: false });
      }
      break;
    }
    case 'full':
      panels = [{ ...P, rot: 0, frame: false }];
      break;
    case 'tilted': {
      panels = [
        { ...P, rot: 0, frame: false },
        { x: W * 0.06, y: PH * 0.08, w: W * 0.42, h: PH * 0.62, rot: -6, frame: true },
        { x: W * 0.5, y: PH * 0.2, w: W * 0.44, h: PH * 0.58, rot: 4, frame: true },
        { x: W * 0.28, y: PH * 0.42, w: W * 0.46, h: PH * 0.5, rot: -2, frame: true },
      ];
      break;
    }
    case 'strip': {
      const heroH = PH * 0.6, stripH = PH * 0.4 - gap;
      const sw = (W - gap * 2) / 3;
      panels = [
        { x: 0, y: 0, w: W, h: heroH, rot: 0, frame: false },
        { x: 0, y: heroH + gap, w: sw, h: stripH, rot: 0, frame: false },
        { x: sw + gap, y: heroH + gap, w: sw, h: stripH, rot: 0, frame: false },
        { x: (sw + gap) * 2, y: heroH + gap, w: sw, h: stripH, rot: 0, frame: false },
      ];
      break;
    }
    case 'bands': {
      panels = [];
      const shift = W * 0.055;
      for (let i = 0; i < 4; i++) {
        panels.push({
          x: (W / 4) * i, y: 0, w: W / 4, h: PH, rot: 0, frame: false,
          band: { shift, index: i },
        });
      }
      break;
    }
    case 'vice-grid':
    default: {
      const heroW = W * 0.62 - gap / 2;
      const rightW = W - heroW - gap;
      const halfH = (PH - gap) / 2;
      panels = [
        { x: 0, y: 0, w: heroW, h: PH, rot: 0, frame: false },
        { x: heroW + gap, y: 0, w: rightW, h: halfH, rot: 0, frame: false },
        { x: heroW + gap, y: halfH + gap, w: rightW, h: halfH, rot: 0, frame: false },
      ];
      break;
    }
  }
  return { panels, title: { x: 0, y: PH, w: W, h: titleH } };
}

export function panelCount(layoutId) {
  return layoutPanels(layoutId, 100, 100).panels.length;
}

function drawPhotoCover(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = (panel.zoom ?? 100) / 100;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base, dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + ((panel.panX ?? 0) / 100) * rect.w * 0.4;
  const dy = rect.y + (rect.h - dh) / 2 + ((panel.panY ?? 0) / 100) * rect.h * 0.4;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
  if (panel.flip) ctx.scale(-1, 1);
  ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function applyGrade(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, grade.top);
  g.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawTitleBlock(ctx, state, title, W, H, rng) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const bandH = title.h;
  // Dark band with a diagonal top edge.
  const cut = bandH * 0.28;
  ctx.fillStyle = 'rgba(12, 6, 22, 0.94)';
  ctx.beginPath();
  ctx.moveTo(0, title.y + cut);
  ctx.lineTo(W, title.y);
  ctx.lineTo(W, title.y + bandH);
  ctx.lineTo(0, title.y + bandH);
  ctx.closePath();
  ctx.fill();
  // Neon rule along the diagonal.
  const rule = ctx.createLinearGradient(0, 0, W, 0);
  rule.addColorStop(0, '#ffc93d');
  rule.addColorStop(0.5, '#ff2e88');
  rule.addColorStop(1, '#22e6c8');
  ctx.strokeStyle = rule;
  ctx.lineWidth = Math.max(2, H * 0.004);
  ctx.beginPath();
  ctx.moveTo(0, title.y + cut);
  ctx.lineTo(W, title.y);
  ctx.stroke();
  // Halftone dots fading across the band.
  if (state.effects.halftone) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 46; col++) {
        const x = W * 0.52 + col * ((W * 0.46) / 46);
        const y = title.y + bandH * 0.22 + row * bandH * 0.2;
        const r = Math.max(1, bandH * 0.028 * (1 - col / 46) + 0.6);
        ctx.fillStyle = col % 3 === 0 ? 'rgba(255,46,136,0.5)' : 'rgba(34,230,200,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const pad = W * 0.035;
  const titleSize = Math.round(bandH * 0.52 * ((state.titleSize ?? 100) / 100));
  // Measure the badge first so the subtitle never runs underneath it.
  const badge = state.badge || '';
  let badgeW = 0;
  if (badge) {
    ctx.font = `800 ${Math.round(bandH * 0.17)}px "Arial Narrow", sans-serif`;
    badgeW = ctx.measureText(badge).width + bandH * 0.5;
  }
  // Subtitle in neon script, above the title, shortened to fit.
  ctx.save();
  ctx.font = `italic 700 ${Math.round(bandH * 0.26)}px "Brush Script MT", "Segoe Script", "Comic Sans MS", cursive`;
  let subtitle = state.subtitle || '';
  const maxSub = W - pad * 2 - (badgeW ? badgeW + pad : 0);
  while (subtitle.length > 1 && ctx.measureText(subtitle).width > maxSub) {
    subtitle = subtitle.slice(0, -1);
  }
  if (subtitle !== (state.subtitle || '') && subtitle.length > 1) subtitle = subtitle.slice(0, -1).trimEnd() + '…';
  ctx.fillStyle = '#7ef0e2';
  ctx.shadowColor = '#22e6c8';
  ctx.shadowBlur = bandH * 0.12;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(subtitle, pad, title.y + bandH * 0.34);
  ctx.restore();
  // Main title: condensed heavy face, sunset gradient, dark outline, hard
  // shadow — auto-fitted so long titles never crowd the star meter.
  const titleText = (state.title || '').toUpperCase();
  const titleFont = (px) => `900 ${px}px "Arial Narrow", "Liberation Sans Narrow", "Noto Sans Condensed", sans-serif`;
  let fitSize = titleSize;
  ctx.save();
  ctx.font = titleFont(fitSize);
  try { ctx.letterSpacing = `${Math.round(fitSize * 0.02)}px`; } catch { /* older canvas */ }
  const maxTitle = W - pad * 2 - bandH * 1.2;
  while (fitSize > titleSize * 0.55 && ctx.measureText(titleText).width * 0.9 > maxTitle) {
    fitSize = Math.round(fitSize * 0.92);
    ctx.font = titleFont(fitSize);
  }
  const tg = ctx.createLinearGradient(pad, title.y, pad, title.y + bandH);
  tg.addColorStop(0, '#fff3c4');
  tg.addColorStop(0.45, '#ffc93d');
  tg.addColorStop(0.75, '#ff7e3d');
  tg.addColorStop(1, '#ff2e88');
  ctx.translate(pad, title.y + bandH * 0.88);
  ctx.scale(0.9, 1);
  ctx.shadowColor = 'rgba(255, 46, 136, 0.65)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = Math.max(2, fitSize * 0.045);
  ctx.shadowOffsetY = Math.max(2, fitSize * 0.045);
  ctx.lineWidth = Math.max(2, fitSize * 0.055);
  ctx.strokeStyle = '#160a24';
  ctx.lineJoin = 'round';
  ctx.strokeText(titleText, 0, 0);
  ctx.fillStyle = tg;
  ctx.fillText(titleText, 0, 0);
  ctx.restore();
  // Badge ribbon, tilted, top-right of the band.
  if (badge) {
    ctx.save();
    ctx.font = `800 ${Math.round(bandH * 0.17)}px "Arial Narrow", sans-serif`;
    const bw = ctx.measureText(badge).width + bandH * 0.5;
    const bh = bandH * 0.3;
    ctx.translate(W - pad - bw / 2, title.y + bandH * 0.24);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#ffc93d';
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#160a24';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, 0, 1);
    ctx.restore();
  }
  // Heat meter: five stars under the badge.
  const starR = Math.max(3, bandH * 0.09);
  const stars = state.stars ?? 5;
  for (let i = 0; i < 5; i++) {
    const x = W - pad - starR - i * starR * 2.5;
    const y = title.y + bandH * 0.62;
    starPath(ctx, x, y, starR);
    ctx.fillStyle = i < stars ? '#ffc93d' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  void rng;
  void grade;
}

// Paint the whole cover for a state at W x H.
export function renderCover(ctx, state, W, H) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const seed = hashSeed([state.layout, state.grade, state.title, state.subtitle, W, H].join('|'));
  const rng = mulberry32(seed);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, W, H);
  const { panels, title } = layoutPanels(state.layout, W, H);
  const gap = Math.max(4, Math.round(W * 0.006));
  panels.forEach((panel, i) => {
    const photo = state.photos[state.fillAll ? 0 : (state.panels[i]?.photo ?? 0)] ?? state.photos[0];
    const settings = state.panels[i] ?? {};
    ctx.save();
    if (panel.band) {
      const { shift } = panel.band;
      ctx.beginPath();
      ctx.moveTo(panel.x + shift, panel.y);
      ctx.lineTo(panel.x + panel.w + shift, panel.y);
      ctx.lineTo(panel.x + panel.w - shift, panel.y + panel.h);
      ctx.lineTo(panel.x - shift, panel.y + panel.h);
      ctx.closePath();
      ctx.clip();
      const bounds = { x: panel.x - shift, y: panel.y, w: panel.w + shift * 2, h: panel.h };
      if (photo?.img) drawPhotoCover(ctx, photo.img, bounds, settings);
      applyGrade(ctx, bounds, grade);
    } else if (panel.frame) {
      // Tilted snapshot: frame and photo rotate together, polaroid style.
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(((panel.rot || 0) * Math.PI) / 180);
      ctx.fillStyle = '#fdf6ec';
      ctx.fillRect(-panel.w / 2 - gap, -panel.h / 2 - gap, panel.w + gap * 2, panel.h + gap * 2 + gap * 4);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
      ctx.clip();
      const local = { x: -panel.w / 2, y: -panel.h / 2, w: panel.w, h: panel.h };
      if (photo?.img) drawPhotoCover(ctx, photo.img, local, { ...settings, rot: 0 });
      applyGrade(ctx, local, grade);
      ctx.restore();
      // Handwritten-style caption on the polaroid's bottom strip.
      ctx.fillStyle = '#2a2a3a';
      ctx.font = `italic 700 ${Math.max(10, gap * 3.2)}px "Brush Script MT", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.subtitle || 'vice city', 0, panel.h / 2 + gap * 2.6);
    } else {
      ctx.beginPath();
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
      ctx.clip();
      if (photo?.img) drawPhotoCover(ctx, photo.img, panel, settings);
      applyGrade(ctx, panel, grade);
    }
    ctx.restore();
    // Poster-white inner stroke on flat panels.
    if (!panel.band && !panel.frame) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, W * 0.002);
      ctx.strokeRect(panel.x + 1, panel.y + 1, panel.w - 2, panel.h - 2);
    }
  });
  // Diagonal divider strokes for the band layout.
  if (state.layout === 'bands') {
    ctx.strokeStyle = '#fdf6ec';
    ctx.lineWidth = Math.max(3, W * 0.004);
    for (let i = 1; i < 4; i++) {
      const xTop = (W / 4) * i + W * 0.055;
      const xBot = (W / 4) * i - W * 0.055;
      ctx.beginPath();
      ctx.moveTo(xTop, 0);
      ctx.lineTo(xBot, title.y);
      ctx.stroke();
    }
  }
  drawTitleBlock(ctx, state, title, W, H, rng);
  // Vignette.
  if (state.effects.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5,2,12,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  // Film grain, seeded so preview and export match.
  if (state.effects.grain) {
    const n = Math.round((W * H) / 1100);
    for (let i = 0; i < n; i++) {
      const x = rng() * W, y = rng() * H;
      ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(x, y, Math.max(1, W * 0.0012), Math.max(1, W * 0.0012));
    }
  }
}

export function exportCoverCanvas(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  renderCover(canvas.getContext('2d'), state, W, H);
  return canvas;
}
