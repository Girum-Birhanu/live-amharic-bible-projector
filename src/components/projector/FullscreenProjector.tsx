import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  EyeOff,
  Sparkles,
  BookOpen,
  Type,
  Plus
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { offlineBibleDB } from '../../services/bible-db';
import { getThemeClasses, formatAmharicRef, getAmharicFontFamily, AMHARIC_FONTS } from '../../utils/formatters';
import type { AmharicFontFamily } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';

interface FullscreenProjectorProps {
  navigateAdjacentVerse: (direction: 1 | -1, source: 'MANUAL') => void;
  isStandaloneProjectorRoute: boolean;
}

export function FullscreenProjector({ navigateAdjacentVerse, isStandaloneProjectorRoute }: FullscreenProjectorProps) {
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const projectorTheme = useProjectionStore((s) => s.projectorTheme);
  const amharicFont = useProjectionStore((s) => s.amharicFont);
  const setAmharicFont = useProjectionStore((s) => s.setAmharicFont);
  const customFonts = useProjectionStore((s) => s.customFonts);
  const setShowFontManagerModal = useProjectionStore((s) => s.setShowFontManagerModal);
  const displayMode = useProjectionStore((s) => s.displayMode);
  const passageSpan = useProjectionStore((s) => s.passageSpan);
  const setPassageSpan = useProjectionStore((s) => s.setPassageSpan);
  const isBlackout = useProjectionStore((s) => s.isBlackout);
  const fontScale = useProjectionStore((s) => s.fontScale);
  const setIsFullscreenProjector = useProjectionStore((s) => s.setIsFullscreenProjector);
  const followScroll = useProjectionStore((s) => s.followScroll);
  const toggleFollowScroll = useProjectionStore((s) => s.toggleFollowScroll);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);

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

  // Smooth scroll helper
  const scrollByAmount = useCallback((amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ top: amount, behavior: 'smooth' });
    }
  }, []);

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
    if (scrollTop <= 24 && firstVerseNum !== undefined) {
      targetVerseNum = firstVerseNum;
    }
    // 2. Bottom Boundary Guard: User is at or near the very bottom of the chapter -> Highlight last verse
    else if (scrollTop + clientHeight >= scrollHeight - 24 && lastVerseNum !== undefined) {
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
        // In 3-verse context mode, all 3 verses fit neatly on screen; keep at top so verse 1 & 3 are never cut off
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

  // Keyboard navigation for scrolling (PageUp, PageDown, Home, End, Shift+Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'PageDown' || (e.shiftKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        scrollByAmount(window.innerHeight * 0.65);
      } else if (e.key === 'PageUp' || (e.shiftKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        scrollByAmount(-window.innerHeight * 0.65);
      } else if (e.key === 'Home') {
        if (scrollContainerRef.current) {
          e.preventDefault();
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (e.key === 'End') {
        if (scrollContainerRef.current) {
          e.preventDefault();
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollByAmount]);

  return (
    <div
      onDoubleClick={() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none transition-all duration-500 ${
        displayMode === 'obs-lower-third' ? 'bg-emerald-950/95' : activeTheme.bg
      }`}
      style={{
        fontFamily: activeFontFamily,
        '--amharic-font-family': activeFontFamily
      } as React.CSSProperties}
    >
      {/* Top Floating Controls (Hidden unless hovered) */}
      <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 p-4 flex items-center justify-between bg-black/70 backdrop-blur-md text-white z-20">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-red-600 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 font-sans">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE SANCTUARY PROJECTOR
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-sans">
            BroadcastChannel Sync Active (&lt;1ms)
          </span>
        </div>
        <div className="flex items-center gap-2 font-sans flex-wrap">
          {/* Amharic Font Family Selector & Custom Font Button */}
          <div className="bg-slate-900/90 border border-slate-700/80 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs">
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={amharicFont}
              onChange={(e) => {
                if (e.target.value === '__ADD_NEW__') {
                  setShowFontManagerModal(true);
                } else {
                  setAmharicFont(e.target.value as AmharicFontFamily);
                }
              }}
              className="bg-transparent text-white text-xs border-none focus:ring-0 cursor-pointer font-sans max-w-[170px]"
              title="የአማርኛ ፊደል ቅርጸ-ፎንት ይምረጡ (Select Amharic Font)"
            >
              <optgroup label="መደበኛ ፊደላት (Built-in Fonts)">
                {AMHARIC_FONTS.map((font) => (
                  <option
                    key={font.id}
                    value={font.id}
                    className="bg-slate-900 text-white py-1"
                    style={{ fontFamily: font.fontFamily }}
                  >
                    {font.amLabel} ({font.label})
                  </option>
                ))}
              </optgroup>
              {customFonts.length > 0 && (
                <optgroup label="የተጨመሩ የግል ፊደላት (Custom Fonts)">
                  {customFonts.map((cf) => (
                    <option
                      key={cf.id}
                      value={cf.id}
                      className="bg-slate-900 text-amber-300 py-1"
                      style={{ fontFamily: cf.family }}
                    >
                      ⭐ {cf.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="__ADD_NEW__" className="bg-amber-500/20 text-amber-300 font-bold">
                ➕ {uiLanguage === 'am' ? 'አዲስ ፊደል ጨምር (Add Custom Font)...' : 'Add Custom Font...'}
              </option>
            </select>
            <button
              type="button"
              onClick={() => setShowFontManagerModal(true)}
              className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition cursor-pointer"
              title={uiLanguage === 'am' ? 'አዲስ ፊደል ከኮምፒውተርህ ጨምር (Add Custom Font)' : 'Add Custom Font from Computer'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Passage Context Span Switcher */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setPassageSpan('single')}
              className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                passageSpan === 'single'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Single Verse"
            >
              {t.singleVerse}
            </button>
            <button
              onClick={() => setPassageSpan('context-3')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 cursor-pointer ${
                passageSpan === 'context-3'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="3 Verses Context"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t.context3}
            </button>
            <button
              onClick={() => setPassageSpan('chapter-all')}
              className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 cursor-pointer ${
                passageSpan === 'chapter-all'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Whole Chapter"
            >
              <BookOpen className="w-3 h-3 text-amber-500" />
              {t.chapterAll}
            </button>
          </div>

          {/* Follow Scroll Toggle Button: Replaces 5-verses with dynamic scroll tracking */}
          <button
            type="button"
            onClick={toggleFollowScroll}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
              followScroll
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={
              followScroll
                ? 'ተከታይ ማድመቂያ በርቷል፡ ስክሮል ሲያደርጉ ማድመቂያው አብሮ ይከተላል (Auto-follow scroll: ON)'
                : 'ተከታይ ማድመቂያ ጠፍቷል፡ ማድመቂያው ባለበት ይቆያል (Auto-follow scroll: OFF)'
            }
          >
            <span className={`w-2 h-2 rounded-full ${followScroll ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>ተከታይ ማድመቂያ</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${followScroll ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              {followScroll ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => navigateAdjacentVerse(-1, 'MANUAL')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> ቀዳሚ ቁጥር
          </button>
          <button
            onClick={() => navigateAdjacentVerse(1, 'MANUAL')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm flex items-center gap-1"
          >
            ቀጣይ ቁጥር <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-sm flex items-center gap-1.5 shadow-md"
            title="Toggle Fullscreen Projector (F11)"
          >
            <Maximize2 className="w-4 h-4" /> Fullscreen (F11)
          </button>
          {!isStandaloneProjectorRoute && (
            <button
              onClick={() => setIsFullscreenProjector(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm flex items-center gap-1.5"
            >
              <Minimize2 className="w-4 h-4" /> Return to Control Deck
            </button>
          )}
        </div>
      </div>

      {/* Main Sanctuary Display Content */}
      {isBlackout ? (
        <div className="flex-1 bg-black flex items-center justify-center">
          <p className="text-neutral-800 text-sm font-sans">BLACKOUT ACTIVE (Press B to restore)</p>
        </div>
      ) : displayMode === 'obs-lower-third' ? (
        <div className="flex-1 flex flex-col justify-end p-10 pb-14">
          <div className="max-w-6xl mx-auto w-full bg-slate-950/95 border-l-8 border-amber-400 rounded-r-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-2xl font-bold text-amber-400 tracking-wide ethiopic-serif"
                style={{ fontFamily: activeFontFamily }}
              >
                {formatAmharicRef(
                  activeProjection,
                  passageItems.length > 1
                    ? `${passageItems[0].verseNum} - ${passageItems[passageItems.length - 1].verseNum}`
                    : undefined
                )}
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-sans">
                መጽሐፍ ቅዱስ (1954) • {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
              </span>
            </div>
            {passageItems.length > 1 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto sanctuary-scrollbar pr-2">
                {passageItems.map((item) => (
                  <p
                    key={item.verseNum}
                    className={`leading-relaxed ethiopic-serif ${
                      item.isActive ? 'text-amber-200 font-bold' : 'text-slate-300 font-normal'
                    }`}
                    style={{
                      fontFamily: activeFontFamily,
                      fontSize: item.isActive
                        ? `${Math.round(1.8 * (fontScale / 100))}rem`
                        : `${Math.round(1.3 * (fontScale / 100))}rem`
                    }}
                  >
                    <span className="text-amber-400 font-sans font-bold mr-2">[{item.verseNum}]</span>
                    {item.text}
                  </p>
                ))}
              </div>
            ) : (
              <p
                className="text-white font-semibold leading-relaxed ethiopic-serif"
                style={{
                  fontFamily: activeFontFamily,
                  fontSize: `${Math.round(2.1 * (fontScale / 100))}rem`
                }}
              >
                « {activeProjection.verseText} »
              </p>
            )}
          </div>
        </div>
      ) : passageItems.length > 1 ? (
        /* Sanctuary Multi-Verse Context Flow: Prominently illuminated active verse + full scrollable context */
        <div className={`flex-1 flex flex-col items-center justify-between px-4 md:px-12 ${
          passageItems.length <= 3 ? 'py-3 md:py-4' : 'py-6'
        } text-center relative overflow-hidden`}>
          {/* Header Badge */}
          <div className="flex flex-col items-center mb-2 shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <div
                className={`px-6 py-1.5 rounded-full border ${activeTheme.badge} text-lg md:text-xl font-bold tracking-wide shadow-xl ethiopic-serif`}
                style={{ fontFamily: activeFontFamily }}
              >
                {formatAmharicRef(
                  activeProjection,
                  `${passageItems[0].verseNum} - ${passageItems[passageItems.length - 1].verseNum}`
                )}
              </div>
              <span
                className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/25 text-amber-300 border border-amber-400/40 font-mono shadow"
                style={{ fontFamily: activeFontFamily }}
              >
                ቁጥር {activeProjection.focusedVerse ?? activeProjection.verseStart} ላይ ያተኮረ (Active Verse)
              </span>
              {passageItems.length > 5 && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900/90 text-amber-300 border border-amber-400/30 flex items-center gap-1.5 shadow"
                  style={{ fontFamily: activeFontFamily }}
                >
                  ↕ {passageItems.length} ቁጥሮች (ሙሉ በሙሉ ተንቀሳቃሽ • Scrollable)
                </span>
              )}
            </div>
            <div className={`w-64 h-0.5 mt-2 bg-gradient-to-r ${activeTheme.ornament}`} />
          </div>

          {/* Multi-Verse Flowing Cards: In 3-verse mode all 3 fit cleanly centered with zero clipping */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`w-full max-w-5xl flex-1 flex flex-col ${
              passageItems.length > 3
                ? 'justify-start my-0 pt-4 pb-64 gap-3 md:gap-4'
                : 'justify-center my-auto py-1 gap-2 md:gap-2.5'
            } overflow-y-auto sanctuary-scrollbar px-3 scroll-smooth`}
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
                className={`text-left rounded-2xl transition-all duration-300 cursor-pointer ${
                  item.isActive
                    ? `${passageItems.length <= 3 ? 'p-3 md:p-3.5' : 'p-4 md:p-5'} border-2 ${activeTheme.activeVerseBox} scale-[1.01] ring-2 ring-amber-400/40`
                    : `${passageItems.length <= 3 ? 'px-3.5 py-2 md:py-2.5' : 'px-4 py-3.5'} border border-white/10 bg-black/35 opacity-70 hover:opacity-95 hover:border-amber-400/30 hover:bg-black/50`
                }`}
                title={`Click to focus verse ${item.verseNum}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-lg text-xs md:text-sm font-bold shadow ${
                      item.isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/15 text-slate-300'
                    }`}
                    style={{ fontFamily: activeFontFamily }}
                  >
                    ቁጥር {item.verseNum}
                  </span>
                  <p
                    className={`leading-relaxed ethiopic-serif ${
                      item.isActive
                        ? `font-bold ${activeTheme.activeVerseText}`
                        : 'font-medium text-slate-200'
                    }`}
                    style={{
                      fontFamily: activeFontFamily,
                      fontSize: item.isActive
                        ? `${passageItems.length <= 3
                            ? Math.max(1.15, Math.round(1.5 * (fontScale / 100) * 10) / 10)
                            : Math.max(1.35, Math.round(1.95 * (fontScale / 100) * 10) / 10)}rem`
                        : `${passageItems.length <= 3
                            ? Math.max(0.95, Math.round(1.15 * (fontScale / 100) * 10) / 10)
                            : Math.max(1.05, Math.round(1.4 * (fontScale / 100) * 10) / 10)}rem`
                    }}
                  >
                    {item.isActive && passageItems.length <= 3 ? `« ${item.text} »` : item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Sanctuary Scroll Controls (Right edge of screen - only for long multi-verse chapters) */}
          {passageItems.length > 3 && (
            <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-30 opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={() => scrollByAmount(-350)}
                className="p-3 rounded-full bg-slate-950/85 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/40 text-amber-300 shadow-2xl backdrop-blur-md transition-all active:scale-95"
                title="ወደ ላይ ተንቀሳቃሽ (Scroll Up • PageUp / ↑)"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  if (activeVerseRef.current) {
                    activeVerseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="px-2.5 py-1 rounded-full bg-slate-950/90 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold shadow backdrop-blur-md transition-all text-center"
                title="ወደ ደመቀው ቁጥር ሂድ (Center Active Verse)"
                style={{ fontFamily: activeFontFamily }}
              >
                ቁ. {activeProjection.focusedVerse ?? activeProjection.verseStart}
              </button>
              <button
                onClick={() => scrollByAmount(350)}
                className="p-3 rounded-full bg-slate-950/85 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/40 text-amber-300 shadow-2xl backdrop-blur-md transition-all active:scale-95"
                title="ወደ ታች ተንቀሳቃሽ (Scroll Down • PageDown / ↓)"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Sanctuary Footer */}
          <div className="mt-2 flex items-center gap-3 opacity-80 shrink-0">
            <span
              className={`text-xs md:text-sm font-medium ${activeTheme.accent}`}
              style={{ fontFamily: activeFontFamily }}
            >
              — {activeProjection.bookNameAm} {activeProjection.chapter}፥{passageItems[0].verseNum}-{passageItems[passageItems.length - 1].verseNum} ({activeProjection.bookNameEn})
            </span>
          </div>
        </div>
      ) : (
        /* Sanctuary Single Verse Focus */
        <div className="flex-1 flex flex-col items-center justify-center px-12 md:px-24 text-center relative overflow-hidden">
          <div className="mb-8 flex flex-col items-center">
            <div
              className={`px-6 py-2 rounded-full border ${activeTheme.badge} text-xl md:text-2xl font-bold tracking-wide shadow-lg`}
              style={{ fontFamily: activeFontFamily }}
            >
              {formatAmharicRef(activeProjection)}
            </div>
            <div className={`w-64 h-0.5 mt-4 bg-gradient-to-r ${activeTheme.ornament}`} />
          </div>

          <p
            className={`max-w-6xl font-bold leading-snug md:leading-relaxed transition-all duration-300 ${activeTheme.text}`}
            style={{
              fontFamily: activeFontFamily,
              fontSize: `${Math.round(3.1 * (fontScale / 100))}rem`
            }}
          >
            « {activeProjection.verseText} »
          </p>

          <div className="mt-10 flex items-center gap-3 opacity-80">
            <span
              className={`text-lg md:text-xl font-medium ${activeTheme.accent}`}
              style={{ fontFamily: getAmharicFontFamily(amharicFont) }}
            >
              — {activeProjection.bookNameAm} {activeProjection.chapter}፥{activeProjection.verseStart} ({activeProjection.bookNameEn})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
