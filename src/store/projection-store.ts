import { create } from 'zustand';
import {
  DetectedCitation,
  BookData,
  ProjectorTheme,
  DisplayMode,
  PassageSpanMode,
  AmharicFontFamily,
  CustomFontRecord,
  UiTheme,
  UiLanguage
} from '../types';
import { INITIAL_BIBLE_DB } from '../data/initial-bible-seed';

export interface ProjectionState {
  // Offline IndexedDB & O(1) Map State
  bibleBooks: BookData[];
  totalIndexedVerses: number;
  dbInitLatencyMs: number;
  showDbModal: boolean;
  dbKeywordQuery: string;
  dbStatusBanner: string | null;

  // Active Live Projected Citation
  activeProjection: DetectedCitation;

  // Operator Queue & Safety Mode
  detectedQueue: DetectedCitation[];
  autoProject: boolean;
  isBlackout: boolean;

  // Speech & Audio Visualizer State
  speechLang: 'am-ET' | 'en-US';
  isListening: boolean;
  liveTranscript: string;
  interimTranscript: string;
  normalizedPreview: string;
  speechError: string | null;
  isAiResolving: boolean;
  audioBars: number[];
  selectedAudioDeviceId: string;

  // Projector Display Settings
  projectorTheme: ProjectorTheme;
  uiTheme: UiTheme;
  uiLanguage: UiLanguage;
  amharicFont: AmharicFontFamily;
  customFonts: CustomFontRecord[];
  displayMode: DisplayMode;
  passageSpan: PassageSpanMode;
  isFullscreenProjector: boolean;
  isSplitDualScreen: boolean;
  fontScale: number;
  followScroll: boolean;
  showArchitectureModal: boolean;
  showProjectorSetupModal: boolean;
  showFontManagerModal: boolean;

  // Dual-Monitor BroadcastChannel Sync State
  connectedProjectorPeers: Record<string, number>;
  lastBroadcastLatencyMs: number;

  // Manual 66-Book Bible Selector State
  selectedBookId: number;
  selectedChapter: number;
  selectedVerse: number;
  customTranscriptInput: string;

  // Actions
  setBibleBooks: (books: BookData[]) => void;
  setTotalIndexedVerses: (count: number) => void;
  setDbInitLatencyMs: (ms: number) => void;
  setShowDbModal: (show: boolean) => void;
  setDbKeywordQuery: (query: string) => void;
  setDbStatusBanner: (banner: string | null) => void;
  setActiveProjection: (citation: DetectedCitation) => void;
  addToQueue: (citation: DetectedCitation) => void;
  setAutoProject: (auto: boolean) => void;
  setIsBlackout: (blackout: boolean) => void;
  toggleBlackout: () => void;
  setSpeechLang: (lang: 'am-ET' | 'en-US') => void;
  setIsListening: (listening: boolean) => void;
  setLiveTranscript: (transcript: string) => void;
  setInterimTranscript: (transcript: string) => void;
  setNormalizedPreview: (preview: string) => void;
  setSpeechError: (error: string | null) => void;
  setIsAiResolving: (resolving: boolean) => void;
  setAudioBars: (bars: number[]) => void;
  setSelectedAudioDeviceId: (id: string) => void;
  setProjectorTheme: (theme: ProjectorTheme) => void;
  setUiTheme: (theme: UiTheme) => void;
  setUiLanguage: (lang: UiLanguage) => void;
  setAmharicFont: (font: AmharicFontFamily) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setPassageSpan: (span: PassageSpanMode) => void;
  setIsFullscreenProjector: (fs: boolean) => void;
  setIsSplitDualScreen: (split: boolean) => void;
  setFontScale: (scale: number) => void;
  adjustFontScale: (delta: number) => void;
  setFollowScroll: (follow: boolean) => void;
  toggleFollowScroll: () => void;
  setShowArchitectureModal: (show: boolean) => void;
  setShowProjectorSetupModal: (show: boolean) => void;
  setShowFontManagerModal: (show: boolean) => void;
  setCustomFonts: (fonts: CustomFontRecord[]) => void;
  setConnectedProjectorPeers: (updater: (prev: Record<string, number>) => Record<string, number>) => void;
  setLastBroadcastLatencyMs: (ms: number) => void;
  setSelectedBookId: (id: number) => void;
  setSelectedChapter: (chapter: number) => void;
  setSelectedVerse: (verse: number) => void;
  setCustomTranscriptInput: (input: string) => void;
}

const isStandaloneProjectorRoute =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('view') === 'projector'
    : false;

const defaultActiveProjection: DetectedCitation = {
  id: 'init-john-3-16',
  bookId: 43,
  bookNameAm: 'የዮሐንስ ወንጌል',
  bookNameEn: 'John',
  chapter: 3,
  verseStart: 16,
  verseEnd: 16,
  verseText:
    INITIAL_BIBLE_DB.find((b) => b.id === 43)?.chapters[3]?.[16] ||
    'በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።',
  rawTranscript: 'የዮሐንስ ወንጌል ምዕራፍ 3 ቁጥር 16',
  engine: 'LOCAL_O1_MAP',
  confidence: 0.99,
  latencyMs: 0.01,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
};

/**
 * Main application Zustand store managing all state for the Live Amharic Bible Projector
 */
