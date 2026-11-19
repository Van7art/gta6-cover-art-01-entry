// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, full frame; ?shot=export draws the
// export PNG and puts its data URL on #export-link so a dump can verify it.
// Query params: caption (title), sub, layout, grade, size.
// window.__shotReady is set once painted.
export async function runShot(shot, query, api) {
  const caption = query.get('caption') ?? 'Neon Nights';
  const sub = query.get('sub') ?? 'Vice City after dark';
  const layout = query.get('layout') ?? 'strip';
  const grade = query.get('grade') ?? 'neon';
  const size = query.get('size') ?? 'square';
  api.setLayout(layout);
  api.setGrade(grade);
  api.setSize(size);
  await api.loadSamples();
  api.setTitle(caption);
  api.setSubtitle(sub);
  if (shot === 'cover' || shot === 'export') document.body.classList.add('shot-cover');
  if (shot === 'cover' || shot === 'export') api.redrawClean(); else api.redraw();
  if (shot === 'export') {
    const dataUrl = await api.exportPngDataUrl();
    const a = document.getElementById('export-link');
    a.href = dataUrl;
    a.removeAttribute('hidden');
    document.title = `exported ${dataUrl.length}`;
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
