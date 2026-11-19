// Procedural Vice City scenes, painted in code — no photo files needed.
// Each scene paints a full-bleed illustrated "photo" onto a canvas context:
// a sunset boulevard, a neon night street, a turquoise pier and a dusk
// rooftop. They are the app's built-in sample photos and the default art
// behind every cover, drawn fresh at any size, so the repo ships zero
// binary images and still shows rich, GTA-poster-like art.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, core, glow) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 3.2);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function clouds(ctx, w, h, rng, color, n, yTop, yBottom) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const cx = rng() * w;
    const cy = yTop + rng() * (yBottom - yTop);
    const cw = w * (0.08 + rng() * 0.16);
    const ch = cw * 0.22;
    ctx.globalAlpha = 0.16 + rng() * 0.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function skyline(ctx, w, baseY, hMin, hMax, color, rng, lit) {
  let x = -w * 0.02;
  ctx.fillStyle = color;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rng() * 0.09);
    const bh = hMin + rng() * (hMax - hMin);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (lit) {
      ctx.fillStyle = 'rgba(255, 214, 130, 0.85)';
      for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 16) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
          if (rng() < 0.35) ctx.fillRect(wx, wy, 5, 7);
        }
      }
      ctx.fillStyle = color;
    }
    x += bw + w * 0.008;
  }
}

