// Wires the Neon Vice Studio editor: caption, layout, photos per panel,
// grade, export sizes, and the fixed screenshot scenes (?shot=). Photos are
// read on the user's own machine and never leave it.
import {
  SIZES, LAYOUTS, GRADES, DISPLAY_FONT, defaultState, layoutSlots,
  clampPan, drawCover,
} from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const thumbs = document.getElementById('thumbs');
const zoomInput = document.getElementById('zoom');
const panelName = document.getElementById('panelName');

const state = defaultState();
let photos = [];
let photoNames = [];

function sizeOf() {
  return SIZES[state.size];
}

function syncPanelsToLayout() {
  const count = layoutSlots(state.layout, 100, 100).length;
  while (state.panels.length < count) {
    state.panels.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = count;
  if (state.selected >= count) state.selected = 0;
}

function redraw() {
  const { w, h } = sizeOf();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state, photos, { forExport: false });
}

/** Draws the cover exactly as an export would: no selection outline. */
function redrawClean() {
  const { w, h } = sizeOf();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state, photos, { forExport: true });
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function renderThumbs() {
  thumbs.innerHTML = '';
  if (photos.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No photos yet — add yours or use the samples.';
    thumbs.append(p);
    return;
  }
  photos.forEach((img, i) => {
    const el = document.createElement('img');
    el.src = img.src;
    el.alt = photoNames[i] ?? `Photo ${i + 1}`;
    el.title = photoNames[i] ?? `Photo ${i + 1}`;
    const selectedPanel = state.panels[state.selected];
    el.setAttribute('aria-pressed', selectedPanel && selectedPanel.photo === i ? 'true' : 'false');
    el.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      renderThumbs();
      syncPanelTools();
      redraw();
    });
    thumbs.append(el);
  });
}

function syncPanelTools() {
  const panel = state.panels[state.selected];
  panelName.textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
  zoomInput.value = String(panel.zoom);
}

function buildButtons(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name ?? item.label;
    b.setAttribute('aria-pressed', current() === item.id ? 'true' : 'false');
    b.addEventListener('click', () => {
      onPick(item.id);
      buildButtons(containerId, items, current, onPick);
      redraw();
    });
    box.append(b);
  });
}

function rebuildPickers() {
  buildButtons('layoutButtons', LAYOUTS, () => state.layout, (id) => {
    state.layout = id;
    syncPanelsToLayout();
    syncPanelTools();
  });
  buildButtons('gradeButtons', GRADES, () => state.grade, (id) => { state.grade = id; });
  buildButtons('sizeButtons', Object.entries(SIZES).map(([id, s]) => ({ id, label: s.label })), () => state.size, (id) => { state.size = id; });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  photos.push(img);
  photoNames.push(file.name.replace(/\.[^.]+$/, ''));
  renderThumbs();
  return photos.length - 1;
}

async function loadSamples() {
  const jobs = ['boulevard', 'pier'].map(async (name, i) => {
    if (photos[i]) return i;
    const img = await loadImage(`samples/${name}.jpg`);
    photos[i] = img;
    photoNames[i] = name;
    return i;
  });
  await Promise.all(jobs);
  state.panels[0].photo = 0;
  if (state.panels[1]) state.panels[1].photo = 1;
  if (state.panels[2]) state.panels[2].photo = 0;
  if (state.panels[3]) state.panels[3].photo = 1;
  renderThumbs();
  redraw();
}

function exportPng() {
  const { w, h } = sizeOf();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off.getContext('2d'), w, h, state, photos, { forExport: true });
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.getElementById('export-link');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-vice-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-vice-${w}x${h}.png`;
  }, 'image/png');
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const { w, h } = sizeOf();
  return { x: (e.clientX - r.left) * (w / r.width), y: (e.clientY - r.top) * (h / r.height) };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const slots = layoutSlots(state.layout, sizeOf().w, sizeOf().h);
  // The hero panel sits under the strip panels: pick the topmost hit.
  let hit = -1;
  slots.forEach((s, i) => {
    if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) hit = i;
  });
  if (hit === -1) return;
  state.selected = hit;
  syncPanelTools();
  renderThumbs();
  redraw();
  const panel = state.panels[hit];
  drag = { panel, x: p.x, y: p.y };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slots = layoutSlots(state.layout, sizeOf().w, sizeOf().h);
  const rect = slots[state.selected];
  drag.panel.ox += (p.x - drag.x) / rect.w;
  drag.panel.oy += (p.y - drag.y) / rect.h;
  drag.x = p.x;
  drag.y = p.y;
  const img = drag.panel.photo >= 0 ? photos[drag.panel.photo] : null;
  clampPan(drag.panel, img, rect);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  const rect = layoutSlots(state.layout, sizeOf().w, sizeOf().h)[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  const img = panel.photo >= 0 ? photos[panel.photo] : null;
  clampPan(panel, img, rect);
  zoomInput.value = String(panel.zoom);
  redraw();
}, { passive: false });

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  const rect = layoutSlots(state.layout, sizeOf().w, sizeOf().h)[state.selected];
  panel.zoom = Number(zoomInput.value);
  const img = panel.photo >= 0 ? photos[panel.photo] : null;
  clampPan(panel, img, rect);
  redraw();
});
document.getElementById('reframe').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.zoom = 1;
  panel.ox = 0;
  panel.oy = 0;
  syncPanelTools();
  redraw();
});
document.getElementById('loadSamples').addEventListener('click', loadSamples);
document.getElementById('photoFiles').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    try {
      const idx = await addPhotoFile(file);
      state.panels[state.selected].photo = idx;
    } catch {
      status.textContent = `Could not read ${file.name}.`;
    }
  }
  syncPanelTools();
  redraw();
  e.target.value = '';
});
document.getElementById('export').addEventListener('click', exportPng);

rebuildPickers();
syncPanelsToLayout();
syncPanelTools();
renderThumbs();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
async function start() {
  try {
    await document.fonts.load(`900 100px ${DISPLAY_FONT}`);
    await document.fonts.ready;
  } catch { /* system fonts are the fallback */ }
  if (shot) {
    await runShot(shot, query, {
      loadSamples,
      setTitle: (t) => { state.title = t; titleInput.value = t; },
      setSubtitle: (t) => { state.subtitle = t; subtitleInput.value = t; },
      setLayout: (id) => { state.layout = id; syncPanelsToLayout(); rebuildPickers(); },
      setGrade: (id) => { state.grade = id; rebuildPickers(); },
      setSize: (id) => { state.size = id; rebuildPickers(); },
      redraw,
      redrawClean,
      exportPngDataUrl: async () => {
        const { w, h } = sizeOf();
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        drawCover(off.getContext('2d'), w, h, state, photos, { forExport: true });
        const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      },
    });
  } else {
    await loadSamples();
    redraw();
  }
  window.__appReady = true;
}
start();
