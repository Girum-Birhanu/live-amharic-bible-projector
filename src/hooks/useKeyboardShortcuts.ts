import { useEffect } from 'react';
import { useProjectionStore } from '../store/projection-store';

/**
 * Hook for keyboard shortcuts used by church operators during live services:
 * - Space: Project top item in detected queue
 * - Right/Down arrow: Next verse
 * - Left/Up arrow: Previous verse
 * - B: Toggle blackout mode
 * - Escape: Exit fullscreen mode (operator view only)
 */
export function useKeyboardShortcuts(
  navigateAdjacentVerse: (direction: 1 | -1, source: 'MANUAL') => void,
  isStandaloneProjectorRoute: boolean
): void {
  const detectedQueue = useProjectionStore((s) => s.detectedQueue);
  const isFullscreenProjector = useProjectionStore((s) => s.isFullscreenProjector);
  const setActiveProjection = useProjectionStore((s) => s.setActiveProjection);
  const setIsBlackout = useProjectionStore((s) => s.setIsBlackout);
  const toggleBlackout = useProjectionStore((s) => s.toggleBlackout);
  const setIsFullscreenProjector = useProjectionStore((s) => s.setIsFullscreenProjector);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (detectedQueue.length > 0) {
          setActiveProjection(detectedQueue[0]);
          setIsBlackout(false);
        }
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        navigateAdjacentVerse(1, 'MANUAL');
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        navigateAdjacentVerse(-1, 'MANUAL');
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        toggleBlackout();
      } else if (e.code === 'Escape' && isFullscreenProjector && !isStandaloneProjectorRoute) {
        setIsFullscreenProjector(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    detectedQueue,
    navigateAdjacentVerse,
    isFullscreenProjector,
    isStandaloneProjectorRoute,
    setActiveProjection,
    setIsBlackout,
    toggleBlackout,
    setIsFullscreenProjector
  ]);
}