// A palm: leaning trunk plus seven drooping fronds.
function palm(ctx, x, y, s, lean, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * s;
  const topY = y - s;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = s * 0.045;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.08) - (i / 6) * Math.PI * 0.85;
    const len = s * (0.42 + (i % 2) * 0.1);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.16;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.5, topY + Math.sin(a) * len * 0.3 - s * 0.1, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY + s * 0.03, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function birds(ctx, w, h, rng, n, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, w * 0.002);
  for (let i = 0; i < n; i++) {
    const x = rng() * w;
    const y = h * (0.08 + rng() * 0.2);
    const s = w * (0.008 + rng() * 0.01);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

function paintBoulevard(ctx, w, h, rng) {
  sky(ctx, w, h, [[0, '#2b1055'], [0.42, '#c62b7e'], [0.68, '#ff5e62'], [1, '#ffb347']]);
  sunDisc(ctx, w * 0.62, h * 0.52, h * 0.13, '#ffe9a8', 'rgba(255, 180, 80, 0.55)');
  clouds(ctx, w, h, rng, '#ffd9e8', 7, h * 0.06, h * 0.34);
  birds(ctx, w, h, rng, 5, 'rgba(40,10,40,0.85)');
  skyline(ctx, w, h * 0.62, h * 0.05, h * 0.2, '#3d1458', rng, true);
  // Ocean strip on the horizon.
  const sea = ctx.createLinearGradient(0, h * 0.6, 0, h * 0.68);
  sea.addColorStop(0, '#ff8a5c');
  sea.addColorStop(1, '#b83280');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.6, w, h * 0.08);
  // Boulevard: perspective road.
  ctx.fillStyle = '#241335';
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.68);
  ctx.lineTo(w * 0.68, h * 0.68);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.setLineDash([w * 0.05, w * 0.04]);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.68);
  ctx.lineTo(w * 0.5, h);
  ctx.stroke();
  ctx.setLineDash([]);
  // Palm rows lining the road.
  palm(ctx, w * 0.06, h * 0.99, h * 0.42, 0.12, '#170a24');
  palm(ctx, w * 0.2, h * 0.86, h * 0.3, -0.08, '#1d0d2c');
  palm(ctx, w * 0.94, h * 0.99, h * 0.44, -0.12, '#170a24');
  palm(ctx, w * 0.8, h * 0.86, h * 0.3, 0.08, '#1d0d2c');
  // Vintage convertible, low and wide, centre foreground.
  ctx.fillStyle = '#12081d';
  const cx = w * 0.5, cy = h * 0.93, cw = w * 0.52, chh = h * 0.075;
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2, cy);
  ctx.lineTo(cx - cw / 2 + cw * 0.04, cy - chh * 0.85);
  ctx.lineTo(cx - cw * 0.18, cy - chh * 1.25);
  ctx.lineTo(cx + cw * 0.16, cy - chh * 1.25);
  ctx.lineTo(cx + cw / 2 - cw * 0.05, cy - chh * 0.8);
  ctx.lineTo(cx + cw / 2, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5e62';
  ctx.beginPath();
  ctx.moveTo(cx - cw / 2 + cw * 0.02, cy - chh * 0.28);
  ctx.lineTo(cx + cw / 2 - cw * 0.02, cy - chh * 0.28);
  ctx.lineTo(cx + cw / 2 - cw * 0.06, cy - chh * 0.05);
  ctx.lineTo(cx - cw / 2 + cw * 0.06, cy - chh * 0.05);
  ctx.closePath();
  ctx.fill();
  for (const wx of [-0.32, 0.3]) {
    ctx.fillStyle = '#0a0512';
    ctx.beginPath();
    ctx.arc(cx + wx * cw, cy - chh * 0.08, chh * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cfd6e4';
    ctx.beginPath();
    ctx.arc(cx + wx * cw, cy - chh * 0.08, chh * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function neonSign(ctx, x, y, w, h, text, color, glow) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = w * 0.06;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = w * 0.02;
  ctx.fillStyle = '#0b0616';
  ctx.font = `900 ${Math.round(h * 0.52)}px "Arial Narrow", "Liberation Sans Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + h * 0.03);
  ctx.restore();
}

function paintNeon(ctx, w, h, rng) {
  sky(ctx, w, h, [[0, '#07030f'], [0.55, '#150a2e'], [1, '#2a0f45']]);
  // Buildings left and right with lit windows.
  ctx.fillStyle = '#0d0718';
  ctx.fillRect(0, 0, w * 0.24, h * 0.78);
  ctx.fillRect(w * 0.76, 0, w * 0.24, h * 0.78);
  ctx.fillStyle = 'rgba(255, 214, 130, 0.8)';
  for (let i = 0; i < 46; i++) {
    const side = rng() < 0.5 ? 0 : w * 0.78;
    ctx.globalAlpha = 0.25 + rng() * 0.6;
    ctx.fillRect(side + 8 + rng() * w * 0.18, 12 + rng() * h * 0.6, w * 0.012, h * 0.02);
  }
  ctx.globalAlpha = 1;
  neonSign(ctx, w * 0.03, h * 0.16, w * 0.18, h * 0.09, 'DINER', '#ff2e88', '#ff2e88');
  neonSign(ctx, w * 0.79, h * 0.1, w * 0.18, h * 0.09, 'HOTEL', '#22e6c8', '#22e6c8');
  neonSign(ctx, w * 0.79, h * 0.3, w * 0.13, h * 0.07, '24H', '#ffc93d', '#ffc93d');
  neonSign(ctx, w * 0.03, h * 0.34, w * 0.15, h * 0.07, 'VICE', '#b26bff', '#b26bff');
  // Wet street with neon reflections.
  const wet = ctx.createLinearGradient(0, h * 0.72, 0, h);
  wet.addColorStop(0, '#1a0b33');
  wet.addColorStop(1, '#05020c');
  ctx.fillStyle = wet;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  for (const [rx, color, rw] of [[0.12, '#ff2e88', 0.05], [0.87, '#22e6c8', 0.05], [0.5, '#ffc93d', 0.03]]) {
    const g = ctx.createLinearGradient(0, h * 0.72, 0, h);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = g;
    ctx.fillRect(w * (rx - rw / 2), h * 0.72, w * rw, h * 0.28);
  }
  ctx.globalAlpha = 1;
  // Two friends laughing on the street, silhouettes.
  for (const [fx, s] of [[0.42, 1], [0.56, 0.92]]) {
    const bx = w * fx, by = h * 0.98, sh = h * 0.26 * s;
    ctx.fillStyle = '#05020c';
    ctx.beginPath();
    ctx.arc(bx, by - sh * 0.86, sh * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx - sh * 0.16, by);
    ctx.quadraticCurveTo(bx - sh * 0.2, by - sh * 0.62, bx - sh * 0.07, by - sh * 0.72);
    ctx.lineTo(bx + sh * 0.07, by - sh * 0.72);
    ctx.quadraticCurveTo(bx + sh * 0.2, by - sh * 0.62, bx + sh * 0.16, by);
    ctx.closePath();
    ctx.fill();
  }
  // Rain streaks.
  ctx.strokeStyle = 'rgba(190, 220, 255, 0.28)';
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (let i = 0; i < 60; i++) {
    const x = rng() * w, y = rng() * h * 0.7, len = h * (0.015 + rng() * 0.02);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len * 0.25, y + len);
    ctx.stroke();
  }
}

function paintPier(ctx, w, h, rng) {
  sky(ctx, w, h, [[0, '#7ec8f2'], [0.45, '#cdeefb'], [0.62, '#fdf3d8'], [1, '#ffe9a8']]);
  sunDisc(ctx, w * 0.8, h * 0.16, h * 0.09, '#fff7cf', 'rgba(255, 240, 170, 0.6)');
  clouds(ctx, w, h, rng, '#ffffff', 6, h * 0.05, h * 0.3);
  // Turquoise sea.
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h);
  sea.addColorStop(0, '#2ec4b6');
  sea.addColorStop(0.5, '#14919b');
  sea.addColorStop(1, '#0b6b7a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, h * 0.003);
  for (let i = 0; i < 26; i++) {
    const y = h * (0.58 + rng() * 0.36);
    const x = rng() * w;
    const len = w * (0.04 + rng() * 0.14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  // Wooden pier, perspective planks from the bottom centre.
  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h);
  ctx.lineTo(w * 0.46, h * 0.56);
  ctx.lineTo(w * 0.54, h * 0.56);
  ctx.lineTo(w * 0.66, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 20, 8, 0.55)';
  ctx.lineWidth = Math.max(1, w * 0.002);
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const y = h * (0.56 + 0.44 * t * t);
    const half = w * (0.04 + 0.12 * t);
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - half, y);
    ctx.lineTo(w * 0.5 + half, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#5d3d22';
  ctx.fillRect(w * 0.44, h * 0.52, w * 0.012, h * 0.06);
  ctx.fillRect(w * 0.548, h * 0.52, w * 0.012, h * 0.06);
  // Angler with a bucket hat at the pier end.
  const ax = w * 0.5, ay = h * 0.56, s = h * 0.16;
  ctx.fillStyle = '#12303a';
  ctx.beginPath();
  ctx.arc(ax, ay - s * 0.82, s * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ax, ay - s * 0.9, s * 0.17, s * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ax - s * 0.15, ay);
  ctx.quadraticCurveTo(ax - s * 0.18, ay - s * 0.55, ax - s * 0.06, ay - s * 0.66);
  ctx.lineTo(ax + s * 0.06, ay - s * 0.66);
  ctx.quadraticCurveTo(ax + s * 0.18, ay - s * 0.55, ax + s * 0.15, ay);
  ctx.closePath();
  ctx.fill();
  // Fishing rod, bent toward the water.
  ctx.strokeStyle = '#12303a';
  ctx.lineWidth = Math.max(1.5, w * 0.003);
  ctx.beginPath();
  ctx.moveTo(ax + s * 0.12, ay - s * 0.55);
  ctx.quadraticCurveTo(ax + s * 0.5, ay - s * 0.95, ax + s * 0.72, ay - s * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax + s * 0.72, ay - s * 0.55);
  ctx.lineTo(ax + s * 0.7, ay - s * 0.1);
  ctx.stroke();
}

function paintRooftop(ctx, w, h, rng) {
  sky(ctx, w, h, [[0, '#1d1140'], [0.45, '#7b2f8b'], [0.72, '#ff7e5f'], [1, '#feb47b']]);
  sunDisc(ctx, w * 0.5, h * 0.58, h * 0.11, '#ffe9a8', 'rgba(255, 160, 90, 0.5)');
  clouds(ctx, w, h, rng, '#ffc4d6', 5, h * 0.08, h * 0.3);
  skyline(ctx, w, h * 0.66, h * 0.08, h * 0.3, '#241239', rng, true);
  // Rooftop floor.
  ctx.fillStyle = '#160b26';
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.fillStyle = '#241239';
  ctx.fillRect(0, h * 0.66, w, h * 0.012);
  // String lights across the top.
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.7)';
  ctx.lineWidth = Math.max(1, w * 0.0015);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.1);
  ctx.quadraticCurveTo(w * 0.5, h * 0.22, w, h * 0.08);
  ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const x = t * w;
    const y = h * 0.1 + Math.sin(t * Math.PI) * h * 0.1;
    ctx.save();
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 12;
    ctx.fillStyle = i % 3 === 0 ? '#ff2e88' : i % 3 === 1 ? '#22e6c8' : '#ffc93d';
    ctx.beginPath();
    ctx.arc(x, y + h * 0.018, Math.max(2, w * 0.004), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  palm(ctx, w * 0.08, h * 0.99, h * 0.4, 0.1, '#0e0716');
  // Man in an open floral shirt, gold chain glint — big enough to read.
  const mx = w * 0.64, my = h * 0.99, s = h * 0.38;
  ctx.fillStyle = '#2b1a45';
  ctx.beginPath();
  ctx.arc(mx, my - s * 0.88, s * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(mx - s * 0.17, my);
  ctx.quadraticCurveTo(mx - s * 0.2, my - s * 0.6, mx - s * 0.08, my - s * 0.72);
  ctx.lineTo(mx + s * 0.08, my - s * 0.72);
  ctx.quadraticCurveTo(mx + s * 0.2, my - s * 0.6, mx + s * 0.17, my);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(1.5, w * 0.003);
  ctx.beginPath();
  ctx.moveTo(mx - s * 0.05, my - s * 0.7);
  ctx.quadraticCurveTo(mx, my - s * 0.56, mx + s * 0.05, my - s * 0.7);
  ctx.stroke();
  ctx.restore();
}

export const SCENES = {
  boulevard: { name: 'Boulevard Sunset', paint: paintBoulevard },
  neon: { name: 'Neon Street', paint: paintNeon },
  pier: { name: 'Pier Day', paint: paintPier },
  rooftop: { name: 'Rooftop Dusk', paint: paintRooftop },
};

// Paint a scene onto a fresh canvas and return it (used as a photo source).
export function sceneCanvas(sceneId, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d');
  const scene = SCENES[sceneId] ?? SCENES.boulevard;
  scene.paint(ctx, canvas.width, canvas.height, mulberry32(hashSeed(sceneId)));
  return canvas;
}
