import React, { useMemo } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import type { BookData } from '../../types';
import { TRANSLATIONS } from '../../utils/translations';

interface ManualPickerProps {
  onManualProject: (book: BookData, chapter: number, verseStart: number, verseEnd?: number) => void;
}

export function ManualPicker({ onManualProject }: ManualPickerProps) {
  const bibleBooks = useProjectionStore((s) => s.bibleBooks);
  const selectedBookId = useProjectionStore((s) => s.selectedBookId);
  const selectedChapter = useProjectionStore((s) => s.selectedChapter);
  const selectedVerse = useProjectionStore((s) => s.selectedVerse);
  const setSelectedBookId = useProjectionStore((s) => s.setSelectedBookId);
  const setSelectedChapter = useProjectionStore((s) => s.setSelectedChapter);
  const setSelectedVerse = useProjectionStore((s) => s.setSelectedVerse);
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const setShowDbModal = useProjectionStore((s) => s.setShowDbModal);
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);

  const isLight = uiTheme === 'light';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;

  const currentBookObj = useMemo(
    () => bibleBooks.find((b) => b.id === selectedBookId) || bibleBooks[0],
    [bibleBooks, selectedBookId]
  );

  const availableChapters = useMemo(
    () => Object.keys(currentBookObj?.chapters || {}).map(Number).sort((a, b) => a - b),
    [currentBookObj]
  );

  const availableVerses = useMemo(() => {
    const chap = currentBookObj?.chapters?.[selectedChapter] || {};
    return Object.keys(chap).map(Number).sort((a, b) => a - b);
  }, [currentBookObj, selectedChapter]);

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
          <BookOpen className="w-4 h-4 text-amber-500" />
          <h2
            className={`text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {t.manualTitle}
          </h2>
        </div>
        <button
          onClick={() => setShowDbModal(true)}
          className={`text-xs flex items-center gap-1 transition ${
            isLight ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-300 hover:text-indigo-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" /> {t.searchAllIndexed}
        </button>
      </div>

      {/* Book, Chapter, Verse Selector Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        <div>
          <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.bookLabel}
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => {
              const newBookId = Number(e.target.value);
              setSelectedBookId(newBookId);
              const book = bibleBooks.find((b) => b.id === newBookId);
              if (book) {
                const firstChap = Number(Object.keys(book.chapters)[0] || 1);
                setSelectedChapter(firstChap);
                const firstVerse = Number(Object.keys(book.chapters[firstChap] || {})[0] || 1);
                setSelectedVerse(firstVerse);
              }
            }}
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors ${
              isLight
                ? 'bg-slate-50 border border-slate-300 text-slate-900'
                : 'bg-slate-950 border border-slate-800 text-white'
            }`}
          >
            {bibleBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id}. {uiLanguage === 'am' ? `${b.nameAm} (${b.nameEn})` : `${b.nameEn} (${b.nameAm})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-[11px] mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {t.chapterLabel}
          </label>
          <select
            value={selectedChapter}
            onChange={(e) => {
              const chap = Number(e.target.value);
              setSelectedChapter(chap);
              const firstVerse = Number(Object.keys(currentBookObj?.chapters?.[chap] || {})[0] || 1);
              setSelectedVerse(firstVerse);
            }}
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors ${
              isLight
                ? 'bg-slate-50 border border-slate-300 text-slate-900'
                : 'bg-slate-950 border border-slate-800 text-white'
            }`}
          >
            {availableChapters.map((c) => (
              <option key={c} value={c}>
                {t.chapterPrefix} {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={`block text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.verseLabel}
            </label>
            {availableVerses.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (currentBookObj) {
                    onManualProject(currentBookObj, selectedChapter, 1, availableVerses[availableVerses.length - 1]);
                  }
                }}
                className={`text-[10px] font-bold flex items-center gap-1 transition ${
                  isLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                }`}
                title={`Project whole chapter ${selectedChapter} (1 to ${availableVerses[availableVerses.length - 1]})`}
              >
                <Sparkles className="w-2.5 h-2.5" /> {t.wholeChapter}
              </button>
            )}
          </div>
          <select
            value={selectedVerse}
            onChange={(e) => {
              if (e.target.value === 'ALL') {
                if (currentBookObj && availableVerses.length > 0) {
                  onManualProject(currentBookObj, selectedChapter, 1, availableVerses[availableVerses.length - 1]);
                }
              } else {
                const v = Number(e.target.value);
                setSelectedVerse(v);
                if (currentBookObj) onManualProject(currentBookObj, selectedChapter, v);
              }
            }}
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors ${
              isLight
                ? 'bg-slate-50 border border-slate-300 text-slate-900'
                : 'bg-slate-950 border border-slate-800 text-white'
            }`}
          >
            {availableVerses.length > 1 && (
              <option value="ALL">
                📖 {t.wholeChapter} (1 - {availableVerses[availableVerses.length - 1]})
              </option>
            )}
            {availableVerses.map((v) => (
              <option key={v} value={v}>
                {t.versePrefix} {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chapter Verses Header & Whole Chapter Action */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {t.chapterVersesHeader(selectedChapter, availableVerses.length)}
        </span>
        {availableVerses.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (currentBookObj) {
                onManualProject(currentBookObj, selectedChapter, 1, availableVerses[availableVerses.length - 1]);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isLight
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
            }`}
            title={`Project whole chapter ${selectedChapter} (1 to ${availableVerses[availableVerses.length - 1]})`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            {t.wholeChapter} (1 - {availableVerses[availableVerses.length - 1]})
          </button>
        )}
      </div>

      {/* Scrollable Chapter Verses List */}
      <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1">
        {availableVerses.map((vNum) => {
          const vText = currentBookObj?.chapters?.[selectedChapter]?.[vNum];
          const isLive =
            activeProjection.bookNameAm === currentBookObj?.nameAm &&
            activeProjection.chapter === selectedChapter &&
            activeProjection.verseStart === vNum;

          return (
            <button
              key={vNum}
              onClick={() => currentBookObj && onManualProject(currentBookObj, selectedChapter, vNum)}
              className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                isLive
                  ? isLight
                    ? 'bg-amber-100 border-amber-400 text-slate-900 shadow-xs'
                    : 'bg-amber-500/15 border-amber-400/60 text-white'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  : 'bg-slate-950/70 hover:bg-slate-800/70 border-slate-800/80 text-slate-300'
              }`}
            >
              <span
                className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${
                  isLive
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : isLight
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-800 text-amber-400'
                }`}
              >
                {vNum}
              </span>
              <span className="text-xs md:text-sm leading-relaxed flex-1 ethiopic-serif">{vText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
