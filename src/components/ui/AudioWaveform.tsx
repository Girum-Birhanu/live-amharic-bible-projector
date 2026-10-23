import React from 'react';
import { useProjectionStore } from '../../store/projection-store';

export interface AudioWaveformProps {
  bars?: number[];
  isActive: boolean;
}

/**
 * Isolated audio waveform visualization bars.
 * Directly subscribes to audioBars so parent containers (SpeechPanel)
 * never re-render when audio bars update.
 */
export function AudioWaveform({ bars: propsBars, isActive }: AudioWaveformProps) {
  const storeBars = useProjectionStore((s) => s.audioBars);
  const bars = propsBars || storeBars;

  return (
    <div className="flex-1 flex items-center justify-between gap-1 h-10 px-2 select-none">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all duration-75 ${
            isActive ? 'bg-gradient-to-t from-amber-500 to-emerald-400' : 'bg-slate-800'
          }`}
          style={{ height: `${isActive ? height : 18}%` }}
        />
      ))}
    </div>
  );
}
