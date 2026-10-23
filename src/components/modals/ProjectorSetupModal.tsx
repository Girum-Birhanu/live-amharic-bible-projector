import React from 'react';
import {
  Monitor,
  Tv,
  ExternalLink,
  Layers,
  X,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';

interface ProjectorSetupModalProps {
  onLaunchPopOut: () => void;
}

export function ProjectorSetupModal({ onLaunchPopOut }: ProjectorSetupModalProps) {
  const showProjectorSetupModal = useProjectionStore((s) => s.showProjectorSetupModal);
  const setShowProjectorSetupModal = useProjectionStore((s) => s.setShowProjectorSetupModal);
  const isSplitDualScreen = useProjectionStore((s) => s.isSplitDualScreen);
  const setIsSplitDualScreen = useProjectionStore((s) => s.setIsSplitDualScreen);
  const setIsFullscreenProjector = useProjectionStore((s) => s.setIsFullscreenProjector);
  const connectedProjectorPeers = useProjectionStore((s) => s.connectedProjectorPeers);

  const peerCount = Object.keys(connectedProjectorPeers).length;

  if (!showProjectorSetupModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowProjectorSetupModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              የፕሮጀክተር አጠቃቀም መመሪያ
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 font-normal">
                Dual-Screen Setup Guide
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              How to project ONLY the 16:9 scripture slide onto the church wall while keeping your controls private.
            </p>
          </div>
        </div>

        {/* The Problem & Solution Visual Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            ለምን ሙሉው ገጽ በግድግዳው (Projector) ላይ ታየ? (Why the whole dashboard was projected):
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            በነባሪነት (Default) Windows ኮምፒውተሩን ከፕሮጀክተር ጋር ስታገናኙት ምስሉን <span className="text-amber-300 font-bold">"Duplicate" (ኮፒ)</span> ያደርገዋል። ስለዚህ በላፕቶፕህ የምትሰራው ሙሉው መቆጣጠሪያ (ድምፅ መቅረጫ፣ ሲሙሌተር፣ ቁልፎች) በግድግዳው ላይ ለምዕመናን ይታያል።
          </p>
        </div>

        {/* 3 Simple Steps */}
        <div className="space-y-3 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            መፍትሔው በ3 ቀላል ደረጃዎች (The 3-Step Setup):
          </h3>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs text-slate-200">
              <span className="font-bold text-white">የዊንዶውስ ስክሪን ሁነታን "Extend" (ተዘርግቷል) አድርግ:</span>
              <p className="text-slate-400 mt-0.5">
                በላፕቶፕህ ኪቦርድ ላይ <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]">Win + P</kbd> ን ተጫንና ከሚመጡት ምርጫዎች <span className="text-emerald-300 font-semibold">"Extend"</span> የሚለውን ምረጥ።
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs text-slate-200">
              <span className="font-bold text-white">የ16:9 ንፁህ መስኮት ለብቻው ክፈት (Launch 16:9 Window):</span>
              <p className="text-slate-400 mt-0.5">
                ከታች ያለውን <span className="text-amber-300 font-semibold">"🚀 Launch 16:9 Projector Window"</span> የሚለውን ቁልፍ ተጫን። የተከፈተውን የጥቅስ መስኮት ወደ ፕሮጀክተሩ ስክሪን ጎትተው (Drag to projector screen)።
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs text-slate-200">
              <span className="font-bold text-white">ሙሉ ስክሪን አድርገው (Full-Screen F11):</span>
              <p className="text-slate-400 mt-0.5">
                በፕሮጀክተሩ መስኮት ላይ <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]">F11</kbd> ን ተጫን ወይም በማንኛውም ቦታ ሁለት ጊዜ ክሊክ (Double-Click) አድርግ። በግድግዳው ላይ ንፁህ 16:9 ጥቅስ ብቻ ይሞላል!
              </p>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {peerCount > 0
                ? `የፕሮጀክተር መስኮት ተገናኝቷል (${peerCount} መስኮት በርቷል • <1ms Sync)`
                : 'BroadcastChannel (<1ms real-time multi-window sync) ዝግጁ ነው'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Zero-Lag Sync</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
          {/* Split Dual-Screen alternative for single monitor */}
          <button
            type="button"
            onClick={() => {
              setIsSplitDualScreen(!isSplitDualScreen);
              setShowProjectorSetupModal(false);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            {isSplitDualScreen ? 'Exit Split Screen' : 'በአንድ ስክሪን ላይ ጎን ለጎን አሳይ (Split View)'}
          </button>

          {/* Pop-Out HDMI Projector Window button */}
          <button
            type="button"
            onClick={() => {
              onLaunchPopOut();
              setShowProjectorSetupModal(false);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 flex items-center gap-2 transition"
          >
            <ExternalLink className="w-4 h-4" />
            🚀 Launch 16:9 Projector Window Now
          </button>
        </div>
      </div>
    </div>
  );
}
