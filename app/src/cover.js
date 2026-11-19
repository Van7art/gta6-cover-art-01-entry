// Neon Vice Studio — the cover engine. A full-bleed hero photo under a
// synthwave neon sun and palm silhouettes, a filmstrip of small panels along
// the foot, and a glowing title. Everything is drawn on canvas from the
// caller's state; no assets are fetched and no Rockstar material is used.

export const DISPLAY_FONT = '"Vice Display", "Noto Sans Condensed Black", "Arial Black", sans-serif';
export const BODY_FONT = '"Vice Body", "Noto Sans", sans-serif';
export const SCRIPT_FONT = '"Vice Script", "Noto Serif", serif';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

export const LAYOUTS = [
  { id: 'strip', name: 'Hero + filmstrip' },
  { id: 'split', name: 'Split screen' },
  { id: 'full', name: 'Full bleed' },
];

export const GRADES = [
  { id: 'neon', name: 'Neon Nights' },
  { id: 'sunset', name: 'Sunset Strip' },
  { id: 'vice', name: 'Vice Blue' },
];

export function defaultState() {
  return {
    title: 'Neon Nights',
    subtitle: 'Vice City after dark',
    layout: 'strip',
    grade: 'neon',
    size: 'square',
    panels: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.2, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.1, ox: 0, oy: 0 },
    ],
    selected: 0,
  };
}

/** Panel rectangles per layout, in cover pixels. */
export function layoutSlots(layout, W, H) {
  if (layout === 'split') {
    const heroW = W * 0.62;
    const rw = W - heroW;
    const ph = H / 2;
    return [
      { x: 0, y: 0, w: heroW, h: H },
      { x: heroW, y: 0, w: rw, h: ph },
      { x: heroW, y: ph, w: rw, h: H - ph },
    ];
  }
  if (layout === 'full') {
    return [{ x: 0, y: 0, w: W, h: H }];
  }
  // strip: hero is the whole cover; three small panels ride along the foot.
  const stripH = H * 0.24;
  const gut = Math.round(W * 0.014);
  const pw = (W - gut * 4) / 3;
  const y = H - stripH - gut;
  return [
    { x: 0, y: 0, w: W, h: H },
    { x: gut, y, w: pw, h: stripH },
    { x: gut * 2 + pw, y, w: pw, h: stripH },
    { x: gut * 3 + pw * 2, y, w: pw, h: stripH },
  ];
}

export function clampPan(panel, img, rect) {
  if (!img) return;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
  const overX = (img.naturalWidth * scale - rect.w) / 2;
  const overY = (img.naturalHeight * scale - rect.h) / 2;
  const limX = Math.max(0, overX / rect.w);
  const limY = Math.max(0, overY / rect.h);
  panel.ox = Math.max(-limX, Math.min(limX, panel.ox));
  panel.oy = Math.max(-limY, Math.min(limY, panel.oy));
}

function drawPhotoInto(ctx, img, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, '#2a0f3d');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.round(rect.h * 0.09)}px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + panel.ox * rect.w;
  const cy = rect.y + rect.h / 2 + panel.oy * rect.h;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

let grainTile = null;
function grain(ctx, W, H) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 140;
    grainTile.height = 140;
    const g = grainTile.getContext('2d');
    const data = g.createImageData(140, 140);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 18;
    }
    g.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function vignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,2,18,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function applyGrade(ctx, W, H, grade) {
  ctx.save();
  if (grade === 'vice') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(0,229,255,0.28)');
    g.addColorStop(1, 'rgba(123,47,247,0.34)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,190,80,0.18)');
    g.addColorStop(0.6, 'rgba(255,110,60,0.06)');
    g.addColorStop(1, 'rgba(214,38,120,0.36)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,46,126,0.32)');
    g.addColorStop(0.5, 'rgba(123,47,247,0.14)');
    g.addColorStop(1, 'rgba(0,229,255,0.32)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = '#ff2e7e';
    ctx.fillRect(0, 0, W, H * 0.35);
  }
  ctx.restore();
}

