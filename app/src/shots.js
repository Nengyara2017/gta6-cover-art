// Vice Coast Cover Studio — screenshot mode (app/src/shots.js).
//
// Lets the maker's screenshot script drive the app with URL parameters
// instead of clicks, so every screenshot shows the real app in a known
// state:
//
//   ?shot=cover&photo=mixed&layout=vice-grid&grade=sunset&size=1920x1080
//     &title=VICE%20COAST&subtitle=one%20last%20ride
//   ?shot=editor&photo=sunset&layout=nine&grade=neon&size=1080x1350
//
// shot=cover renders the cover at its export size; shot=editor leaves the
// editor on screen. Either way the script sets window.__shotReady once the
// cover has been drawn with the bundled fonts.

import { LAYOUTS, GRADES, SIZES, fitPanelsToLayout } from './cover.js';

function setPanels(vc, photo) {
  const state = vc.state;
  const ids = photo === 'mixed'
    ? ['sunset-drive', 'neon-street']
    : [photo === 'neon' ? 'neon-street' : 'sunset-drive'];
  fitPanelsToLayout(state);
  state.panels.forEach((panel, i) => {
    panel.photoId = ids[i % ids.length];
    panel.zoom = 1;
    panel.panX = 0;
    panel.panY = 0;
  });
}

export async function applyShotParams(vc) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('shot')) return;
  const state = vc.state;
  const layout = params.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = params.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = params.get('size');
  if (size && SIZES[size]) state.size = size;
  if (params.get('title')) state.caption.title = params.get('title');
  if (params.get('subtitle')) state.caption.subtitle = params.get('subtitle');
  if (params.get('badge')) state.caption.badge = params.get('badge');
  if (params.get('stars')) state.caption.stars = Number(params.get('stars'));
  if (params.get('titlesize')) state.caption.titleSize = Number(params.get('titlesize'));
  setPanels(vc, params.get('photo') || 'mixed');
  // Wait for the bundled fonts so the lettering in the shot is the real one.
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('24px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // System-font fallback still renders.
  }
  vc.render();
  window.__shotReady = true;
}
