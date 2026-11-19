// Procedural Vice City scene painters — every pixel is drawn in code.
// No binary sample images: the four sample scenes are painted on canvas
// (Boulevard Sunset, Neon Street, Pier Day, Rooftop Dusk) so the repo stays
// text-only and the cover maker works with zero assets.

// Deterministic PRNG so a scene paints the same way every time.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SCENE_NAMES = ['boulevard', 'neon', 'pier', 'rooftop'];
export const SCENE_LABELS = {
  boulevard: 'Boulevard Sunset',
  neon: 'Neon Street',
  pier: 'Pier Day',
  rooftop: 'Rooftop Dusk',
};

function vgrad(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function glowSun(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.6);
  g.addColorStop(0, halo);
  g.addColorStop(0.45, halo.replace(/[\d.]+\)$/, '0.35)'));
  g.addColorStop(1, halo.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function skyline(ctx, w, h, baseY, minH, maxH, color, seed, lit) {
  const rnd = mulberry32(seed);
  let x = -w * 0.02;
  ctx.fillStyle = color;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rnd() * 0.075);
    const bh = minH + rnd() * (maxH - minH);
    const by = baseY - bh;
    ctx.fillRect(x, by, bw, bh);
    // rooftop antenna / water tower on some buildings
    if (rnd() < 0.3) {
      ctx.fillRect(x + bw * 0.45, by - bh * 0.22, bw * 0.08, bh * 0.22);
    }
    if (lit) {
      ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
      const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
      const rows = Math.max(1, Math.floor(bh / (h * 0.045)));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rnd() < 0.28) {
            ctx.fillRect(x + bw * 0.14 + c * (bw * 0.8 / cols), by + bh * 0.1 + r * (bh * 0.85 / rows), w * 0.008, h * 0.016);
          }
        }
      }
      ctx.fillStyle = color;
    }
    x += bw + w * 0.008;
  }
}

function palm(ctx, x, y, s, color, lean) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = 'round';
  // curved trunk
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.35, y - s * 0.55, x + lean * s * 0.5, y - s);
  ctx.stroke();
  const topX = x + lean * s * 0.5;
  const topY = y - s;
  // fronds
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.08) - (i / 6) * Math.PI * 0.84 + (lean > 0 ? 0.15 : -0.15);
    const len = s * (0.42 + (i % 2) * 0.08);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.6 - s * 0.12,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len + s * 0.22,
    );
    ctx.lineWidth = Math.max(1.5, s * 0.02);
    ctx.stroke();
  }
  // coconuts
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.03, s * 0.035, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.04, topY + s * 0.05, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
}

