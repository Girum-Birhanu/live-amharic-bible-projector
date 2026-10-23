import { useEffect, useRef } from 'react';
import { useProjectionStore } from '../store/projection-store';
import { sessionManager } from '../services/session-manager';
import { SessionSnapshot } from '../types';
import { SESSION_AUTO_SAVE_INTERVAL_MS } from '../utils/constants';

/**
 * Build snapshot directly from current Zustand state snapshot without
 * triggering component re-renders.
 */
function getLatestSnapshot(): SessionSnapshot {
  const s = useProjectionStore.getState();
  return {
    activeProjection: s.activeProjection,
    detectedQueue: s.detectedQueue,
    selectedBookId: s.selectedBookId,
    selectedChapter: s.selectedChapter,
    selectedVerse: s.selectedVerse,
    isBlackout: s.isBlackout,
    settings: {
      theme: s.projectorTheme,
      displayMode: s.displayMode,
      fontScale: s.fontScale,
      autoProject: s.autoProject,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Hook for persisting and restoring projector service sessions and operator preferences.
 * Uses targeted selectors and stable callbacks to avoid re-render thrashing.
 */
export function useSession() {
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore session & preferences once on mount
  useEffect(() => {
    const s = useProjectionStore.getState();
    const snapshot = sessionManager.restoreSnapshot();
    if (snapshot) {
      s.setActiveProjection(snapshot.activeProjection);
      s.setIsBlackout(snapshot.isBlackout);
      s.setSelectedBookId(snapshot.selectedBookId);
      s.setSelectedChapter(snapshot.selectedChapter);
      s.setSelectedVerse(snapshot.selectedVerse);
    }

    const prefs = sessionManager.restorePreferences();
    if (prefs) {
      s.setProjectorTheme(prefs.theme);
      s.setDisplayMode(prefs.displayMode);
      s.setFontScale(prefs.fontScale);
      s.setAutoProject(prefs.autoProject);
    }
  }, []);

  // Periodic Auto-save (every 30 seconds, stable timer)
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      sessionManager.saveSnapshot(getLatestSnapshot());
    }, SESSION_AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  // Save on active projection change only (targeted selector on citation ID)
  const activeCitationId = useProjectionStore((s) => s.activeProjection.id);
  useEffect(() => {
    sessionManager.saveSnapshot(getLatestSnapshot());
  }, [activeCitationId]);

  // Save preferences only when actual preference properties change
  const projectorTheme = useProjectionStore((s) => s.projectorTheme);
  const displayMode = useProjectionStore((s) => s.displayMode);
  const fontScale = useProjectionStore((s) => s.fontScale);
  const autoProject = useProjectionStore((s) => s.autoProject);

  useEffect(() => {
    sessionManager.savePreferences({
      theme: projectorTheme,
      displayMode,
      fontScale,
      autoProject,
    });
  }, [projectorTheme, displayMode, fontScale, autoProject]);

  // Save snapshot on beforeunload (browser tab close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionManager.saveSnapshot(getLatestSnapshot());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    getLastSessionInfo: sessionManager.getLastSessionInfo.bind(sessionManager),
    clearSession: sessionManager.clearSession.bind(sessionManager),
  };
}