/** A synthwave sun: a gradient disc with horizontal slits cut from its base. */
function drawNeonSun(ctx, cx, cy, r) {
  const off = document.createElement('canvas');
  off.width = Math.ceil(r * 2 + 4);
  off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, off.height);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.45, '#ff9a3d');
  g.addColorStop(1, '#ff2e7e');
  o.fillStyle = g;
  o.beginPath();
  o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2);
  o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height / 2 + r * 0.08;
  let gap = r * 0.045;
  while (y < off.height / 2 + r) {
    o.fillRect(0, y, off.width, gap);
    y += gap + r * 0.16;
    gap *= 1.45;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(255,46,126,0.85)';
  ctx.shadowBlur = r * 0.35;
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
  ctx.restore();
}

/** One palm silhouette, rooted at (x, y), scaled by s, leaning by radians. */
function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.fillStyle = '#12081f';
  ctx.strokeStyle = '#12081f';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(8, -55, 2, -105);
  ctx.stroke();
  const crownX = 2, crownY = -105;
  for (let i = 0; i < 7; i += 1) {
    const a = Math.PI * (1.08 + i * 0.14);
    const tipX = crownX + Math.cos(a) * 62;
    const tipY = crownY + Math.sin(a) * 46 + 26;
    const midX = crownX + Math.cos(a) * 40;
    const midY = crownY + Math.sin(a) * 34 - 12;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + 6, midY + 16, crownX + 4, crownY + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function scanlines(ctx, W, H, y0, y1) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  for (let y = y0; y < y1; y += 5) ctx.fillRect(0, y, W, 2);
  ctx.restore();
}

function wrapTitle(ctx, text, maxW, size) {
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (ctx.measureText(text).width <= maxW) return [text];
  let best = null;
  for (let i = 1; i < words.length; i += 1) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const wa = ctx.measureText(a).width;
    const wb = ctx.measureText(b).width;
    if (wa > maxW || wb > maxW) continue;
    const score = Math.max(wa, wb);
    if (!best || score < best.score) best = { lines: [a, b], score };
  }
  return best ? best.lines : [text];
}

function drawTitleBlock(ctx, W, H, state, hero) {
  const title = state.title.trim().toUpperCase();
  const sub = state.subtitle.trim();
  const full = state.layout === 'full';
  const maxW = full ? W * 0.92 : Math.min(W * 0.86, hero.w * 1.15);
  let size = Math.round(W * (full ? 0.17 : 0.15));
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  let lines = wrapTitle(ctx, title, maxW, size);
  while (lines.length === 1 && ctx.measureText(title).width > maxW && size > W * 0.06) {
    size = Math.round(size * 0.92);
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    lines = wrapTitle(ctx, title, maxW, size);
  }
  const lineH = size * 0.96;
  const totalH = lineH * lines.length;
  const top = full ? H * 0.62 : hero.y + H * 0.045;
  const cx = full ? W / 2 : hero.x + Math.min(hero.w * 0.5, W * 0.44);

  ctx.save();
  ctx.translate(cx, top + totalH / 2);
  ctx.rotate(full ? 0 : -0.02);
  ctx.translate(-cx, -(top + totalH / 2));
  ctx.textAlign = full ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  const tx = full ? W / 2 : hero.x + W * 0.03;
  lines.forEach((line, i) => {
    const ly = top + lineH * (i + 0.5);
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,229,255,0.9)';
    ctx.shadowBlur = size * 0.22;
    ctx.strokeStyle = 'rgba(0,229,255,0.9)';
    ctx.lineWidth = Math.max(4, size * 0.06);
    ctx.strokeText(line, tx, ly);
    ctx.shadowColor = 'rgba(255,46,126,0.9)';
    ctx.strokeStyle = 'rgba(255,46,126,0.9)';
    ctx.strokeText(line, tx + size * 0.03, ly + size * 0.03);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(line, tx, ly);
  });
  ctx.restore();

  if (sub) {
    const subSize = Math.round(W * 0.042);
    ctx.save();
    ctx.font = `700 italic ${subSize}px ${SCRIPT_FONT}`;
    ctx.textAlign = full ? 'center' : 'left';
    ctx.textBaseline = 'middle';
    const sx = full ? W / 2 : hero.x + W * 0.035;
    const sy = top + totalH + subSize * 0.9;
    ctx.shadowColor = 'rgba(255,46,126,0.95)';
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillStyle = '#ffd7ea';
    ctx.fillText(sub, sx, sy);
    ctx.restore();
  }
}

