import React from 'react';
import { History, Sparkles } from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { formatAmharicRef } from '../../utils/formatters';
import { TRANSLATIONS } from '../../utils/translations';

export function VerseQueue() {
  const detectedQueue = useProjectionStore((s) => s.detectedQueue);
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const autoProject = useProjectionStore((s) => s.autoProject);
  const setActiveProjection = useProjectionStore((s) => s.setActiveProjection);
  const setIsBlackout = useProjectionStore((s) => s.setIsBlackout);
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);

  const isLight = uiTheme === 'light';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;

  return (
    <div
      className={`border rounded-2xl p-4 flex-1 flex flex-col transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          <h2
            className={`text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {t.queueTitle(detectedQueue.length)}
          </h2>
        </div>
        <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {autoProject ? t.queueAutoProjecting : t.queueManualApproval}
        </span>
      </div>

      {detectedQueue.length === 0 ? (
        <div
          className={`flex-1 border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${
            isLight
              ? 'border-slate-300 text-slate-500 bg-slate-50/50'
              : 'border-slate-800 text-slate-500'
          }`}
        >
          <Sparkles className={`w-8 h-8 mb-2 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
          <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.queueEmpty}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {detectedQueue.map((item) => {
            const isCurrentlyLive =
              activeProjection.bookNameAm === item.bookNameAm &&
              activeProjection.chapter === item.chapter &&
              activeProjection.verseStart === item.verseStart &&
              activeProjection.verseEnd === item.verseEnd;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrentlyLive
                    ? isLight
                      ? 'bg-amber-50 border-amber-400 shadow-xs'
                      : 'bg-amber-500/10 border-amber-400/60 shadow-md'
                    : isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    : 'bg-slate-950/80 hover:bg-slate-800/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold text-sm ethiopic-serif ${
                        isLight ? 'text-amber-800' : 'text-amber-300'
                      }`}
                    >
                      {formatAmharicRef(item)}
                    </span>
                    {isCurrentlyLive && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30">
                        {t.onAir}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        item.engine === 'LOCAL_O1_MAP'
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.engine === 'GEMINI_AI'
                          ? isLight
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : isLight
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {item.engine} • {item.latencyMs}ms
                    </span>

                    <button
                      onClick={() => {
                        setActiveProjection(item);
                        setIsBlackout(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        isCurrentlyLive
                          ? isLight
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                      }`}
                    >
                      {isCurrentlyLive ? t.projected : t.goLive}
                    </button>
                  </div>
                </div>
                <p
                  className={`text-xs line-clamp-2 leading-relaxed ethiopic-serif ${
                    isLight ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  {item.verseText}
                </p>
                <div
                  className={`mt-1.5 flex items-center justify-between text-[11px] ${
                    isLight ? 'text-slate-500' : 'text-slate-500'
                  }`}
                >
                  <span className="truncate max-w-[260px]">
                    {t.heard} "{item.rawTranscript}"
                  </span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
