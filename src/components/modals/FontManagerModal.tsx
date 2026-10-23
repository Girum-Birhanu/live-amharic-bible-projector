import React, { useState, useRef, useEffect } from 'react';
import { Type, Upload, Trash2, Check, Sparkles, AlertCircle, Laptop, FolderOpen, RefreshCw } from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { customFontService } from '../../services/custom-font-service';
import { AMHARIC_FONTS, getAmharicFontFamily } from '../../utils/formatters';

export function FontManagerModal() {
  const showFontManagerModal = useProjectionStore((s) => s.showFontManagerModal);
  const setShowFontManagerModal = useProjectionStore((s) => s.setShowFontManagerModal);
  const customFonts = useProjectionStore((s) => s.customFonts);
  const setCustomFonts = useProjectionStore((s) => s.setCustomFonts);
  const amharicFont = useProjectionStore((s) => s.amharicFont);
  const setAmharicFont = useProjectionStore((s) => s.setAmharicFont);

  const [activeTab, setActiveTab] = useState<'upload' | 'system'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fontDisplayName, setFontDisplayName] = useState('');
  const [systemFontName, setSystemFontName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedLocalFonts, setDetectedLocalFonts] = useState<string[]>([]);
  const [isScanningSystem, setIsScanningSystem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (!showFontManagerModal) {
      setStatusMessage(null);
      setSelectedFile(null);
      setFontDisplayName('');
      setSystemFontName('');
    }
  }, [showFontManagerModal]);

  if (!showFontManagerModal) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fontDisplayName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        setFontDisplayName(cleanName);
      }
      setStatusMessage({ text: `ፋይል ተመርጧል: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`, type: 'info' });
    }
  };

  const handleUploadFont = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatusMessage({ text: 'እባክዎ በመጀመሪያ የፊደል ፋይል (.ttf, .otf, .woff) ይምረጡ።', type: 'error' });
      return;
    }
    const name = fontDisplayName.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');

    try {
      setIsProcessing(true);
      setStatusMessage({ text: 'ፊደሉ በመጫንና በIndexedDB ውስጥ በመቀመጥ ላይ ነው...', type: 'info' });
      const record = await customFontService.saveFontFile(name, selectedFile);
      const updated = await customFontService.getAllCustomFonts();
      setCustomFonts(updated);
      setAmharicFont(record.id);

      setSelectedFile(null);
      setFontDisplayName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatusMessage({ text: `✅ "${record.name}" በተሳካ ሁኔታ ተጭኗል እና እንደ ዋና የፕሮጀክተር ፊደል ተመርጧል!`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `⚠️ ፊደሉን መጫን አልተቻለም: ${err.message || 'ያልታወቀ ስህተት'}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSystemFont = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemFontName.trim()) {
      setStatusMessage({ text: 'እባክዎ በዊንዶውስ ኮምፒውተርዎ ላይ የተጫነውን የፊደል ስም ያስገቡ (ምሳሌ፡ WashRa, VG2 Main)።', type: 'error' });
      return;
    }
    const name = fontDisplayName.trim() || systemFontName.trim();

    try {
      setIsProcessing(true);
      const record = await customFontService.saveSystemFont(name, systemFontName.trim());
      const updated = await customFontService.getAllCustomFonts();
      setCustomFonts(updated);
      setAmharicFont(record.id);

      setSystemFontName('');
      setFontDisplayName('');
      setStatusMessage({ text: `✅ የዊንዶውስ ፊደል "${record.name}" በተሳካ ሁኔታ ተመዝግቧል!`, type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: `⚠️ ፊደሉን መመዝገብ አልተቻለም: ${err.message}`, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFont = async (id: string, name: string) => {
    if (!window.confirm(`እርግጠኛ ነዎት "${name}" የተባለውን ብጁ ፊደል ማስወገድ ይፈልጋሉ?`)) return;
    try {
      await customFontService.deleteCustomFont(id);
      const updated = await customFontService.getAllCustomFonts();
      setCustomFonts(updated);
      if (amharicFont === id) {
        setAmharicFont('noto-serif');
      }
      setStatusMessage({ text: `"${name}" ተሰርዟል።`, type: 'info' });
    } catch (err: any) {
      setStatusMessage({ text: `ስህተት: ${err.message}`, type: 'error' });
    }
  };

  const scanSystemFonts = async () => {
    if (!('queryLocalFonts' in window)) {
      setStatusMessage({
        text: 'የLocal Font Access API በብሮውዘርዎ አልተደገፈም። ከላይ በቀጥታ የፊደሉን ስም (ምሳሌ፡ VG2 Main, WashRa) መጻፍ ይችላሉ።',
        type: 'info'
      });
      return;
    }
    try {
      setIsScanningSystem(true);
      const fonts: any[] = await (window as any).queryLocalFonts();
      const familyNames = Array.from(new Set(fonts.map((f: any) => f.family))).sort() as string[];
      // Filter for likely Ethiopic or commonly used church fonts
      const ethKeywords = ['geez', 'ethiopic', 'amharic', 'washra', 'vg', 'nyala', 'power', 'feedel', 'abyssinica', 'menbere'];
      const prioritized = familyNames.filter((name) =>
        ethKeywords.some((kw) => name.toLowerCase().includes(kw))
      );
      setDetectedLocalFonts(prioritized.length > 0 ? prioritized : familyNames.slice(0, 30));
      setStatusMessage({
        text: `በኮምፒውተርዎ ላይ ${familyNames.length} ፊደላት ተገኝተዋል!`,
        type: 'success'
      });
    } catch {
      setStatusMessage({ text: 'የኮምፒውተር ፊደላትን ለማንበብ ፈቃድ አልተሰጠም። እባክዎ የፊደሉን ስም በቀጥታ ይጻፉ።', type: 'info' });
    } finally {
      setIsScanningSystem(false);
    }
  };

  const currentPreviewFamily = getAmharicFontFamily(amharicFont, customFonts);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-white my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Type className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                የግል ፊደላት አስተዳዳሪ (Custom Amharic Font Manager)
              </h2>
              <p className="text-xs text-slate-400">
                ከኮምፒውተርዎ ላይ .ttf/.otf ፊደል ፋይል በመጫን ወይም በዊንዶውስ የተጫኑ ፊደላትን ይጠቀሙ
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFontManagerModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Live Amharic Scripture Preview Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1 text-center shadow-inner">
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-bold">
            የፊደል ቅድመ-እይታ (Live Font Preview)
          </span>
          <p
            className="text-lg sm:text-xl font-bold leading-relaxed text-amber-100 transition-all py-1"
            style={{ fontFamily: currentPreviewFamily }}
          >
            « በመጀመሪያ እግዚአብሔር ሰማይንና ምድርን ፈጠረ። ምድርም ባዶ ነበረች፤ »
          </p>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-2" style={{ fontFamily: currentPreviewFamily }}>
            <span>— ኦሪት ዘፍጥረት 1፥1-2</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-mono text-[11px]">ሀ ሁ ሂ ሃ ሄ ህ ሆ</span>
          </div>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-500/20 border border-red-500/40 text-red-200'
                : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs hover:text-white font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'upload'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> 1. የፊደል ፋይል መጫኛ (.TTF / .OTF / .WOFF)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'system'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" /> 2. በዊንዶውስ ላይ የተጫነ ፊደል (Windows Font)
          </button>
        </div>

        {/* Tab 1: Upload Font File */}
        {activeTab === 'upload' ? (
          <form onSubmit={handleUploadFont} className="space-y-3.5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {selectedFile ? (
                  <span className="text-amber-400 font-bold">{selectedFile.name}</span>
                ) : (
                  'ከኮምፒውተርዎ ላይ የፊደል ፋይል ለመምረጥ እዚህ ይጫኑ'
                )}
              </p>
              <span className="text-[11px] text-slate-400">
                የሚደገፉ ቅርጸቶች፡ <strong>.TTF</strong>, <strong>.OTF</strong>, <strong>.WOFF</strong>, <strong>.WOFF2</strong>
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">የፊደሉ መጠሪያ ስም (Font Display Name):</label>
              <input
                type="text"
                value={fontDisplayName}
                onChange={(e) => setFontDisplayName(e.target.value)}
                placeholder="ምሳሌ፡ ዋሽራ ቦልድ (WashRa Bold) ወይም ቪዥዋል ግዕዝ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !selectedFile}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition ${
                isProcessing || !selectedFile
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              <Upload className="w-4 h-4" />
              {isProcessing ? 'በመጫን ላይ...' : 'ፊደሉን ወደ ፕሮጀክተሩ ጨምር (Add to Projector)'}
            </button>
          </form>
        ) : (
          /* Tab 2: System Installed Font */
          <form onSubmit={handleAddSystemFont} className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium">
                  በዊንዶውስ የተጫነ የፊደል ስም (Exact Windows Font Family Name):
                </label>
                <button
                  type="button"
                  onClick={scanSystemFonts}
                  disabled={isScanningSystem}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningSystem ? 'animate-spin' : ''}`} />
                  የኮምፒውተር ፊደላትን ፈልግ (Scan PC)
                </button>
              </div>
              <input
                type="text"
                value={systemFontName}
                onChange={(e) => setSystemFontName(e.target.value)}
                placeholder="ምሳሌ፡ VG2 Main, WashRa, GeezMahtem, Power Geez, Nyala"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {detectedLocalFonts.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">የተገኙ የኮምፒውተር ፊደላት (ፈጣን ምርጫ)፡</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
                  {detectedLocalFonts.map((fName) => (
                    <button
                      key={fName}
                      type="button"
                      onClick={() => {
                        setSystemFontName(fName);
                        if (!fontDisplayName) setFontDisplayName(fName);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition"
                    >
                      {fName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">የፊደሉ መጠሪያ ስም (Display Label):</label>
              <input
                type="text"
                value={fontDisplayName}
                onChange={(e) => setFontDisplayName(e.target.value)}
                placeholder="ምሳሌ፡ ቪዥዋል ግዕዝ 2 (Visual Ge'ez 2)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !systemFontName.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition ${
                isProcessing || !systemFontName.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              <Check className="w-4 h-4" />
              {isProcessing ? 'በመመዝገብ ላይ...' : 'የዊንዶውስ ፊደሉን ጨምር (Register System Font)'}
            </button>
          </form>
        )}

        {/* Existing Custom Fonts List */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              የተጨመሩ ብጁ ፊደላት ({customFonts.length})
            </span>
            <span className="text-[11px] font-mono">ከመስመር ውጭ (IndexedDB) ተቀምጠዋል</span>
          </div>

          {customFonts.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
              እስካሁን ምንም ብጁ ፊደል አልተጨመረም። ከላይ ካሉት አማራጮች በአንዱ ፊደል ማከል ይችላሉ።
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customFonts.map((f) => {
                const isCurrentActive = amharicFont === f.id;
                return (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isCurrentActive
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-md'
                        : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate" style={{ fontFamily: f.family }}>
                          {f.name}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          {f.sourceType === 'file' ? 'FILE (.TTF)' : 'WINDOWS'}
                        </span>
                        {isCurrentActive && (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                            የነቃ (Active)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300/80 truncate mt-0.5" style={{ fontFamily: f.family }}>
                        « ቃለ እግዚአብሔር ሕያው ነውና » (ዮሐንስ 1)
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrentActive && (
                        <button
                          type="button"
                          onClick={() => setAmharicFont(f.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition"
                        >
                          ተጠቀም (Use)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteFont(f.id, f.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="ፊደሉን አስወግድ (Delete font)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