export const useProjectionStore = create<ProjectionState>((set) => ({
  // Offline IndexedDB & O(1) Map State
  bibleBooks: INITIAL_BIBLE_DB,
  totalIndexedVerses: 85,
  dbInitLatencyMs: 1,
  showDbModal: false,
  dbKeywordQuery: '',
  dbStatusBanner: null,

  // Active Live Projected Citation
  activeProjection: defaultActiveProjection,

  // Operator Queue & Safety Mode (`Auto-Live` vs `Manual Queue`)
  detectedQueue: [],
  autoProject: true,
  isBlackout: false,

  // Speech & Audio Visualizer State
  speechLang: 'am-ET',
  isListening: false,
  liveTranscript: '',
  interimTranscript: '',
  normalizedPreview: '',
  speechError: null,
  isAiResolving: false,
  audioBars: new Array(18).fill(12),
  selectedAudioDeviceId: '',

  // Projector Display Settings
  projectorTheme: 'royal-navy',
  uiTheme:
    typeof window !== 'undefined'
      ? ((localStorage.getItem('ui_theme') as UiTheme) || 'dark')
      : 'dark',
  uiLanguage:
    typeof window !== 'undefined'
      ? ((localStorage.getItem('ui_language') as UiLanguage) || 'am')
      : 'am',
  amharicFont:
    typeof window !== 'undefined'
      ? ((localStorage.getItem('amharic_font_preference') as AmharicFontFamily) || 'noto-serif')
      : 'noto-serif',
  displayMode: 'fullscreen-slide',
  passageSpan: 'context-3',
  isFullscreenProjector: isStandaloneProjectorRoute,
  isSplitDualScreen: false,
  fontScale: 100,
  followScroll: true,
  showArchitectureModal: false,
  showProjectorSetupModal: false,
  showFontManagerModal: false,
  customFonts: [],

  // Dual-Monitor BroadcastChannel Sync State
  connectedProjectorPeers: {},
  lastBroadcastLatencyMs: 0.4,

  // Manual 66-Book Bible Selector State
  selectedBookId: 43,
  selectedChapter: 3,
  selectedVerse: 16,
  customTranscriptInput: '',

  // Actions
  setBibleBooks: (bibleBooks) => set({ bibleBooks }),
  setTotalIndexedVerses: (totalIndexedVerses) => set({ totalIndexedVerses }),
  setDbInitLatencyMs: (dbInitLatencyMs) => set({ dbInitLatencyMs }),
  setShowDbModal: (showDbModal) => set({ showDbModal }),
  setDbKeywordQuery: (dbKeywordQuery) => set({ dbKeywordQuery }),
  setDbStatusBanner: (dbStatusBanner) => set({ dbStatusBanner }),
  setActiveProjection: (activeProjection) => set({ activeProjection }),
  addToQueue: (citation) =>
    set((state) => ({
      detectedQueue: [citation, ...state.detectedQueue.slice(0, 18)]
    })),
  setAutoProject: (autoProject) => set({ autoProject }),
  setIsBlackout: (isBlackout) => set({ isBlackout }),
  toggleBlackout: () => set((state) => ({ isBlackout: !state.isBlackout })),
  setSpeechLang: (speechLang) => set({ speechLang }),
  setIsListening: (isListening) => set({ isListening }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
  setNormalizedPreview: (normalizedPreview) => set({ normalizedPreview }),
  setSpeechError: (speechError) => set({ speechError }),
  setIsAiResolving: (isAiResolving) => set({ isAiResolving }),
  setAudioBars: (audioBars) => set({ audioBars }),
  setSelectedAudioDeviceId: (selectedAudioDeviceId) => set({ selectedAudioDeviceId }),
  setProjectorTheme: (projectorTheme) => set({ projectorTheme }),
  setUiTheme: (uiTheme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ui_theme', uiTheme);
      } catch {}
    }
    set({ uiTheme });
  },
  setUiLanguage: (uiLanguage) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ui_language', uiLanguage);
      } catch {}
    }
    set({ uiLanguage });
  },
  setAmharicFont: (amharicFont) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amharic_font_preference', amharicFont);
      } catch {}
    }
    set({ amharicFont });
  },
  setDisplayMode: (displayMode) => set({ displayMode }),
  setPassageSpan: (passageSpan) => set({ passageSpan }),
  setIsFullscreenProjector: (isFullscreenProjector) => set({ isFullscreenProjector }),
  setIsSplitDualScreen: (isSplitDualScreen) => set({ isSplitDualScreen }),
  setFontScale: (fontScale) => set({ fontScale }),
  adjustFontScale: (delta) =>
    set((state) => ({
      fontScale: Math.max(75, Math.min(140, state.fontScale + delta))
    })),
  setFollowScroll: (followScroll) => set({ followScroll }),
  toggleFollowScroll: () => set((state) => ({ followScroll: !state.followScroll })),
  setShowArchitectureModal: (showArchitectureModal) => set({ showArchitectureModal }),
  setShowProjectorSetupModal: (showProjectorSetupModal) => set({ showProjectorSetupModal }),
  setShowFontManagerModal: (showFontManagerModal) => set({ showFontManagerModal }),
  setCustomFonts: (customFonts) => set({ customFonts }),
  setConnectedProjectorPeers: (updater) =>
    set((state) => ({
      connectedProjectorPeers: updater(state.connectedProjectorPeers)
    })),
  setLastBroadcastLatencyMs: (lastBroadcastLatencyMs) => set({ lastBroadcastLatencyMs }),
  setSelectedBookId: (selectedBookId) => set({ selectedBookId }),
  setSelectedChapter: (selectedChapter) => set({ selectedChapter }),
  setSelectedVerse: (selectedVerse) => set({ selectedVerse }),
  setCustomTranscriptInput: (customTranscriptInput) => set({ customTranscriptInput })
}));
