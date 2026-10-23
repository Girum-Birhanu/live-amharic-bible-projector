import React from 'react';
import { Cpu } from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';

export function ArchitectureModal() {
  const showArchitectureModal = useProjectionStore((s) => s.showArchitectureModal);
  const setShowArchitectureModal = useProjectionStore((s) => s.setShowArchitectureModal);

  if (!showArchitectureModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">
              Production Architecture: IndexedDB O(1) Engine + BroadcastChannel Dual-Monitor
            </h3>
          </div>
          <button
            onClick={() => setShowArchitectureModal(false)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
          >
            Close
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
              <div className="font-bold text-emerald-400 mb-1">
                1. OfflineAmharicBibleDB (IndexedDB + Map)
              </div>
              <p className="text-xs text-slate-400">
                Stores all verses in <code>IndexedDB ('KaleEgziabherBibleDB')</code> and indexes them into a flat <code>{'Map<"bookId-chapter-verse", Record>'}</code> for 0.01ms lookups. Any verse fetched via Gemini AI is automatically saved to IndexedDB.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30">
              <div className="font-bold text-cyan-400 mb-1">
                2. BroadcastChannel ('kale_egziabher_projector_v1')
              </div>
              <p className="text-xs text-slate-400">
                Synchronizes operator actions (<code>SHOW_VERSE</code>, <code>BLACKOUT</code>, <code>UPDATE_STYLE</code>, and <code>PING/PONG</code> heartbeat) with the Pop-Out HDMI Projector Window in under 1 millisecond without a backend server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