function convertible(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // low wide body
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.lineTo(-78, -16);
  ctx.lineTo(-30, -20);
  ctx.lineTo(10, -20);
  ctx.lineTo(42, -6);
  ctx.lineTo(88, -4);
  ctx.lineTo(92, 0);
  ctx.closePath();
  ctx.fill();
  // cabin / windshield
  ctx.beginPath();
  ctx.moveTo(-58, -18);
  ctx.lineTo(-46, -34);
  ctx.lineTo(6, -34);
  ctx.lineTo(16, -18);
  ctx.closePath();
  ctx.fill();
  // driver silhouette
  ctx.beginPath();
  ctx.arc(-18, -40, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-26, -34, 16, 14);
  // wheels
  ctx.beginPath();
  ctx.arc(-58, 2, 13, 0, Math.PI * 2);
  ctx.arc(58, 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(-58, 2, 5, 0, Math.PI * 2);
  ctx.arc(58, 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function neonSign(ctx, x, y, w, h, text, color, fontPx) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.font = `900 ${fontPx}px "Arial Narrow", "Liberation Sans Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

// --- Scenes ---------------------------------------------------------------

function paintBoulevard(ctx, w, h) {
  vgrad(ctx, w, h, [
    [0, '#2b1055'], [0.32, '#7597de'], [0.52, '#ff7e5f'], [0.68, '#feb47b'], [1, '#ff9a5a'],
  ]);
  glowSun(ctx, w * 0.62, h * 0.52, h * 0.085, '#fff3c4', 'rgba(255, 190, 90, 0.9)');
  // sun stripes (synthwave slats)
  ctx.fillStyle = 'rgba(255, 126, 95, 0.9)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(w * 0.52, h * (0.52 + 0.02 + i * 0.022), h * 0.17, h * 0.006);
  }
  skyline(ctx, w, h, h * 0.62, h * 0.05, h * 0.2, '#3a1c5e', 41, false);
  skyline(ctx, w, h, h * 0.66, h * 0.03, h * 0.1, '#241040', 97, false);
  // road
  ctx.fillStyle = '#1c1030';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.34, h * 0.66);
  ctx.lineTo(w * 0.66, h * 0.66);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // lane dashes in perspective
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const y = h * (0.68 + t * 0.3);
    const lw = w * (0.004 + t * 0.012);
    ctx.fillRect(w * 0.5 - lw / 2, y, lw, h * (0.012 + t * 0.02));
  }
  // sun reflection streak on the road
  const rg = ctx.createLinearGradient(0, h * 0.66, 0, h);
  rg.addColorStop(0, 'rgba(255, 190, 90, 0.5)');
  rg.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(w * 0.56, h * 0.66);
  ctx.lineTo(w * 0.68, h * 0.66);
  ctx.lineTo(w * 0.86, h);
  ctx.lineTo(w * 0.42, h);
  ctx.closePath();
  ctx.fill();
  // palms frame the road
  palm(ctx, w * 0.1, h * 0.98, h * 0.34, '#160a26', 1);
  palm(ctx, w * 0.9, h * 0.98, h * 0.3, '#160a26', -1);
  palm(ctx, w * 0.24, h * 0.78, h * 0.2, '#1d0d33', 1);
  palm(ctx, w * 0.78, h * 0.8, h * 0.18, '#1d0d33', -1);
  // hero convertible, centre-bottom
  convertible(ctx, w * 0.5, h * 0.93, w * 0.0016, '#12081f');
  // birds
  ctx.strokeStyle = 'rgba(30,10,50,0.8)';
  ctx.lineWidth = Math.max(1.5, h * 0.002);
  for (const [bx, by, bs] of [[0.2, 0.16, 0.02], [0.3, 0.12, 0.016], [0.78, 0.2, 0.018]]) {
    ctx.beginPath();
    ctx.moveTo(w * (bx - bs), h * by);
    ctx.quadraticCurveTo(w * bx, h * (by - bs * 0.7), w * (bx + bs), h * by);
    ctx.stroke();
  }
}

function paintNeon(ctx, w, h) {
  vgrad(ctx, w, h, [[0, '#0b0620'], [0.55, '#1a0b38'], [1, '#2a0f45']]);
  // far skyline with lit windows
  skyline(ctx, w, h, h * 0.6, h * 0.08, h * 0.3, '#120826', 7, true);
  // street buildings left + right
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, h * 0.18, w * 0.2, h * 0.62);
  ctx.fillRect(w * 0.8, h * 0.12, w * 0.2, h * 0.68);
  // neon signs
  neonSign(ctx, w * 0.03, h * 0.24, w * 0.14, h * 0.07, 'VICE', '#ff2e88', h * 0.045);
  neonSign(ctx, w * 0.03, h * 0.36, w * 0.14, h * 0.05, 'HOTEL', '#22d3ee', h * 0.032);
  neonSign(ctx, w * 0.83, h * 0.18, w * 0.14, h * 0.06, 'NEON', '#facc15', h * 0.038);
  neonSign(ctx, w * 0.83, h * 0.3, w * 0.14, h * 0.05, 'BAR 24', '#a78bfa', h * 0.03);
  // vertical neon tube
  ctx.save();
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(w * 0.2, h * 0.2, w * 0.006, h * 0.5);
  ctx.shadowColor = '#22d3ee';
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(w * 0.794, h * 0.14, w * 0.006, h * 0.56);
  ctx.restore();
  // wet street
  const wg = ctx.createLinearGradient(0, h * 0.6, 0, h);
  wg.addColorStop(0, '#241040');
  wg.addColorStop(1, '#0a0416');
  ctx.fillStyle = wg;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  // reflections
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (const [rx, rw, color] of [[0.1, 0.14, '#ff2e88'], [0.86, 0.14, '#facc15'], [0.2, 0.006, '#ff2e88'], [0.79, 0.006, '#22d3ee']]) {
    const rg2 = ctx.createLinearGradient(0, h * 0.6, 0, h);
    rg2.addColorStop(0, color);
    rg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg2;
    ctx.fillRect(w * rx, h * 0.6, w * rw, h * 0.4);
  }
  ctx.restore();
  // car with tail lights
  convertible(ctx, w * 0.5, h * 0.86, w * 0.0013, '#05020a');
  ctx.save();
  ctx.shadowColor = '#ff3355';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ff3355';
  ctx.fillRect(w * 0.36, h * 0.845, w * 0.02, h * 0.008);
  ctx.fillRect(w * 0.62, h * 0.845, w * 0.02, h * 0.008);
  ctx.restore();
  // rain streaks
  ctx.strokeStyle = 'rgba(180, 200, 255, 0.25)';
  ctx.lineWidth = 1;
  const rnd = mulberry32(5);
  for (let i = 0; i < 60; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - w * 0.004, y + h * 0.02);
    ctx.stroke();
  }
}

function paintPier(ctx, w, h) {
  vgrad(ctx, w, h, [[0, '#7ec8f7'], [0.5, '#aee3f9'], [0.62, '#3ec6d8'], [1, '#0e7d9e']]);
  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const rnd = mulberry32(11);
  for (let i = 0; i < 6; i++) {
    const cx = rnd() * w;
    const cy = h * (0.06 + rnd() * 0.2);
    const cs = w * (0.06 + rnd() * 0.08);
    ctx.beginPath();
    ctx.ellipse(cx, cy, cs, cs * 0.32, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cs * 0.5, cy + cs * 0.06, cs * 0.7, cs * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  glowSun(ctx, w * 0.8, h * 0.16, h * 0.06, '#fffbe0', 'rgba(255, 240, 160, 0.9)');
  // sea
  const sg = ctx.createLinearGradient(0, h * 0.58, 0, h);
  sg.addColorStop(0, '#2ec4d8');
  sg.addColorStop(1, '#0a6d8f');
  ctx.fillStyle = sg;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  // sun glitter on the sea
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 26; i++) {
    const gx = w * (0.72 + (rnd() - 0.5) * 0.24);
    const gy = h * (0.6 + rnd() * 0.36);
    ctx.fillRect(gx, gy, w * (0.004 + rnd() * 0.012), h * 0.003);
  }
  // ferris wheel silhouette, right
  const fx = w * 0.78;
  const fy = h * 0.42;
  const fr = h * 0.2;
  ctx.strokeStyle = '#123a52';
  ctx.lineWidth = Math.max(2, h * 0.004);
  ctx.beginPath();
  ctx.arc(fx, fy, fr, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr);
    ctx.stroke();
    ctx.fillStyle = '#123a52';
    ctx.beginPath();
    ctx.arc(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, h * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(fx - w * 0.004, fy, w * 0.008, h * 0.2);
  ctx.fillRect(fx - w * 0.05, fy + h * 0.19, w * 0.1, h * 0.012);
  // pier deck, perspective from bottom-left
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.42, h * 0.62);
  ctx.lineTo(w * 0.62, h * 0.62);
  ctx.lineTo(w * 0.34, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.6)';
  ctx.lineWidth = Math.max(1, h * 0.002);
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const y = h * (0.64 + t * 0.34);
    ctx.beginPath();
    ctx.moveTo(w * (0.4 - t * 0.4), y);
    ctx.lineTo(w * (0.64 - t * 0.3), y);
    ctx.stroke();
  }
  // pier posts + lamp
  ctx.fillStyle = '#5e3a1e';
  ctx.fillRect(w * 0.42, h * 0.6, w * 0.012, h * 0.05);
  ctx.fillRect(w * 0.6, h * 0.6, w * 0.012, h * 0.05);
  ctx.fillRect(w * 0.5, h * 0.5, w * 0.008, h * 0.12);
  ctx.save();
  ctx.shadowColor = '#ffe9a8';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(w * 0.504, h * 0.49, h * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // gulls
  ctx.strokeStyle = '#123a52';
  ctx.lineWidth = Math.max(1.5, h * 0.002);
  for (const [bx, by, bs] of [[0.25, 0.14, 0.02], [0.4, 0.2, 0.015], [0.6, 0.1, 0.018]]) {
    ctx.beginPath();
    ctx.moveTo(w * (bx - bs), h * by);
    ctx.quadraticCurveTo(w * bx, h * (by - bs * 0.7), w * (bx + bs), h * by);
    ctx.stroke();
  }
}

function paintRooftop(ctx, w, h) {
  vgrad(ctx, w, h, [[0, '#1b1035'], [0.4, '#5b2a6e'], [0.62, '#c65d7b'], [1, '#f2a65a']]);
  // moon
  glowSun(ctx, w * 0.22, h * 0.18, h * 0.05, '#f5f0ff', 'rgba(200, 180, 255, 0.55)');
  ctx.fillStyle = 'rgba(120,100,160,0.5)';
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.165, h * 0.012, 0, Math.PI * 2);
  ctx.arc(w * 0.235, h * 0.195, h * 0.008, 0, Math.PI * 2);
  ctx.fill();
  // skyline with lit windows
  skyline(ctx, w, h, h * 0.66, h * 0.06, h * 0.26, '#241338', 23, true);
  // rooftop foreground
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  // AC units + water tower + antenna
  ctx.fillRect(w * 0.06, h * 0.76, w * 0.1, h * 0.06);
  ctx.fillRect(w * 0.78, h * 0.77, w * 0.08, h * 0.05);
  ctx.fillRect(w * 0.6, h * 0.7, w * 0.05, h * 0.12);
  ctx.beginPath();
  ctx.moveTo(w * 0.6, h * 0.7);
  ctx.lineTo(w * 0.625, h * 0.62);
  ctx.lineTo(w * 0.65, h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(w * 0.9, h * 0.55, w * 0.006, h * 0.27);
  ctx.save();
  ctx.shadowColor = '#ff3355';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff3355';
  ctx.beginPath();
  ctx.arc(w * 0.903, h * 0.54, h * 0.01, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // string lights across the rooftop
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.7)';
  ctx.lineWidth = Math.max(1, h * 0.0015);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.quadraticCurveTo(w * 0.5, h * 0.88, w, h * 0.76);
  ctx.stroke();
  const rnd = mulberry32(31);
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const lx = w * t;
    const ly = h * (0.78 + Math.sin(t * Math.PI) * 0.09);
    ctx.save();
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 10;
    ctx.fillStyle = ['#ffd166', '#ff5e78', '#22d3ee'][i % 3];
    ctx.beginPath();
    ctx.arc(lx, ly, h * 0.007, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // two figures on the rooftop edge, back to camera
  ctx.fillStyle = '#0a0512';
  for (const [fx2, fs] of [[0.42, 1], [0.5, 0.92]]) {
    ctx.beginPath();
    ctx.arc(w * fx2, h * 0.79, h * 0.014 * fs, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * (fx2 - 0.018 * fs), h * 0.8, w * 0.036 * fs, h * 0.045 * fs);
  }
}

// --- Public API -----------------------------------------------------------

const PAINTERS = { boulevard: paintBoulevard, neon: paintNeon, pier: paintPier, rooftop: paintRooftop };
const cache = new Map();

export function paintScene(name, w, h) {
  const key = `${name}@${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d');
  (PAINTERS[name] || paintBoulevard)(ctx, canvas.width, canvas.height);
  if (cache.size > 24) cache.clear();
  cache.set(key, canvas);
  return canvas;
}
