import React from 'react';
import { Radio, Play, Code2 } from 'lucide-react';
import { PREACHER_SIMULATION_PRESETS } from '../../data/preacher-presets';
import { useProjectionStore } from '../../store/projection-store';
import { TRANSLATIONS } from '../../utils/translations';

interface SimulatorBarProps {
  onSimulate: (utterance: string) => void;
  onShowArchitecture: () => void;
}

export function SimulatorBar({ onSimulate, onShowArchitecture }: SimulatorBarProps) {
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);
  const isLight = uiTheme === 'light';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;

  return (
    <div
      className={`border-b px-4 lg:px-6 py-2.5 transition-colors ${
        isLight
          ? 'bg-slate-50/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-amber-800' : 'text-amber-400'
            }`}
          >
            {t.simulatorTitle}
          </span>
        </div>
        <button
          onClick={onShowArchitecture}
          className={`text-[11px] flex items-center gap-1 transition ${
            isLight ? 'text-slate-600 hover:text-amber-700' : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> {t.viewArchitecture}
        </button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {PREACHER_SIMULATION_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => onSimulate(preset.utterance)}
            className={`shrink-0 group px-3 py-1.5 rounded-xl border text-left flex items-center gap-2 transition ${
              isLight
                ? 'bg-white hover:bg-amber-50/70 border-slate-200 hover:border-amber-400 shadow-xs'
                : 'bg-slate-800/90 hover:bg-amber-500/15 border-slate-700/80 hover:border-amber-400/50'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition" />
            <div>
              <div
                className={`text-xs font-bold flex items-center gap-1.5 transition ${
                  isLight
                    ? 'text-slate-800 group-hover:text-amber-700'
                    : 'text-slate-100 group-hover:text-amber-300'
                }`}
              >
                {preset.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isLight
                      ? 'bg-slate-100 text-emerald-700 border border-slate-200'
                      : 'bg-slate-900 text-emerald-400'
                  }`}
                >
                  {preset.category}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
