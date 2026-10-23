import type {
  DetectedCitation,
  ProjectorTheme,
  DisplayMode,
  ProjectorSyncPayload,
  AmharicFontFamily
} from '../../types';
import { BROADCAST_CHANNEL_NAME } from '../../utils/constants';
import { getAmharicFontFamily } from '../../utils/formatters';

// ============================================================================
// POP-OUT HDMI WINDOW INITIALIZER (BroadcastChannel Receiver)
// ============================================================================

export function mountPopoutProjectorDOM(
  popoutWin: Window,
  initialCitation: DetectedCitation,
  theme: ProjectorTheme,
  fontScale: number,
  displayMode: DisplayMode,
  isBlackout: boolean,
  initialFontFamily: AmharicFontFamily = 'noto-serif'
): void {
  const doc = popoutWin.document;
  doc.title = 'ቃለ እግዚአብሔር - Live HDMI Projector Output';

  // Inject Google Fonts for Ethiopic script
  const fontLink = doc.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Abyssinica+SIL&family=Hibur+Mono:wght@400;700&family=Menbere:wght@400;600;700&family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@400;600;700;800&display=swap';
  doc.head.appendChild(fontLink);

  // Inject self-contained styles for the HDMI projector window
  const styleEl = doc.createElement('style');
  styleEl.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #020617;
      color: #ffffff;
      font-family: 'Noto Serif Ethiopic', serif;
      user-select: none;
      display: flex;
      flex-direction: column;
    }
    .projector-root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: background 0.4s ease;
    }
    .theme-royal-navy { background: linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #172554 100%); }
    .theme-deep-emerald { background: linear-gradient(135deg, #022c22 0%, #134e4a 50%, #020617 100%); }
    .theme-warm-gold { background: linear-gradient(135deg, #0c0a09 0%, #451a03 50%, #422006 100%); }
    .theme-pitch-black { background: #000000; }
    .theme-obs { background: #022c22; }
    .top-bar {
      opacity: 0;
      transition: opacity 0.25s ease;
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.65);
      font-family: 'Noto Sans Ethiopic', sans-serif;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    body:hover .top-bar { opacity: 1; }
    .center-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 4rem;
      text-align: center;
    }
    .citation-pill {
      padding: 10px 28px;
      border-radius: 9999px;
      border: 1px solid rgba(251, 191, 36, 0.45);
      background: rgba(245, 158, 11, 0.18);
      color: #fcd34d;
      font-size: 1.65rem;
      font-weight: 700;
      margin-bottom: 2rem;
    }
    .verse-body {
      max-width: 72rem;
      font-weight: 700;
      line-height: 1.45;
      color: #ffffff;
    }
    .verse-footer {
      margin-top: 2.5rem;
      font-size: 1.25rem;
      color: #fcd34d;
      opacity: 0.85;
    }
    .obs-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2.5rem 3.5rem;
    }
    .obs-card {
      max-width: 72rem;
      width: 100%;
      margin: 0 auto;
      background: rgba(2, 6, 23, 0.95);
      border-left: 8px solid #fbbf24;
      border-radius: 0 1rem 1rem 0;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .btn-fs {
      padding: 6px 14px;
      background: #fbbf24;
      color: #020617;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  `;
  doc.head.appendChild(styleEl);

  doc.body.innerHTML = '';
  const rootEl = doc.createElement('div');
  rootEl.id = 'projector-root';
  rootEl.className = 'projector-root theme-royal-navy';
  doc.body.appendChild(rootEl);

  const state = {
    citation: initialCitation,
    theme,
    fontFamily: initialFontFamily,
    fontScale,
    displayMode,
    isBlackout
  };

  const renderProjector = () => {
    const currentFamily = getAmharicFontFamily(state.fontFamily);
    doc.documentElement.style.setProperty('--amharic-font-family', currentFamily);
    doc.body.style.fontFamily = currentFamily;
    const c = state.citation;
    const range = c.verseEnd > c.verseStart ? `${c.verseStart}-${c.verseEnd}` : `${c.verseStart}`;
    const refTitle = `${c.bookNameAm} ምዕራፍ ${c.chapter} ፥ ${range}`;

    const themeClass =
      state.displayMode === 'obs-lower-third'
        ? 'theme-obs'
        : `theme-${state.theme}`;

    rootEl.className = `projector-root ${themeClass}`;

    if (state.isBlackout) {
      rootEl.innerHTML = `
        <div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;">
          <span style="color:#262626;font-size:12px;font-family:sans-serif;letter-spacing:0.2em;">BLACKOUT ACTIVE</span>
        </div>
      `;
      return;
    }

    if (state.displayMode === 'obs-lower-third') {
      const remSize = Math.max(1.3, Number((2.0 * (state.fontScale / 100)).toFixed(2)));
      rootEl.innerHTML = `
        <div class="obs-container">
          <div class="obs-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
              <span style="font-size:1.5rem;font-weight:700;color:#fbbf24;font-family:${currentFamily};">${refTitle}</span>
              <span style="font-size:0.75rem;color:#94a3b8;font-family:sans-serif;text-transform:uppercase;letter-spacing:0.1em;">
                መጽሐፍ ቅዱስ (1954) • ${c.bookNameEn} ${c.chapter}:${range}
              </span>
            </div>
            <p class="verse-body" style="font-size:${remSize}rem;font-family:${currentFamily};">« ${c.verseText} »</p>
          </div>
        </div>
      `;
      return;
    }

    const slideRemSize = Math.max(1.8, Number((3.0 * (state.fontScale / 100)).toFixed(2)));
    rootEl.innerHTML = `
      <div class="top-bar">
        <span>🟢 BroadcastChannel Connected (&lt;1ms Sync)</span>
        <button id="fs-btn" class="btn-fs">Fullscreen (F11)</button>
      </div>
      <div class="center-stage">
        <div class="citation-pill" style="font-family:${currentFamily};">${refTitle}</div>
        <p class="verse-body" style="font-size:${slideRemSize}rem;font-family:${currentFamily};">« ${c.verseText} »</p>
        <div class="verse-footer" style="font-family:${currentFamily};">— ${c.bookNameAm} ${c.chapter}፥${range} (${c.bookNameEn})</div>
      </div>
      <div style="height:16px;"></div>
    `;

    const fsBtn = doc.getElementById('fs-btn');
    if (fsBtn) {
      fsBtn.onclick = () => {
        doc.documentElement.requestFullscreen?.().catch(() => {});
      };
    }
  };

  const senderId = 'popout-' + Math.random().toString(36).slice(2, 8);
  const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<ProjectorSyncPayload>) => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'PING') {
      channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
      return;
    }
    if (data.customFontData) {
      const cfd = data.customFontData;
      if (cfd.dataUrl && !doc.getElementById(`font-face-${cfd.id}`)) {
        const style = doc.createElement('style');
        style.id = `font-face-${cfd.id}`;
        const formatStr = cfd.format ? `format('${cfd.format}')` : '';
        style.textContent = `
          @font-face {
            font-family: '${cfd.id}';
            src: url('${cfd.dataUrl}') ${formatStr};
            font-display: swap;
          }
        `;
        doc.head.appendChild(style);
      }
    }
    if (data.citation) state.citation = data.citation;
    if (data.theme) state.theme = data.theme;
    if (data.fontFamily) state.fontFamily = data.fontFamily;
    if (typeof data.fontScale === 'number') state.fontScale = data.fontScale;
    if (data.displayMode) state.displayMode = data.displayMode;
    if (typeof data.isBlackout === 'boolean') state.isBlackout = data.isBlackout;
    renderProjector();
  };

  channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
  const heartbeat = popoutWin.setInterval(() => {
    channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
  }, 2500);

  popoutWin.addEventListener('beforeunload', () => {
    popoutWin.clearInterval(heartbeat);
    channel.close();
  });

  renderProjector();
}
