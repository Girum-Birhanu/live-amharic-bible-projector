import React, { useMemo } from 'react';
import { useProjectionStore } from '../../store/projection-store';
import { offlineBibleDB } from '../../services/bible-db';
import { getThemeClasses, formatAmharicRef, getAmharicFontFamily } from '../../utils/formatters';

export function SplitDualScreen() {
  const isSplitDualScreen = useProjectionStore((s) => s.isSplitDualScreen);
  const setIsSplitDualScreen = useProjectionStore((s) => s.setIsSplitDualScreen);
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const projectorTheme = useProjectionStore((s) => s.projectorTheme);
  const amharicFont = useProjectionStore((s) => s.amharicFont);
  const customFonts = useProjectionStore((s) => s.customFonts);
  const passageSpan = useProjectionStore((s) => s.passageSpan);
  const isBlackout = useProjectionStore((s) => s.isBlackout);

  const activeTheme = getThemeClasses(projectorTheme);
  const activeFontFamily = getAmharicFontFamily(amharicFont, customFonts);

  const passageItems = useMemo(() => {
    return offlineBibleDB.getContextPassage(
      activeProjection.bookId,
      activeProjection.chapter,
      activeProjection.verseStart,
      activeProjection.verseEnd,
      passageSpan,
      activeProjection.focusedVerse
    );
  }, [activeProjection, passageSpan]);

  if (!isSplitDualScreen) return null;

  return (
    <div className="bg-slate-900/90 border-b-2 border-cyan-500/40 p-4 lg:px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              MONITOR 2 • LIVE HDMI SANCTUARY PROJECTOR WINDOW (BroadcastChannel Synced)
            </span>
            <span className="text-xs text-slate-400">
              Changes in the Operator Deck below update this secondary screen in &lt;1ms
            </span>
          </div>
          <button
            onClick={() => setIsSplitDualScreen(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Close Split Monitor ✕
          </button>
        </div>
        <div
          className={`w-full min-h-64 rounded-2xl border-2 ${activeTheme.border} overflow-hidden flex flex-col items-center justify-center p-5 text-center relative shadow-2xl ${
            isBlackout ? 'bg-black' : activeTheme.bg
          }`}
          style={{
            fontFamily: activeFontFamily,
            '--amharic-font-family': activeFontFamily
          } as React.CSSProperties}
        >
          {isBlackout ? (
            <span className="text-neutral-700 text-xs uppercase tracking-widest">HDMI Monitor 2 Blackout</span>
          ) : passageItems.length > 1 ? (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-2 py-1">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`px-4 py-0.5 rounded-full border ${activeTheme.badge} text-sm font-bold ethiopic-serif`}
                  style={{ fontFamily: activeFontFamily }}
                >
                  {formatAmharicRef(
                    activeProjection,
                    `${passageItems[0].verseNum} - ${passageItems[passageItems.length - 1].verseNum}`
                  )}
                </div>
                <span
                  className="text-[11px] font-mono text-amber-400/90"
                  style={{ fontFamily: activeFontFamily }}
                >
                  (ቁጥር {activeProjection.focusedVerse ?? activeProjection.verseStart} የደመቀ)
                </span>
              </div>
              <div className="w-full flex flex-col gap-2 max-h-52 overflow-y-auto no-scrollbar">
                {passageItems.map((item) => (
                  <div
                    key={item.verseNum}
                    className={`text-left rounded-xl p-2.5 transition-all ${
                      item.isActive
                        ? `border-2 ${activeTheme.activeVerseBox}`
                        : 'border border-white/10 bg-black/25 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.isActive ? 'bg-amber-400 text-slate-950' : 'bg-white/15 text-slate-300'
                        }`}
                        style={{ fontFamily: activeFontFamily }}
                      >
                        ቁጥር {item.verseNum}
                      </span>
                      <p
                        className={`text-sm leading-relaxed ethiopic-serif ${
                          item.isActive ? `font-bold ${activeTheme.activeVerseText}` : 'text-slate-200'
                        }`}
                        style={{ fontFamily: activeFontFamily }}
                      >
                        {item.isActive ? `« ${item.text} »` : item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                className={`px-4 py-1 rounded-full border ${activeTheme.badge} text-base font-bold mb-3 ethiopic-serif`}
                style={{ fontFamily: activeFontFamily }}
              >
                {formatAmharicRef(activeProjection)}
              </div>
              <p
                className={`max-w-4xl font-bold text-xl md:text-2xl leading-relaxed ethiopic-serif ${activeTheme.text}`}
                style={{ fontFamily: activeFontFamily }}
              >
                « {activeProjection.verseText} »
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