export function drawCover(ctx, W, H, state, photos, opts = {}) {
  const { forExport = false } = opts;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, W, H);

  const slots = layoutSlots(state.layout, W, H);
  const hero = slots[0];
  const heroImg = state.panels[0].photo >= 0 ? photos[state.panels[0].photo] ?? null : null;
  drawPhotoInto(ctx, heroImg, hero, state.panels[0] ?? { photo: -1, zoom: 1, ox: 0, oy: 0 });
  applyGrade(ctx, W, H, state.grade);

  // Neon sun rides in the hero's sky, top right.
  const sunR = Math.round(Math.min(W, H) * 0.115);
  const sunX = state.layout === 'split' ? hero.w * 0.8 : W * 0.83;
  const sunY = H * 0.12;
  drawNeonSun(ctx, sunX, sunY, sunR);

  // Palm silhouettes rooted behind the foot of the hero, peeking above the
  // filmstrip (or the frame) so they read as a skyline, not floating icons.
  const baseY = state.layout === 'strip' ? H * 0.755 : H * 0.99;
  const ps = Math.min(W, H) / 1080;
  drawPalm(ctx, W * 0.045, baseY, 2.0 * ps, -0.08);
  drawPalm(ctx, W * 0.15, baseY + 6, 1.45 * ps, 0.1);
  if (state.layout !== 'split') drawPalm(ctx, W * 0.955, baseY, 1.8 * ps, 0.12);

  scanlines(ctx, W, H, 0, H);
  if (state.layout === 'strip') {
    slots.slice(1).forEach((rect, k) => {
      const panel = state.panels[k + 1] ?? { photo: -1, zoom: 1, ox: 0, oy: 0 };
      const img = panel.photo >= 0 ? photos[panel.photo] ?? null : null;
      drawPhotoInto(ctx, img, rect, panel);
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = '#12081f';
      ctx.lineWidth = Math.max(2, W * 0.002);
      ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
      ctx.restore();
    });
  } else if (state.layout === 'split') {
    slots.slice(1).forEach((rect, k) => {
      const panel = state.panels[k + 1] ?? { photo: -1, zoom: 1, ox: 0, oy: 0 };
      const img = panel.photo >= 0 ? photos[panel.photo] ?? null : null;
      drawPhotoInto(ctx, img, rect, panel);
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    });
    ctx.save();
    ctx.strokeStyle = '#12081f';
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.beginPath();
    ctx.moveTo(hero.w, 0);
    ctx.lineTo(hero.w, H);
    ctx.stroke();
    ctx.restore();
  }

  grain(ctx, W, H);
  vignette(ctx, W, H);
  drawTitleBlock(ctx, W, H, state, hero);

  if (!forExport) {
    const sel = slots[state.selected];
    if (sel) {
      ctx.save();
      ctx.setLineDash([Math.round(W * 0.012), Math.round(W * 0.008)]);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = Math.max(3, W * 0.005);
      ctx.strokeRect(sel.x + 4, sel.y + 4, sel.w - 8, sel.h - 8);
      ctx.restore();
    }
  }
}
