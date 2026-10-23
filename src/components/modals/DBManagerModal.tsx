import React, { useRef, useMemo } from 'react';
import {
  Database,
  CheckCircle2,
  HardDrive,
  Upload,
  Download,
  FileJson,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { offlineBibleDB } from '../../services/bible-db';
import type { BibleVerseRecord, DetectedCitation } from '../../types';

interface DBManagerModalProps {
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCachedDB: () => void;
  onDownloadTemplate: () => void;
  onResetSeed: () => void;
  onLoadPrepackagedBible: () => void;
}

export function DBManagerModal({
  onImportJSON,
  onExportCachedDB,
  onDownloadTemplate,
  onResetSeed,
  onLoadPrepackagedBible,
}: DBManagerModalProps) {
  const showDbModal = useProjectionStore((s) => s.showDbModal);
  const setShowDbModal = useProjectionStore((s) => s.setShowDbModal);
  const totalIndexedVerses = useProjectionStore((s) => s.totalIndexedVerses);
  const bibleBooks = useProjectionStore((s) => s.bibleBooks);
  const dbInitLatencyMs = useProjectionStore((s) => s.dbInitLatencyMs);
  const dbStatusBanner = useProjectionStore((s) => s.dbStatusBanner);
  const setDbStatusBanner = useProjectionStore((s) => s.setDbStatusBanner);
  const dbKeywordQuery = useProjectionStore((s) => s.dbKeywordQuery);
  const setDbKeywordQuery = useProjectionStore((s) => s.setDbKeywordQuery);
  const setActiveProjection = useProjectionStore((s) => s.setActiveProjection);
  const setIsBlackout = useProjectionStore((s) => s.setIsBlackout);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const keywordSearchResults = useMemo(() => {
    if (!dbKeywordQuery.trim()) return [];
    return offlineBibleDB.searchByKeyword(dbKeywordQuery, 30);
  }, [dbKeywordQuery, totalIndexedVerses]);

  if (!showDbModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Offline Amharic Bible Database Manager (IndexedDB + O(1) Map)
              </h3>
              <p className="text-xs text-slate-400">
                Store all 66 books locally in browser IndexedDB for 100% offline Sunday service reliability
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDbModal(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* Real-time Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase">IndexedDB Store Status</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                {offlineBibleDB.idbSupported ? 'KaleEgziabherBibleDB (Active)' : 'In-Memory Active'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Init Time: {dbInitLatencyMs}ms</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase">Indexed Amharic Verses</div>
              <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                {totalIndexedVerses.toLocaleString()} Verses
              </div>
              <div className="text-[11px] text-slate-500">Across {bibleBooks.length} Cached Books</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase">In-Memory Lookup Speed</div>
              <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">
                ~0.01ms O(1)
              </div>
              <div className="text-[11px] text-slate-500">Key: "bookId-chapter-verse"</div>
            </div>
          </div>

          {dbStatusBanner && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between">
              <span>{dbStatusBanner}</span>
              <button onClick={() => setDbStatusBanner(null)} className="text-emerald-400 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Import / Export / Template Actions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" /> Import Full 66-Book Amharic Bible JSON or Backup Cache
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              To import offline: click <strong>"Load Bundled 66 Books"</strong> for instant 1-click loading, OR choose <strong><code>amharic_bible.json</code></strong> from your extracted <code>amharic-bible-json-main</code> folder (it already contains all 66 books in one single 5.7 MB file).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              onChange={onImportJSON}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={onLoadPrepackagedBible}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
              >
                <Zap className="w-4 h-4" /> Load Bundled 66 Books (31,102 Verses)
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/15"
              >
                <Upload className="w-4 h-4" /> Choose amharic_bible.json File
              </button>

              <button
                onClick={onExportCachedDB}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold text-xs flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export Cached DB ({totalIndexedVerses} Verses)
              </button>

              <button
                onClick={onDownloadTemplate}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5"
              >
                <FileJson className="w-4 h-4" /> Download Sample JSON Template
              </button>

              <button
                onClick={onResetSeed}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 text-slate-400 hover:text-red-300 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Seed
              </button>
            </div>
          </div>

          {/* Instant Offline Amharic Keyword Search */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Search className="w-4 h-4" /> Instant O(1) Amharic Keyword Search
              </h4>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">Try:</span>
                {['ፍቅር', 'እረኛዬ', 'ብርሃን', 'ሰላም', 'ጸጋ'].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setDbKeywordQuery(kw)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={dbKeywordQuery}
              onChange={(e) => setDbKeywordQuery(e.target.value)}
              placeholder="Search across all locally indexed Amharic verses (e.g. ፍቅር, እረኛዬ, ብርሃን)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />

            {dbKeywordQuery.trim() && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {keywordSearchResults.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No local matches for "{dbKeywordQuery}".
                  </p>
                ) : (
                  keywordSearchResults.map((rec) => (
                    <div
                      key={`${rec.bookId}-${rec.chapter}-${rec.verse}`}
                      onClick={() => {
                        const cit: DetectedCitation = {
                          id: `kw-${Date.now()}`,
                          bookId: rec.bookId,
                          bookNameAm: rec.bookNameAm,
                          bookNameEn: rec.bookNameEn,
                          chapter: rec.chapter,
                          verseStart: rec.verse,
                          verseEnd: rec.verse,
                          verseText: rec.text,
                          rawTranscript: `Keyword: ${dbKeywordQuery}`,
                          engine: 'LOCAL_O1_MAP',
                          confidence: 1.0,
                          latencyMs: 0.01,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        };
                        setActiveProjection(cit);
                        setIsBlackout(false);
                        setShowDbModal(false);
                      }}
                      className="cursor-pointer p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-500/15 border border-slate-800 hover:border-indigo-400/50 flex items-start justify-between gap-3 transition"
                    >
                      <div>
                        <span className="text-xs font-bold text-amber-300">
                          {rec.bookNameAm} {rec.chapter}፥{rec.verse}
                        </span>
                        <p className="text-xs text-slate-200 mt-0.5">{rec.text}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-amber-400 text-slate-950 font-bold text-[10px] shrink-0">
                        Project ▶
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
