import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Monitor,
  Eye,
  EyeOff,
  Tv,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Sparkles,
  BookOpen,
  Type,
  Plus
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { offlineBibleDB } from '../../services/bible-db';
import { getThemeClasses, formatAmharicRef, getAmharicFontFamily, AMHARIC_FONTS } from '../../utils/formatters';
import type { ProjectorTheme, AmharicFontFamily } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';

interface ProjectorMonitorProps {
  navigateAdjacentVerse: (direction: 1 | -1, source: 'MANUAL') => void;
  onLaunchPopOut?: () => void;
}

export function ProjectorMonitor({ navigateAdjacentVerse, onLaunchPopOut }: ProjectorMonitorProps) {
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const projectorTheme = useProjectionStore((s) => s.projectorTheme);
  const setProjectorTheme = useProjectionStore((s) => s.setProjectorTheme);
  const amharicFont = useProjectionStore((s) => s.amharicFont);
  const setAmharicFont = useProjectionStore((s) => s.setAmharicFont);
  const customFonts = useProjectionStore((s) => s.customFonts);
  const setShowFontManagerModal = useProjectionStore((s) => s.setShowFontManagerModal);
  const displayMode = useProjectionStore((s) => s.displayMode);
  const setDisplayMode = useProjectionStore((s) => s.setDisplayMode);
  const passageSpan = useProjectionStore((s) => s.passageSpan);
  const setPassageSpan = useProjectionStore((s) => s.setPassageSpan);
  const isBlackout = useProjectionStore((s) => s.isBlackout);
  const setIsBlackout = useProjectionStore((s) => s.setIsBlackout);
  const fontScale = useProjectionStore((s) => s.fontScale);
  const adjustFontScale = useProjectionStore((s) => s.adjustFontScale);
  const followScroll = useProjectionStore((s) => s.followScroll);
  const toggleFollowScroll = useProjectionStore((s) => s.toggleFollowScroll);
  const setShowProjectorSetupModal = useProjectionStore((s) => s.setShowProjectorSetupModal);
  const connectedProjectorPeers = useProjectionStore((s) => s.connectedProjectorPeers);
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);
  const peerCount = Object.keys(connectedProjectorPeers).length;

  const isLight = uiTheme === 'light';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;

  const activeTheme = getThemeClasses(projectorTheme);
  const activeFontFamily = getAmharicFontFamily(amharicFont, customFonts);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeVerseRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollDebounceTimerRef = useRef<any>(null);

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

  // Handle user scrolling: When scrolling down, the highlight dynamically follows across every single verse (including first & last)
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || passageItems.length <= 1) return;

    isUserScrollingRef.current = true;
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
    scrollDebounceTimerRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 450);

    if (!followScroll) return;

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const firstVerseNum = passageItems[0]?.verseNum;
    const lastVerseNum = passageItems[passageItems.length - 1]?.verseNum;

    let targetVerseNum: number | null = null;

    // 1. Top Boundary Guard: User is at or near the very top of the chapter -> Highlight first verse
    if (scrollTop <= 20 && firstVerseNum !== undefined) {
      targetVerseNum = firstVerseNum;
    }
    // 2. Bottom Boundary Guard: User is at or near the very bottom of the chapter -> Highlight last verse
    else if (scrollTop + clientHeight >= scrollHeight - 20 && lastVerseNum !== undefined) {
      targetVerseNum = lastVerseNum;
    }
    // 3. Dynamic Focal Line for all intermediate verses
    else {
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const scrollProgress = Math.max(0, Math.min(1, scrollTop / maxScroll));
      const containerRect = container.getBoundingClientRect();

      // Dynamic focal point ratio: seamlessly glides from 22% (top) to 78% (bottom)
      const focalRatio = 0.22 + scrollProgress * 0.56;
      const focalY = containerRect.top + containerRect.height * focalRatio;

      const verseEls = container.querySelectorAll<HTMLElement>('[data-verse]');
      let closestVerseNum: number | null = null;
      let minDistance = Infinity;

      verseEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Check if the focal line is directly inside this verse element
        if (rect.top <= focalY && rect.bottom >= focalY) {
          closestVerseNum = Number(el.getAttribute('data-verse'));
          minDistance = 0;
        } else if (minDistance > 0) {
          const elCenterY = rect.top + rect.height / 2;
          const distance = Math.abs(elCenterY - focalY);
          if (distance < minDistance) {
            minDistance = distance;
            closestVerseNum = Number(el.getAttribute('data-verse'));
          }
        }
      });

      targetVerseNum = closestVerseNum;
    }

    const currentFocused = activeProjection.focusedVerse ?? activeProjection.verseStart;
    if (targetVerseNum && targetVerseNum !== currentFocused) {
      const text = offlineBibleDB.getVerseRangeO1(
        activeProjection.bookId,
        activeProjection.chapter,
        targetVerseNum,
        targetVerseNum
      );
      if (text) {
        const isMultiVerse = activeProjection.verseEnd > activeProjection.verseStart || passageSpan === 'chapter-all';
        useProjectionStore.getState().setActiveProjection({
          ...activeProjection,
          focusedVerse: targetVerseNum,
          verseText: text,
          ...(isMultiVerse ? {} : {
            verseStart: targetVerseNum,
            verseEnd: targetVerseNum
          })
        });
      }
    }
  }, [activeProjection, followScroll, passageItems, passageSpan]);

  // Auto-scroll active verse into center on verse change (only when user is not manually scrolling)
  useEffect(() => {
    if (isUserScrollingRef.current) return;

    const timer = setTimeout(() => {
      if (isUserScrollingRef.current) return;
      if (passageItems.length <= 3) {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (activeVerseRef.current) {
        activeVerseRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [
    activeProjection.bookId,
    activeProjection.chapter,
    activeProjection.verseStart,
    activeProjection.focusedVerse,
    passageSpan,
    passageItems.length
  ]);

  const themes: { id: ProjectorTheme; label: string; color: string }[] = [
    { id: 'royal-navy', label: 'Royal Navy', color: 'bg-blue-500' },
    { id: 'deep-emerald', label: 'Deep Emerald', color: 'bg-emerald-500' },
    { id: 'warm-gold', label: 'Warm Gold', color: 'bg-amber-500' },
    { id: 'pitch-black', label: 'Pitch Black', color: 'bg-neutral-900' },
  ];

  return (
    <div
      className={`border rounded-2xl p-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-amber-500" />
          <h2
            className={`text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {t.monitorTitle}
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE
          </span>
        </div>

        {/* Mode & Blackout Switchers + Project to Wall */}
        <div className="flex items-center gap-2 flex-wrap">
          {onLaunchPopOut && (
            <button
              type="button"
              onClick={onLaunchPopOut}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Opens a clean 16:9 sanctuary window on your external projector screen"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t.popoutHdmi}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowProjectorSetupModal(true)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Setup guide: How to extend display in Windows (Win + P)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Win + P Guide
          </button>

          {/* Passage Context Span Selector */}
          <div
            className={`p-1 rounded-xl border flex items-center text-xs transition-colors ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setPassageSpan('single')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                passageSpan === 'single'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ነጠላ ቁጥር ብቻ (Single Verse Only)"
            >
              {t.singleVerse}
            </button>
            <button
              onClick={() => setPassageSpan('context-3')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                passageSpan === 'context-3'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="3 ቁጥሮች: የቀደመ + ዋና (የደመቀ) + ቀጣይ ቁጥር ለሙሉ አውድ"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t.context3}
            </button>
            <button
              onClick={() => setPassageSpan('chapter-all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                passageSpan === 'chapter-all'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="ሙሉ ምዕራፍ: ሁሉንም ቁጥሮች በሸብልል (Whole Chapter Scrollable)"
            >
              <BookOpen className="w-3 h-3 text-amber-500" />
              {t.chapterAll}
            </button>
          </div>

          {/* Follow Scroll Toggle Button: Replaces 5-verses with dynamic scroll tracking */}
          <button
            type="button"
            onClick={toggleFollowScroll}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              followScroll
                ? isLight
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-xs'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={
              followScroll
                ? 'ተከታይ ማድመቂያ በርቷል (Auto-follow scroll: ON)'
                : 'ተከታይ ማድመቂያ ጠፍቷል (Auto-follow scroll: OFF)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                followScroll ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{t.followScrollLabel}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                followScroll
                  ? isLight
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-400 text-slate-950'
                  : isLight
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {followScroll ? 'ON' : 'OFF'}
            </span>
          </button>

          <div
            className={`p-1 rounded-xl border flex items-center text-xs transition-colors ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setDisplayMode('fullscreen-slide')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                displayMode === 'fullscreen-slide'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.fullscreenSlide}
            </button>
            <button
              onClick={() => setDisplayMode('obs-lower-third')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
                displayMode === 'obs-lower-third'
                  ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3 h-3" /> {t.obsLowerThird}
            </button>
          </div>

          <button
            onClick={() => setIsBlackout(!isBlackout)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isBlackout
                ? 'bg-red-600 text-white border-red-500 shadow-sm'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            {isBlackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isBlackout ? t.blackoutActive : t.blackoutInactive}
          </button>
        </div>
      </div>

      {/* 16:9 MONITOR FRAME */}
      <div
        style={{
          fontFamily: activeFontFamily,
          '--amharic-font-family': activeFontFamily
        } as React.CSSProperties}
        className={`relative aspect-video w-full rounded-2xl overflow-hidden border-2 ${activeTheme.border} shadow-2xl transition-all duration-500 flex flex-col justify-between ${
          displayMode === 'obs-lower-third'
            ? 'bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:16px_16px] bg-emerald-950/95'
            : activeTheme.bg
        }`}
      >
        {isBlackout ? (
          <div className="inset-0 absolute bg-black flex flex-col items-center justify-center text-neutral-600">
            <EyeOff className="w-10 h-10 mb-2 opacity-40" />
            <span className="text-xs uppercase tracking-widest">Projector Blackout Active</span>
          </div>
        ) : displayMode === 'obs-lower-third' ? (
          <div className="flex-1 flex flex-col justify-between p-4 md:p-5">
            <div className="self-start px-3 py-1 rounded-md bg-black/50 text-emerald-300 text-[11px] font-mono">
              OBS Studio Chroma-Key Green Lower-Third Overlay
            </div>
            <div className="w-full bg-slate-950/95 border-l-4 border-amber-400 rounded-r-xl p-4 md:p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-base md:text-lg font-bold text-amber-400 ethiopic-serif"
                  style={{ fontFamily: activeFontFamily }}
                >
                  {formatAmharicRef(
                    activeProjection,
                    passageItems.length > 1
                      ? `${passageItems[0].verseNum} - ${passageItems[passageItems.length - 1].verseNum}`
                      : undefined
                  )}
                </span>
                <span className="text-[11px] text-slate-400">
                  {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
                </span>
              </div>
              {passageItems.length > 1 ? (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {passageItems.map((item) => (
                    <p
                      key={item.verseNum}
                      className={`leading-relaxed ethiopic-serif ${
                        item.isActive ? 'text-amber-200 font-bold' : 'text-slate-300 font-normal'
                      }`}
                      style={{
                        fontFamily: activeFontFamily,
                        fontSize: item.isActive
                          ? `${Math.round(1.15 * (fontScale / 100))}rem`
                          : `${Math.round(0.95 * (fontScale / 100))}rem`
                      }}
                    >
                      <span className="text-amber-400 font-sans font-bold mr-1.5">[{item.verseNum}]</span>
                      {item.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p
                  className="text-white font-semibold leading-relaxed ethiopic-serif"
                  style={{
                    fontFamily: activeFontFamily,
                    fontSize: `${Math.round(1.25 * (fontScale / 100))}rem`
                  }}
                >
                  « {activeProjection.verseText} »
                </p>
              )}
            </div>
          </div>
        ) : passageItems.length > 1 ? (
          /* Multi-Verse Context Passage View: Active verse highlighted + Context flow */
          <div className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 text-center relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
              <div
                className={`px-4 py-1 rounded-full border ${activeTheme.badge} text-xs md:text-sm font-bold shadow-md ethiopic-serif`}
                style={{ fontFamily: activeFontFamily }}
              >
                {formatAmharicRef(
                  activeProjection,
                  `${passageItems[0].verseNum} - ${passageItems[passageItems.length - 1].verseNum}`
                )}
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30"
                style={{ fontFamily: activeFontFamily }}
              >
                ቁጥር {activeProjection.focusedVerse ?? activeProjection.verseStart} ላይ ያተኮረ (Active)
              </span>
              {passageItems.length > 5 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-amber-300 border border-amber-400/30"
                  style={{ fontFamily: activeFontFamily }}
                >
                  ↕ {passageItems.length} ቁጥሮች (ሸብልል • Scrollable)
                </span>
              )}
            </div>

            {/* Passage Flow Container: In 3-verse mode all 3 fit cleanly centered with zero clipping */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={`w-full max-w-4xl flex-1 flex flex-col ${
                passageItems.length > 3
                  ? 'justify-start my-0 pt-2 pb-36 gap-2'
                  : 'justify-center my-auto py-1 gap-1.5'
              } overflow-y-auto sanctuary-scrollbar px-1 scroll-smooth relative`}
            >
              {passageItems.map((item) => (
                <div
                  key={item.verseNum}
                  data-verse={item.verseNum}
                  ref={item.isActive ? activeVerseRef : undefined}
                  onClick={() => {
                    const text = offlineBibleDB.getVerseRangeO1(activeProjection.bookId, activeProjection.chapter, item.verseNum, item.verseNum);
                    if (text) {
                      const isMultiVerse = activeProjection.verseEnd > activeProjection.verseStart || passageSpan === 'chapter-all';
                      useProjectionStore.getState().setActiveProjection({
                        ...activeProjection,
                        focusedVerse: item.verseNum,
                        ...(isMultiVerse ? {} : {
                          verseStart: item.verseNum,
                          verseEnd: item.verseNum,
                          verseText: text
                        })
                      });
                    }
                  }}
                  className={`text-left rounded-xl transition-all cursor-pointer ${
                    item.isActive
                      ? `${passageItems.length <= 3 ? 'p-2 md:p-2.5' : 'p-3 md:p-3.5'} border-2 ${activeTheme.activeVerseBox} scale-[1.01] ring-2 ring-amber-400/30`
                      : `${passageItems.length <= 3 ? 'px-2.5 py-1.5' : 'px-3 py-2'} border border-white/10 bg-black/20 opacity-70 hover:opacity-90 hover:border-amber-400/30`
                  }`}
                  title={`Click to focus verse ${item.verseNum}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        item.isActive ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/15 text-slate-300'
                      }`}
                      style={{ fontFamily: activeFontFamily }}
                    >
                      ቁጥር {item.verseNum}
                    </span>
                    <p
                      className={`leading-relaxed ethiopic-serif ${
                        item.isActive
                          ? `font-bold ${activeTheme.activeVerseText}`
                          : 'font-normal text-slate-200'
                      }`}
                      style={{
                        fontFamily: activeFontFamily,
                        fontSize: item.isActive
                          ? `${passageItems.length <= 3
                              ? Math.max(0.95, Math.round(1.15 * (fontScale / 100) * 10) / 10)
                              : Math.max(1.05, Math.round(1.3 * (fontScale / 100) * 10) / 10)}rem`
                          : `${passageItems.length <= 3
                              ? Math.max(0.78, Math.round(0.92 * (fontScale / 100) * 10) / 10)
                              : Math.max(0.88, Math.round(1.0 * (fontScale / 100) * 10) / 10)}rem`
                      }}
                    >
                      {item.isActive && passageItems.length <= 3 ? `« ${item.text} »` : item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini Scroll Controls for Operator Monitor (Only for long multi-verse chapters) */}
            {passageItems.length > 3 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-10 bg-slate-950/85 p-1 rounded-lg border border-slate-700/60 shadow-lg backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => scrollContainerRef.current?.scrollBy({ top: -140, behavior: 'smooth' })}
                  className="p-1 rounded hover:bg-amber-400 hover:text-slate-950 text-amber-300 transition"
                  title="ወደ ላይ ሸብልል (Scroll Up)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => activeVerseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition text-center"
                  title="Center Active Verse"
                >
                  {activeProjection.focusedVerse ?? activeProjection.verseStart}
                </button>
                <button
                  type="button"
                  onClick={() => scrollContainerRef.current?.scrollBy({ top: 140, behavior: 'smooth' })}
                  className="p-1 rounded hover:bg-amber-400 hover:text-slate-950 text-amber-300 transition"
                  title="ወደ ታች ሸብልል (Scroll Down)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Footer reference */}
            <div
              className={`mt-2 text-[11px] md:text-xs font-medium ${activeTheme.accent}`}
              style={{ fontFamily: activeFontFamily }}
            >
              — መጽሐፍ ቅዱስ (1954 ዕትም) • {activeProjection.bookNameEn} {activeProjection.chapter}:{passageItems[0].verseNum}-{passageItems[passageItems.length - 1].verseNum}
            </div>
          </div>
        ) : (
          /* Single Verse View */
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center relative">
            <div
              className={`px-4 py-1 rounded-full border ${activeTheme.badge} text-sm md:text-base font-bold mb-4 ethiopic-serif`}
              style={{ fontFamily: activeFontFamily }}
            >
              {formatAmharicRef(activeProjection)}
            </div>

            <p
              className={`max-w-3xl font-bold leading-relaxed ethiopic-serif transition-all ${activeTheme.text}`}
              style={{
                fontFamily: getAmharicFontFamily(amharicFont),
                fontSize: `${Math.round(1.65 * (fontScale / 100))}rem`
              }}
            >
              « {activeProjection.verseText} »
            </p>

            <div
              className={`mt-5 text-xs md:text-sm font-medium ${activeTheme.accent}`}
              style={{ fontFamily: getAmharicFontFamily(amharicFont) }}
            >
              — መጽሐፍ ቅዱስ (1954 ዕትም) • {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
            </div>
          </div>
        )}
      </div>

      {/* 16:9 Dual-Screen Church Guidance Strip */}
      <div
        className={`mt-2.5 px-3 py-2 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-600'
            : 'bg-slate-950/80 border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              peerCount > 0 ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
            }`}
          />
          <span>
            {peerCount > 0 ? (
              <span className={isLight ? 'text-emerald-700 font-medium' : 'text-emerald-300 font-medium'}>
                {t.tipConnected(peerCount)}
              </span>
            ) : (
              <span>{t.tipExtend}</span>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowProjectorSetupModal(true)}
          className="text-amber-600 dark:text-amber-400 hover:underline font-semibold text-[11px] shrink-0"
        >
          {t.setupGuideBtn}
        </button>
      </div>

      {/* Projector Bottom Control Strip */}
      <div
        className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-3 transition-colors ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateAdjacentVerse(-1, 'MANUAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition border cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-transparent'
            }`}
          >
            {t.prevVerse}
          </button>
          <button
            onClick={() => navigateAdjacentVerse(1, 'MANUAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition border cursor-pointer ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
            }`}
          >
            {t.nextVerse}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <span>{t.themeLabel}</span>
            {themes.map((themeItem) => (
              <button
                key={themeItem.id}
                onClick={() => setProjectorTheme(themeItem.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 cursor-pointer ${
                  projectorTheme === themeItem.id
                    ? isLight
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                      : 'border-amber-400 bg-slate-800 text-white'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${themeItem.color}`} />
                {themeItem.label}
              </button>
            ))}
          </div>

          {/* Amharic Font Family Selector */}
          <div
            className={`flex items-center gap-1.5 text-xs ${
              isLight ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <span className="flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.fontLabel}</span>
            </span>
            <select
              value={amharicFont}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  setShowFontManagerModal(true);
                } else {
                  setAmharicFont(e.target.value as AmharicFontFamily);
                }
              }}
              className={`border rounded-lg px-2.5 py-1 transition focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans cursor-pointer max-w-[170px] sm:max-w-xs text-xs ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 hover:border-amber-500'
                  : 'bg-slate-950 border-slate-700/80 hover:border-amber-400 text-slate-200'
              }`}
              title="የአማርኛ ፊደል ቅርጸ-ፎንት ይምረጡ (Select Amharic Font)"
            >
              <optgroup label="መደበኛ ፊደላት (Built-in Fonts)">
                {AMHARIC_FONTS.map((font) => (
                  <option
                    key={font.id}
                    value={font.id}
                    className={isLight ? 'bg-white text-slate-800 py-1' : 'bg-slate-900 text-white py-1'}
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {uiLanguage === 'am' ? `${font.amLabel} (${font.label})` : `${font.label} (${font.amLabel})`}
                  </option>
                ))}
              </optgroup>
              {customFonts.length > 0 && (
                <optgroup label="የተጨመሩ የግል ፊደላት (Custom Fonts)">
                  {customFonts.map((cf) => (
                    <option
                      key={cf.id}
                      value={cf.id}
                      className={isLight ? 'bg-amber-50 text-amber-900 py-1' : 'bg-slate-900 text-amber-300 py-1'}
                      style={{ fontFamily: cf.family }}
                    >
                      ⭐ {cf.name} ({cf.sourceType === 'file' ? (uiLanguage === 'am' ? 'ፋይል' : 'File') : (uiLanguage === 'am' ? 'ዊንዶውስ' : 'System')})
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="__ADD_NEW__" className="bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                ➕ {uiLanguage === 'am' ? 'አዲስ ፊደል ከኮምፒውተር ጨምር (Add Custom Font)...' : 'Add Custom Font from PC...'}
              </option>
            </select>

            {/* Quick Add Custom Font (+) Button */}
            <button
              type="button"
              onClick={() => setShowFontManagerModal(true)}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition hover:scale-105 active:scale-95 shrink-0 border cursor-pointer ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
              }`}
              title="አዲስ ፊደል ከኮምፒውተርህ ጨምር (Add Custom Font from Computer)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">{t.addFontBtn}</span>
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div
            className={`flex items-center gap-1 border rounded-lg px-2 py-1 text-xs transition-colors ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => adjustFontScale(-10)}
              className={`px-1.5 font-bold cursor-pointer transition ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              A-
            </button>
            <span
              className={`text-[11px] font-mono ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {fontScale}%
            </span>
            <button
              onClick={() => adjustFontScale(10)}
              className={`px-1.5 font-bold cursor-pointer transition ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
