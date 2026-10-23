import React from 'react';
import {
  Database,
  ExternalLink,
  Layers,
  Maximize2,
  Sun,
  Moon,
  Languages,
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { TRANSLATIONS } from '../../utils/translations';

interface HeaderProps {
  onLaunchPopOut: () => void;
}

export function Header({ onLaunchPopOut }: HeaderProps) {
  const totalIndexedVerses = useProjectionStore((s) => s.totalIndexedVerses);
  const autoProject = useProjectionStore((s) => s.autoProject);
  const setAutoProject = useProjectionStore((s) => s.setAutoProject);
  const isSplitDualScreen = useProjectionStore((s) => s.isSplitDualScreen);
  const setIsSplitDualScreen = useProjectionStore((s) => s.setIsSplitDualScreen);
  const setIsFullscreenProjector = useProjectionStore((s) => s.setIsFullscreenProjector);
  const setShowDbModal = useProjectionStore((s) => s.setShowDbModal);
  const connectedProjectorPeers = useProjectionStore((s) => s.connectedProjectorPeers);
  const lastBroadcastLatencyMs = useProjectionStore((s) => s.lastBroadcastLatencyMs);
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const setUiTheme = useProjectionStore((s) => s.setUiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);
  const setUiLanguage = useProjectionStore((s) => s.setUiLanguage);

  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;
  const isLight = uiTheme === 'light';

  const peerCount = Object.keys(connectedProjectorPeers).length;
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header
      className={`border-b px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-md transition-colors ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900/90 border-slate-800/80 text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl shrink-0">
          ✞
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className={`text-base md:text-lg font-bold tracking-tight transition-colors ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {t.headerTitle}
            </h1>
            {/* Dual-Monitor BroadcastChannel Sync Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                peerCount > 0 || isSplitDualScreen
                  ? isLight
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="BroadcastChannel ('kale_egziabher_projector_v1') real-time multi-window synchronization"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  peerCount > 0 || isSplitDualScreen ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
                }`}
              />
              {peerCount > 0
                ? t.syncedBadge(peerCount, lastBroadcastLatencyMs)
                : isSplitDualScreen
                ? t.splitActiveBadge
                : t.broadcastReadyBadge}
            </span>

            {/* Network / Offline Mode Indicator Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                isOnline
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : isLight
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
              title={
                isOnline
                  ? 'Online: Chrome Live Amharic Mic & Gemini AI available'
                  : 'Offline: 100% Local 66-Book IndexedDB (~0.01ms O(1)) active. Use Simulator presets or Phrase box'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {isOnline ? t.onlineBadge : t.offlineBadge}
            </span>
          </div>
          <p className={`text-xs transition-colors ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.headerSubtitle(totalIndexedVerses)}
          </p>
        </div>
      </div>

      {/* Right Header Action Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Day / Night Mode Toggle */}
        <button
          onClick={() => setUiTheme(isLight ? 'dark' : 'light')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-sm ${
            isLight
              ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
          }`}
          title={isLight ? t.nightMode : t.dayMode}
        >
          {isLight ? (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.nightMode}</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.dayMode}</span>
            </>
          )}
        </button>

        {/* Amharic / English Language Toggle */}
        <div
          className={`flex items-center rounded-xl p-0.5 border text-xs font-semibold shadow-sm transition-colors ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-800 border-slate-700'
          }`}
          title="Switch UI Language / ቋንቋ ይቀይሩ"
        >
          <button
            onClick={() => setUiLanguage('am')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              uiLanguage === 'am'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3 h-3" />
            አማርኛ
          </button>
          <button
            onClick={() => setUiLanguage('en')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              uiLanguage === 'en'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Offline DB Manager (IndexedDB) Button */}
        <button
          onClick={() => setShowDbModal(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
            isLight
              ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
              : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-400/40 text-indigo-200'
          }`}
        >
          <Database className={`w-3.5 h-3.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
          {t.offlineDbBtn(totalIndexedVerses)}
        </button>

        {/* Auto-Live vs Manual Queue Safety Switch */}
        <button
          onClick={() => setAutoProject(!autoProject)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            autoProject
              ? isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : isLight
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${autoProject ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {autoProject ? t.autoLiveOn : t.manualQueueMode}
        </button>

        {/* Pop-Out External HDMI Projector Window */}
        <button
          onClick={onLaunchPopOut}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
          }`}
          title="Opens a secondary browser window synced via BroadcastChannel for your HDMI projector"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {t.popoutHdmi}
        </button>

        {/* In-App Split Dual-Screen Toggle */}
        <button
          onClick={() => setIsSplitDualScreen(!isSplitDualScreen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
            isSplitDualScreen
              ? isLight
                ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {isSplitDualScreen ? t.exitSplitView : t.splitDualScreen}
        </button>

        {/* Fullscreen Projector Button */}
        <button
          onClick={() => setIsFullscreenProjector(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {t.fullscreen}
        </button>
      </div>
    </header>
  );
}
