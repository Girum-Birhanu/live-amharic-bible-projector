// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export interface BibleVerseRecord {
  bookId: number;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verse: number;
  text: string;
  cleanText?: string;
}

export interface ChapterData {
  [verseNumber: number]: string;
}

export interface BookData {
  id: number;
  nameAm: string;
  nameEn: string;
  shortAm: string;
  aliases: string[];
  chapters: {
    [chapterNumber: number]: ChapterData;
  };
}

export interface RawBibleJSON {
  title?: string;
  books: {
    id: number;
    name?: string;
    nameAm?: string;
    nameEn?: string;
    aliases?: string[];
    chapters: {
      chapter: number;
      verses: { verse: number; text: string }[];
    }[];
  }[];
}

export interface DetectedCitation {
  id: string;
  bookId: number;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  verseText: string;
  rawTranscript: string;
  engine: 'LOCAL_O1_MAP' | 'LOCAL_SEMANTIC' | 'GEMINI_AI' | 'VOICE_COMMAND' | 'MANUAL';
  confidence: number;
  latencyMs: number;
  timestamp: string;
  focusedVerse?: number;
}

export type UiTheme = 'dark' | 'light';
export type UiLanguage = 'am' | 'en';

export type ProjectorTheme = 'royal-navy' | 'deep-emerald' | 'warm-gold' | 'pitch-black';
export type DisplayMode = 'fullscreen-slide' | 'obs-lower-third';
export type PassageSpanMode = 'single' | 'context-3' | 'chapter-all';
export type AmharicFontFamily =
  | 'noto-serif'
  | 'noto-sans'
  | 'abyssinica'
  | 'menbere'
  | 'nyala'
  | 'hibur-mono'
  | (string & {});

export interface CustomFontRecord {
  id: string;
  name: string;
  family: string;
  sourceType: 'file' | 'system';
  format?: string;
  dataUrl?: string;
  createdAt: number;
}

export interface ContextVerseItem {
  verseNum: number;
  text: string;
  isActive: boolean;
}

export interface ProjectorSyncPayload {
  type: 'SHOW_VERSE' | 'BLACKOUT' | 'UPDATE_STYLE' | 'PING' | 'PONG';
  senderId: string;
  citation?: DetectedCitation;
  theme?: ProjectorTheme;
  fontScale?: number;
  fontFamily?: AmharicFontFamily;
  customFontData?: CustomFontRecord;
  displayMode?: DisplayMode;
  passageSpan?: PassageSpanMode;
  isBlackout?: boolean;
  timestamp?: number;
}

export interface CanonicalBook {
  id: number;
  nameAm: string;
  nameEn: string;
  shortAm: string;
  aliases: string[];
}

export interface PreacherPreset {
  label: string;
  category: string;
  utterance: string;
}

export interface ServiceSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  churchName?: string;
  projectedVerses: {
    citation: DetectedCitation;
    projectedAt: string;
    durationMs: number;
  }[];
  settings: {
    theme: ProjectorTheme;
    displayMode: DisplayMode;
    fontScale: number;
    autoProject: boolean;
  };
}

export interface SessionSnapshot {
  activeProjection: DetectedCitation;
  detectedQueue: DetectedCitation[];
  selectedBookId: number;
  selectedChapter: number;
  selectedVerse: number;
  isBlackout: boolean;
  settings: {
    theme: ProjectorTheme;
    displayMode: DisplayMode;
    fontScale: number;
    autoProject: boolean;
  };
  timestamp: string;
}
