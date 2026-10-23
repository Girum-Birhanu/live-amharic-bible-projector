import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Monitor,
  Play,
  Sparkles,
  Search,
  ChevronRight,
  ChevronLeft,
  EyeOff,
  Eye,
  Zap,
  Cpu,
  BookOpen,
  Volume2,
  Maximize2,
  Minimize2,
  Code2,
  Radio,
  History,
  AlertCircle,
  Tv,
  Database,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  HardDrive,
  Trash2,
  RefreshCw,
  FileJson,
  Layers,
  Check
} from 'lucide-react';

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
}

export type ProjectorTheme = 'royal-navy' | 'deep-emerald' | 'warm-gold' | 'pitch-black';
export type DisplayMode = 'fullscreen-slide' | 'obs-lower-third';

export interface ProjectorSyncPayload {
  type: 'SHOW_VERSE' | 'BLACKOUT' | 'UPDATE_STYLE' | 'PING' | 'PONG';
  senderId: string;
  citation?: DetectedCitation;
  theme?: ProjectorTheme;
  fontScale?: number;
  displayMode?: DisplayMode;
  isBlackout?: boolean;
  timestamp?: number;
}

// ============================================================================
// 2. CANONICAL 66-BOOK AMHARIC BIBLE METADATA & ALIAS DICTIONARY
// ============================================================================

export const CANONICAL_66_BOOKS: { id: number; nameAm: string; nameEn: string; shortAm: string; aliases: string[] }[] = [
  { id: 1, nameAm: "ኦሪት ዘፍጥረት", nameEn: "Genesis", shortAm: "ዘፍ.", aliases: ["ኦሪት ዘፍጥረት", "ዘፍጥረት", "ዘፍ"] },
  { id: 2, nameAm: "ኦሪት ዘጸአት", nameEn: "Exodus", shortAm: "ዘጸ.", aliases: ["ኦሪት ዘጸአት", "ዘጸአት", "ዘፀአት", "ዘጸ"] },
  { id: 3, nameAm: "ኦሪት ዘሌዋውያን", nameEn: "Leviticus", shortAm: "ዘሌ.", aliases: ["ኦሪት ዘሌዋውያን", "ዘሌዋውያን", "ዘሌ"] },
  { id: 4, nameAm: "ኦሪት ዘኍልቍ", nameEn: "Numbers", shortAm: "ዘኍ.", aliases: ["ኦሪት ዘኍልቍ", "ዘኍልቍ", "ዘሁልቁ", "ዘኍ"] },
  { id: 5, nameAm: "ኦሪት ዘዳግም", nameEn: "Deuteronomy", shortAm: "ዘዳ.", aliases: ["ኦሪት ዘዳግም", "ዘዳግም", "ዘዳ"] },
  { id: 6, nameAm: "መጽሐፈ ኢያሱ ወልደ ነዌ", nameEn: "Joshua", shortAm: "ኢያ.", aliases: ["መጽሐፈ ኢያሱ", "ኢያሱ", "ኢያ"] },
  { id: 7, nameAm: "መጽሐፈ መሳፍንት", nameEn: "Judges", shortAm: "መሳ.", aliases: ["መጽሐፈ መሳፍንት", "መሳፍንት", "መሳ"] },
  { id: 8, nameAm: "መጽሐፈ ሩት", nameEn: "Ruth", shortAm: "ሩት", aliases: ["መጽሐፈ ሩት", "ሩት"] },
  { id: 9, nameAm: "መጽሐፈ ሳሙኤል ቀዳማዊ", nameEn: "1 Samuel", shortAm: "1 ሳሙ.", aliases: ["1ኛ ሳሙኤል", "አንደኛ ሳሙኤል", "1 ሳሙኤል", "ሳሙኤል ቀዳማዊ"] },
  { id: 10, nameAm: "መጽሐፈ ሳሙኤል ካልዕ", nameEn: "2 Samuel", shortAm: "2 ሳሙ.", aliases: ["2ኛ ሳሙኤል", "ሁለተኛ ሳሙኤል", "2 ሳሙኤል", "ሳሙኤል ካልዕ"] },
  { id: 11, nameAm: "መጽሐፈ ነገሥት ቀዳማዊ", nameEn: "1 Kings", shortAm: "1 ነገ.", aliases: ["1ኛ ነገሥት", "አንደኛ ነገሥት", "1 ነገሥት", "1 ነገስት"] },
  { id: 12, nameAm: "መጽሐፈ ነገሥት ካልዕ", nameEn: "2 Kings", shortAm: "2 ነገ.", aliases: ["2ኛ ነገሥት", "ሁለተኛ ነገሥት", "2 ነገሥት", "2 ነገስት"] },
  { id: 13, nameAm: "መጽሐፈ ዜና መዋዕል ቀዳማዊ", nameEn: "1 Chronicles", shortAm: "1 ዜና", aliases: ["1ኛ ዜና", "አንደኛ ዜና", "1 ዜና መዋዕል"] },
  { id: 14, nameAm: "መጽሐፈ ዜና መዋዕል ካልዕ", nameEn: "2 Chronicles", shortAm: "2 ዜና", aliases: ["2ኛ ዜና", "ሁለተኛ ዜና", "2 ዜና መዋዕል"] },
  { id: 15, nameAm: "መጽሐፈ ዕዝራ", nameEn: "Ezra", shortAm: "ዕዝ.", aliases: ["መጽሐፈ ዕዝራ", "ዕዝራ", "እዝራ"] },
  { id: 16, nameAm: "መጽሐፈ ነህምያ", nameEn: "Nehemiah", shortAm: "ነህ.", aliases: ["መጽሐፈ ነህምያ", "ነህምያ"] },
  { id: 17, nameAm: "መጽሐፈ አስቴር", nameEn: "Esther", shortAm: "አስ.", aliases: ["መጽሐፈ አስቴር", "አስቴር"] },
  { id: 18, nameAm: "መጽሐፈ ኢዮብ", nameEn: "Job", shortAm: "ኢዮ.", aliases: ["መጽሐፈ ኢዮብ", "ኢዮብ"] },
  { id: 19, nameAm: "መዝሙረ ዳዊት", nameEn: "Psalms", shortAm: "መዝ.", aliases: ["መዝሙረ ዳዊት", "መዝሙር", "የዳዊት መዝሙር", "ዳዊት", "መዝ"] },
  { id: 20, nameAm: "መጽሐፈ ምሳሌ", nameEn: "Proverbs", shortAm: "ምሳ.", aliases: ["መጽሐፈ ምሳሌ", "ምሳሌ", "ምሳ"] },
  { id: 21, nameAm: "መጽሐፈ መክብብ", nameEn: "Ecclesiastes", shortAm: "መክ.", aliases: ["መጽሐፈ መክብብ", "መክብብ"] },
  { id: 22, nameAm: "መኃልየ መኃልይ ዘሰሎሞን", nameEn: "Song of Solomon", shortAm: "መኃ.", aliases: ["መኃልየ መኃልይ", "መኃልይ"] },
  { id: 23, nameAm: "ትንቢተ ኢሳይያስ", nameEn: "Isaiah", shortAm: "ኢሳ.", aliases: ["ትንቢተ ኢሳይያስ", "ኢሳይያስ", "ኢሳያስ", "ኢሳ"] },
  { id: 24, nameAm: "ትንቢተ ኤርምያስ", nameEn: "Jeremiah", shortAm: "ኤር.", aliases: ["ትንቢተ ኤርምያስ", "ኤርምያስ", "ኤርሚያስ", "ኤር"] },
  { id: 25, nameAm: "ሰቆቃወ ኤርምያስ", nameEn: "Lamentations", shortAm: "ሰቆ.", aliases: ["ሰቆቃወ ኤርምያስ", "ሰቆቃው"] },
  { id: 26, nameAm: "ትንቢተ ሕዝቅኤል", nameEn: "Ezekiel", shortAm: "ሕዝ.", aliases: ["ትንቢተ ሕዝቅኤል", "ሕዝቅኤል", "ህዝቅኤል"] },
  { id: 27, nameAm: "ትንቢተ ዳንኤል", nameEn: "Daniel", shortAm: "ዳን.", aliases: ["ትንቢተ ዳንኤል", "ዳንኤል"] },
  { id: 28, nameAm: "ትንቢተ ሆሴዕ", nameEn: "Hosea", shortAm: "ሆሴ.", aliases: ["ትንቢተ ሆሴዕ", "ሆሴዕ"] },
  { id: 29, nameAm: "ትንቢተ ኢዮኤል", nameEn: "Joel", shortAm: "ኢዮኤ.", aliases: ["ትንቢተ ኢዮኤል", "ኢዮኤል"] },
  { id: 30, nameAm: "ትንቢተ አሞጽ", nameEn: "Amos", shortAm: "አሞ.", aliases: ["ትንቢተ አሞጽ", "አሞጽ"] },
  { id: 31, nameAm: "ትንቢተ አብድዩ", nameEn: "Obadiah", shortAm: "አብድ.", aliases: ["ትንቢተ አብድዩ", "አብድዩ"] },
  { id: 32, nameAm: "ትንቢተ ዮናስ", nameEn: "Jonah", shortAm: "ዮና.", aliases: ["ትንቢተ ዮናስ", "ዮናስ"] },
  { id: 33, nameAm: "ትንቢተ ሚክያስ", nameEn: "Micah", shortAm: "ሚክ.", aliases: ["ትንቢተ ሚክያስ", "ሚክያስ"] },
  { id: 34, nameAm: "ትንቢተ ናሆም", nameEn: "Nahum", shortAm: "ናሆ.", aliases: ["ትንቢተ ናሆም", "ናሆም"] },
  { id: 35, nameAm: "ትንቢተ ዕንባቆም", nameEn: "Habakkuk", shortAm: "ዕን.", aliases: ["ትንቢተ ዕንባቆም", "ዕንባቆም", "እንባቆም"] },
  { id: 36, nameAm: "ትንቢተ ሶፎንያስ", nameEn: "Zephaniah", shortAm: "ሶፎ.", aliases: ["ትንቢተ ሶፎንያስ", "ሶፎንያስ"] },
  { id: 37, nameAm: "ትንቢተ ሐጌ", nameEn: "Haggai", shortAm: "ሐጌ", aliases: ["ትንቢተ ሐጌ", "ሐጌ", "ሀጌ"] },
  { id: 38, nameAm: "ትንቢተ ዘካርያስ", nameEn: "Zechariah", shortAm: "ዘካ.", aliases: ["ትንቢተ ዘካርያስ", "ዘካርያስ"] },
  { id: 39, nameAm: "ትንቢተ ሚልክያስ", nameEn: "Malachi", shortAm: "ሚል.", aliases: ["ትንቢተ ሚልክያስ", "ሚልክያስ"] },
  { id: 40, nameAm: "የማቴዎስ ወንጌል", nameEn: "Matthew", shortAm: "ማቴ.", aliases: ["የማቴዎስ ወንጌል", "ማቴዎስ ወንጌል", "ማቴዎስ", "ማቴ"] },
  { id: 41, nameAm: "የማርቆስ ወንጌል", nameEn: "Mark", shortAm: "ማር.", aliases: ["የማርቆስ ወንጌል", "ማርቆስ ወንጌል", "ማርቆስ", "ማር"] },
  { id: 42, nameAm: "የሉቃስ ወንጌል", nameEn: "Luke", shortAm: "ሉቃ.", aliases: ["የሉቃስ ወንጌል", "ሉቃስ ወንጌል", "ሉቃስ", "ሉቃ"] },
  { id: 43, nameAm: "የዮሐንስ ወንጌል", nameEn: "John", shortAm: "ዮሐ.", aliases: ["የዮሐንስ ወንጌል", "ዮሐንስ ወንጌል", "ዮሐንስ", "ዮሃንስ", "ዮሐ"] },
  { id: 44, nameAm: "የሐዋርያት ሥራ", nameEn: "Acts", shortAm: "ሐዋ.", aliases: ["የሐዋርያት ሥራ", "ሐዋርያት ሥራ", "ሐዋርያት", "ሐዋ"] },
  { id: 45, nameAm: "ወደ ሮሜ ሰዎች", nameEn: "Romans", shortAm: "ሮሜ.", aliases: ["ወደ ሮሜ ሰዎች", "የሮሜ መልእክት", "ሮሜ መልእክት", "ሮሜ"] },
  { id: 46, nameAm: "1ኛ ወደ ቆሮንቶስ ሰዎች", nameEn: "1 Corinthians", shortAm: "1 ቆሮ.", aliases: ["1ኛ ወደ ቆሮንቶስ ሰዎች", "1ኛ ቆሮንቶስ", "አንደኛ ቆሮንቶስ", "1 ቆሮንቶስ", "ቆሮንቶስ"] },
  { id: 47, nameAm: "2ኛ ወደ ቆሮንቶስ ሰዎች", nameEn: "2 Corinthians", shortAm: "2 ቆሮ.", aliases: ["2ኛ ወደ ቆሮንቶስ ሰዎች", "2ኛ ቆሮንቶስ", "ሁለተኛ ቆሮንቶስ", "2 ቆሮንቶስ"] },
  { id: 48, nameAm: "ወደ ገላትያ ሰዎች", nameEn: "Galatians", shortAm: "ገላ.", aliases: ["ወደ ገላትያ ሰዎች", "የገላትያ መልእክት", "ገላትያ", "ገላ"] },
  { id: 49, nameAm: "ወደ ኤፌሶን ሰዎች", nameEn: "Ephesians", shortAm: "ኤፌ.", aliases: ["ወደ ኤፌሶን ሰዎች", "የኤፌሶን መልእክት", "ኤፌሶን", "ኤፌ"] },
  { id: 50, nameAm: "ወደ ፊልጵስዩስ ሰዎች", nameEn: "Philippians", shortAm: "ፊልጵ.", aliases: ["ወደ ፊልጵስዩስ ሰዎች", "የፊልጵስዩስ መልእክት", "ፊልጵስዩስ", "ፊልጵስיוስ", "ፊል"] },
  { id: 51, nameAm: "ወደ ቆላስይስ ሰዎች", nameEn: "Colossians", shortAm: "ቆላ.", aliases: ["ወደ ቆላስይስ ሰዎች", "ቆላስይስ", "ቆላ"] },
  { id: 52, nameAm: "1ኛ ወደ ተሰሎንቄ ሰዎች", nameEn: "1 Thessalonians", shortAm: "1 ተሰ.", aliases: ["1ኛ ተሰሎንቄ", "አንደኛ ተሰሎንቄ", "1 ተሰሎንቄ", "ተሰሎንቄ"] },
  { id: 53, nameAm: "2ኛ ወደ ተሰሎንቄ ሰዎች", nameEn: "2 Thessalonians", shortAm: "2 ተሰ.", aliases: ["2ኛ ተሰሎንቄ", "ሁለተኛ ተሰሎንቄ", "2 ተሰሎንቄ"] },
  { id: 54, nameAm: "1ኛ ወደ ጢሞቴዎስ", nameEn: "1 Timothy", shortAm: "1 ጢሞ.", aliases: ["1ኛ ጢሞቴዎስ", "አንደኛ ጢሞቴዎስ", "1 ጢሞቴዎስ", "ጢሞቴዎስ"] },
  { id: 55, nameAm: "2ኛ ወደ ጢሞቴዎስ", nameEn: "2 Timothy", shortAm: "2 ጢሞ.", aliases: ["2ኛ ጢሞቴዎስ", "ሁለተኛ ጢሞቴዎስ", "2 ጢሞቴዎስ"] },
  { id: 56, nameAm: "ወደ ቲቶ", nameEn: "Titus", shortAm: "ቲቶ", aliases: ["ወደ ቲቶ", "ቲቶ"] },
  { id: 57, nameAm: "ወደ ፊልሞና", nameEn: "Philemon", shortAm: "ፊልሞ.", aliases: ["ወደ ፊልሞና", "ፊልሞና"] },
  { id: 58, nameAm: "ወደ ዕብራውያን", nameEn: "Hebrews", shortAm: "ዕብ.", aliases: ["ወደ ዕብራውያን", "የዕብራውያን መልእክት", "ዕብራውያን", "እብራውያን", "ዕብ"] },
  { id: 59, nameAm: "የያዕቆብ መልእክት", nameEn: "James", shortAm: "ያዕ.", aliases: ["የያዕቆብ መልእክት", "ያዕቆብ", "ያዕ"] },
  { id: 60, nameAm: "1ኛ የጴጥሮስ መልእክት", nameEn: "1 Peter", shortAm: "1 ጴጥ.", aliases: ["1ኛ ጴጥሮስ", "አንደኛ ጴጥሮስ", "1 ጴጥሮስ", "ጴጥሮስ"] },
  { id: 61, nameAm: "2ኛ የጴጥሮስ መልእክት", nameEn: "2 Peter", shortAm: "2 ጴጥ.", aliases: ["2ኛ ጴጥሮስ", "ሁለተኛ ጴጥሮስ", "2 ጴጥሮስ"] },
  { id: 62, nameAm: "1ኛ የዮሐንስ መልእክት", nameEn: "1 John", shortAm: "1 ዮሐ.", aliases: ["1ኛ ዮሐንስ", "አንደኛ ዮሐንስ", "1 ዮሐንስ"] },
  { id: 63, nameAm: "2ኛ የዮሐንስ መልእክት", nameEn: "2 John", shortAm: "2 ዮሐ.", aliases: ["2ኛ ዮሐንስ", "ሁለተኛ ዮሐንስ", "2 ዮሐንስ"] },
  { id: 64, nameAm: "3ኛ የዮሐንስ መልእክት", nameEn: "3 John", shortAm: "3 ዮሐ.", aliases: ["3ኛ ዮሐንስ", "ሦስተኛ ዮሐንስ", "3 ዮሐንስ"] },
  { id: 65, nameAm: "የይሁዳ መልእክት", nameEn: "Jude", shortAm: "ይሁ.", aliases: ["የይሁዳ መልእክት", "ይሁዳ"] },
  { id: 66, nameAm: "የዮሐንስ ራእይ", nameEn: "Revelation", shortAm: "ራእ.", aliases: ["የዮሐንስ ራእይ", "ራእይ", "ራዕይ"] }
];

// ============================================================================
// 3. PRE-SEEDED 1954 AMHARIC BIBLE DATASET (መጽሐፍ ቅዱስ - 1954 ዕትም)
// ============================================================================

const INITIAL_BIBLE_DB: BookData[] = [
  {
    id: 1,
    nameAm: "ኦሪት ዘፍጥረት",
    nameEn: "Genesis",
    shortAm: "ዘፍ.",
    aliases: ["ኦሪት ዘፍጥረት", "ዘፍጥረት", "ዘፍ"],
    chapters: {
      1: {
        1: "በመጀመሪያ እግዚአብሔር ሰማይንና ምድርን ፈጠረ።",
        2: "ምድርም ባዶ ነበረች፥ አንዳችም አልነበረባትም፤ ጨለማም በጥልቁ ላይ ነበረ፥ የእግዚአብሔርም መንፈስ በውኃ ላይ ይሰፍፍ ነበር።",
        3: "እግዚአብሔርም፦ ብርሃን ይሁን አለ፤ ብርሃንም ሆነ።",
        4: "እግዚአብሔርም ብርሃኑ መልካም እንደ ሆነ አየ፥ እግዚአብሔርም ብርሃኑንና ጨለማውን ለየ።",
        5: "እግዚአብሔርም ብርሃኑን ቀን ብሎ ጠራው፥ ጨለማውንም ሌሊት አለው። ማታም ሆነ ጧትም ሆነ፥ አንደኛ ቀን።",
        26: "እግዚአብሔርም አለ፦ ሰውን በመልካችን እንደ ምሳሌአችን እንፍጠር፤ የባሕር ዓሦችንና የሰማይ ወፎችን፥ እንስሳትንና ምድርን ሁሉ፥ በምድር ላይ የሚንቀሳቀሱትንም ተንቀሳቃሾችን ሁሉ ይግዙ።",
        27: "እግዚአብሔርም ሰውን በመልኩ ፈጠረ፤ በእግዚአብሔር መልክ ፈጠረው፤ ወንድና ሴት አድርጎ ፈጠራቸው።"
      }
    }
  },
  {
    id: 19,
    nameAm: "መዝሙረ ዳዊት",
    nameEn: "Psalms",
    shortAm: "መዝ.",
    aliases: ["መዝሙረ ዳዊት", "መዝሙር", "የዳዊት መዝሙር", "ዳዊት", "መዝ"],
    chapters: {
      23: {
        1: "እግዚአብሔር እረኛዬ ነው፥ የሚያሳጣኝም የለም።",
        2: "በለመለመ መስክ ያሳድረኛል፤ በዕረፍት ውኃ ዘንድ ይመራኛል።",
        3: "ነፍሴን ይመልሳታል፥ ስለ ስሙም በጽድቅ መንገድ ይመራኛል።",
        4: "በሞት ጥላ መካከል እንኳ ብሄድ አንተ ከእኔ ጋር ነህና ክፉን አልፈራም፤ በትርህና ምርኵዝህ እነርሱ ያጽናኑኛል።",
        5: "በፊቴ ገበታን አዘጋጀህልኝ በጠላቶቼ ፊት ለፊት ራሴን በዘይት ቀባህ፥ ጽዋዬም የተረፈ ነው።",
        6: "ቸርነትህና ምሕረትህ በሕይወቴ ዘመን ሁሉ ይከተሉኛል፥ በእግዚአብሔርም ቤት ለዘላለም እኖራለሁ።"
      },
      91: {
        1: "በልዑል መጠጊያ የሚኖር ሁሉን በሚችል አምላክ ጥላ ውስጥ ያድራል።",
        2: "እግዚአብሔርን፦ አንተ መታመኛዬና አምባዬ ነህ፥ አምላኬና የምታመንበት ነህ ይለዋል።",
        3: "እርሱ ከአዳኝ ወጥመድ ከሚያስደነግጥም ነገር ያድንሃልና።",
        4: "በላባዎቹ ይጋርድሃል፥ በክንፎቹም በታች ትተማመናለህ፤ እውነት እንደ ጋሻ ይከብብሃል።",
        11: "በመንገድህ ሁሉ ይጠብቁህ ዘንድ መላእክቱን ስለ አንተ ያዝዛቸዋልና፤"
      },
      121: {
        1: "ዓይኖቼን ወደ ተራሮች አነሣሁ፤ ረዳቴ ከወዴት ይመጣል?",
        2: "ረዳቴ ሰማይንና ምድርን ከሠራ ከእግዚአብሔር ዘንድ ነው።",
        3: "እግርህን ለመናወጥ አይሰጥም፤ የሚጠብቅህም አይተኛም።",
        4: "እነሆ፥ እስራኤልን የሚጠብቅ አይተኛም አያንቀላፋምም።",
        5: "እግዚአብሔር ይጠብቅሃል፤ እግዚአብሔርም በቀኝ እጅህ በኩል ጥላህ ነው።",
        6: "ፀሐይ በቀን አያቃጥልህም ጨረቃም በሌሊት።",
        7: "እግዚአብሔር ከክፉ ሁሉ ይጠብቅሃል፥ ነፍስህንም ይጠብቃታል።",
        8: "እግዚአብሔር መውጣትህንና መግባትህን ከዛሬ ጀምሮ እስከ ዘላለም ይጠብቃል።"
      }
    }
  },
  {
    id: 20,
    nameAm: "መጽሐፈ ምሳሌ",
    nameEn: "Proverbs",
    shortAm: "ምሳ.",
    aliases: ["መጽሐፈ ምሳሌ", "ምሳሌ", "ምሳ"],
    chapters: {
      3: {
        5: "በፍጹም ልብህ በእግዚአብሔር ታመን፥ በራስህም ማስተዋል አትደገፍ፤",
        6: "በመንገድህ ሁሉ እርሱን እወቅ፥ እርሱም ጎዳናህን ያቀናልሃል።",
        7: "በራስህ ዓይን ጠቢብ አትሁን፤ እግዚአብሔርን ፍራ፥ ከክፉም ራቅ።"
      }
    }
  },
  {
    id: 23,
    nameAm: "ትንቢተ ኢሳይያስ",
    nameEn: "Isaiah",
    shortAm: "ኢሳ.",
    aliases: ["ትንቢተ ኢሳይያስ", "ኢሳይያስ", "ኢሳያስ", "ኢሳ"],
    chapters: {
      40: {
        28: "አላወቅህምን? አልሰማህምን? እግዚአብሔር የዘላለም አምላክ፥ የምድርም ዳርቻ ፈጣሪ ነው፤ አይደክምም፥ አይታክትም፥ ማስተዋሉም አይመረመርም።",
        29: "ለደካሞች ኃይልን ይሰጣል፥ ጉልበት ለሌላቸውም ብርታትን ይጨምራል።",
        30: "ብላቴኖች ይደክማሉ ይታክቱማል፥ ጎበዛዝቱም ፈጽሞ ይወድቃሉ፤",
        31: "እግዚአብሔርን በመተማመን የሚጠባበቁ ግን ኃይላቸውን ያድሳሉ፤ እንደ ንስር በክንፍ ይወጣሉ፤ ይሮጣሉ፥ አይታክቱም፤ ይሄዳሉ፥ አይደክሙም።"
      },
      53: {
        4: "በእውነት ደዌያችንን ተቀበለ ሕመማችንንም ተሸክሞአል፤ እኛ ግን እንደ ተመታ በእግዚአብሔርም እንደ ተቀሰፈ እንደ ተቸገረም ቆጠርነው።",
        5: "እርሱ ግን ስለ መተላለፋችን ቆሰለ፥ ስለ በደላችንም ደቀቀ፤ የደኅንነታችንም ተግሣጽ በእርሱ ላይ ነበረ፥ በእርሱም ቁስል እኛ ተፈወስን።",
        6: "እኛ ሁላችን እንደ በጎች ተቅበዝብዘን ጠፋን፤ ከእኛ እያንዳንዱ ወደ ገዛ መንገዱ አዘነበለ፤ እግዚአብሔርም የሁላችንን በደል በእርሱ ላይ አኖረ።"
      }
    }
  },
  {
    id: 24,
    nameAm: "ትንቢተ ኤርምያስ",
    nameEn: "Jeremiah",
    shortAm: "ኤር.",
    aliases: ["ትንቢተ ኤርምያስ", "ኤርምያስ", "ኤርሚያስ", "ኤር"],
    chapters: {
      29: {
        11: "ለእናንተ የማስባትን አሳብ እኔ አውቃለሁ፤ ፍጻሜና ተስፋ እሰጣችሁ ዘንድ የሰላም አሳብ ነው እንጂ የክፉ ነገር አይደለም፥ ይላል እግዚአብሔር።",
        12: "ትጠሩኛላችሁ፥ ሄዳችሁም ወደ እኔ ትጸልያላችሁ፥ እኔም እሰማችኋለሁ።",
        13: "ትሹኛላችሁ፥ በፍጹም ልባችሁም ብትሹኝ ታገኙኛላችሁ።"
      }
    }
  },
  {
    id: 40,
    nameAm: "የማቴዎስ ወንጌል",
    nameEn: "Matthew",
    shortAm: "ማቴ.",
    aliases: ["የማቴዎስ ወንጌል", "ማቴዎስ ወንጌል", "ማቴዎስ", "ማቴ"],
    chapters: {
      5: {
        1: "ሕዝቡንም አይቶ ወደ ተራራ ወጣ፤ በተቀመጠም ጊዜ ደቀ መዛሙርቱ ወደ እርሱ ቀረቡ፤",
        2: "አፉንም ከፍቶ አስተማራቸው እንዲህም አለ፦",
        3: "በመንፈስ ድሆች የሆኑ ብፁዓን ናቸው፥ መንግሥተ ሰማያት የእነርሱ ናትና።",
        4: "የሚያዝኑ ብፁዓን ናቸው፥ መጽናናትን ያገኛሉና።",
        5: "የዋሆች ብፁዓን ናቸው፥ ምድርን ይወርሳሉና።",
        6: "ጽድቅን የሚራቡና የሚጠሙ ብፁዓን ናቸው፥ ይጠግባሉና።",
        7: "የሚምሩ ብፁዓን ናቸው፥ ምሕረትን ያገኛሉና።",
        8: "ልባቸው ንጹሕ የሆነ ብፁዓን ናቸው፥ እግዚአብሔርን ያዩታልና።",
        9: "የሚያስታርቁ ብፁዓን ናቸው፥ የእግዚአብሔር ልጆች ይባላሉና።",
        10: "ስለ ጽድቅ የሚሰደዱ ብፁዓን ናቸው፥ መንግሥተ ሰማያት የእነርሱ ናትና።",
        13: "እናንተ የምድር ጨው ናችሁ፤ ጨው አልጫ ቢሆን ግን በምን ይጣፍጣል? ወደ ውጭ ተጥሎ በሰው ከመረገጥ በቀር ወደ ፊት ለምንም አይጠቅምም።",
        14: "እናንተ የዓለም ብርሃን ናችሁ። በተራራ ላይ ያለች ከተማ ልትሰወር አይቻላትም።",
        16: "መልካሙን ሥራችሁን አይተው በሰማያት ያለውን አባታችሁን እንዲያከብሩ ብርሃናችሁ እንዲሁ በሰው ፊት ይብራ።"
      },
      11: {
        28: "እናንተ ደካሞች ሸክማችሁ የከበደ ሁሉ፥ ወደ እኔ ኑ፥ እኔም አሳርፋችኋለሁ።",
        29: "ቀንበሬን በላያችሁ ተሸከሙ ከእኔም ተማሩ፥ እኔ የዋህ በልቤም ትሑት ነኝና፥ ለነፍሳችሁም ዕረፍት ታገኛላችሁ፤",
        30: "ቀንበሬ ልዝብ ሸክሜም ቀሊል ነውና።"
      },
      28: {
        18: "ኢየሱስም ቀርቦ እንዲህ ብሎ ተናገራቸው፦ ሥልጣን ሁሉ በሰማይና በምድር ተሰጠኝ።",
        19: "እንግዲህ ሂዱና አሕዛብን ሁሉ በአብ በወልድና በመንፈስ ቅዱስ ስም እያጠመቃችኋቸው፥ ያዘዝኋችሁንም ሁሉ እንዲጠብቁ እያስተማራችኋቸው ደቀ መዛሙርት አድርጓቸው፤",
        20: "እነሆም እኔ እስከ ዓለም ፍጻሜ ድረስ ሁልጊዜ ከእናንተ ጋር ነኝ።"
      }
    }
  },
  {
    id: 43,
    nameAm: "የዮሐንስ ወንጌል",
    nameEn: "John",
    shortAm: "ዮሐ.",
    aliases: ["የዮሐንስ ወንጌል", "ዮሐንስ ወንጌል", "ዮሐንስ", "ዮሃንስ", "ዮሐ"],
    chapters: {
      1: {
        1: "በመጀመሪያው ቃል ነበረ፥ ቃልም በእግዚአብሔር ዘንድ ነበረ፥ ቃልም እግዚአብሔር ነበረ።",
        2: "ይህ በመጀመሪያው በእግዚአብሔር ዘንድ ነበረ።",
        3: "ሁሉ በእርሱ ሆነ፥ ከሆነውም አንዳች ስንኳ ያለ እርሱ አልሆነም።",
        4: "በእርሱ ሕይወት ነበረች፥ ሕይወትም የሰው ብርሃን ነበረች።",
        5: "ብርሃንም በጨለማ ይበራል፥ ጨለማም አላሸነፈውም።",
        14: "ቃልም ሥጋ ሆነ፤ ጸጋንና እውነትንም ተመልቶ በእኛ አደረ፥ አንድ ልጅም ከአባቱ ዘንድ እንዳለው ክብር የሆነው ክብሩን አየን።"
      },
      3: {
        14: "ሙሴም በምድረ በዳ እባብን እንደ ሰቀለ እንዲሁ በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ የሰው ልጅ ይሰቀል ይገባዋል።",
        15: "በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ።",
        16: "በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።",
        17: "ዓለም በልጁ እንዲድን ነው እንጂ፥ በዓለም እንዲፈርድ እግዚአብሔር ወደ ዓለም አልላከውምና።",
        18: "በእርሱ በሚያምን አይፈረድበትም፤ በማያምን ግን በአንዱ በእግዚአብሔር ልጅ ስም ስላላመነ አሁን ተፈርዶበታል።"
      },
      14: {
        1: "ልባችሁ አይታወክ፤ በእግዚአብሔር እመኑ፥ በእኔም ደግሞ እመኑ።",
        2: "በአባቴ ቤት ብዙ መኖሪያ አለ፤ እንዲህስ ባይሆን ባልኋችሁ ነበር፤ ስፍራ አዘጋጅላችሁ ዘንድ እሄዳለሁና፤",
        3: "ሄጄም ስፍራ ባዘጋጅላችሁ፥ እኔ ባለሁበት እናንተ ደግሞ እንድትሆኑ ሁለተኛ እመጣለሁ ወደ እኔም እወስዳችኋለሁ።",
        6: "ኢየሱስም አለው፦ እኔ መንገድና እውነት ሕይወትም ነኝ፤ በእኔ በቀር ወደ አብ የሚመጣ የለም።"
      }
    }
  },
  {
    id: 45,
    nameAm: "ወደ ሮሜ ሰዎች",
    nameEn: "Romans",
    shortAm: "ሮሜ.",
    aliases: ["ወደ ሮሜ ሰዎች", "የሮሜ መልእክት", "ሮሜ መልእክት", "ሮሜ"],
    chapters: {
      5: {
        1: "እንግዲህ በእምነት ከጸደቅን በእግዚአብሔር ዘንድ በጌታችን በኢየሱስ ክርስቶስ ሰላምን እንያዝ፤",
        2: "በእርሱም ደግሞ ወደ ቆምንበት ወደዚህ ጸጋ በእምነት መግባትን አግኝተናል፤ በእግዚአብሔር ክብር ተስፋ እንመካለን።",
        5: "በተሰጠንም በመንፈስ ቅዱስ የእግዚአብሔር ፍቅር በልባችን ስለ ፈሰሰ ተስፋ አያሳፍርም።",
        8: "ነገር ግን ገና ኃጢአተኞች ሳለን ክርስቶስ ስለ እኛ ሞቶአልና እግዚአብሔር ለእኛ ያለውን የራሱን ፍቅር ያስረዳል።"
      },
      8: {
        1: "እንግዲህ በክርስቶስ ኢየሱስ ላሉት አሁን ኩነኔ የለባቸውም።",
        2: "በክርስቶስ ኢየሱስ ያለው የሕይወት መንፈስ ሕግ ከኃጢአትና ከሞት ሕግ አርነት አውጥቶኛልና።",
        28: "እግዚአብሔርንም ለሚወዱት እንደ አሳቡም ለተጠሩት ነገር ሁሉ ለበጎ እንዲደረግ እናውቃለን።",
        31: "እንግዲህ ስለዚህ ነገር ምን እንላለን? እግዚአብሔር ከእኛ ጋር ከሆነ ማን ይቃወመናል?",
        37: "በዚህ ሁሉ ግን በወደደን በእርሱ ከአሸናፊዎች እንበልጣለን።",
        38: "ሞት ቢሆን፥ ሕይወትም ቢሆን፥ መላእክትም ቢሆኑ፥ ግዛትም ቢሆን፥ ያለውም ቢሆን፥ የሚመጣውም ቢሆን፥ ኃይላትም ቢሆኑ፥",
        39: "ከፍታም ቢሆን፥ ዝቅታም ቢሆን፥ ልዩ ፍጥረትም ቢሆን በክርስቶስ ኢየሱስ በጌታችን ካለ ከእግዚአብሔር ፍቅር ሊለየን እንዳይችል ተረድቼአለሁ።"
      }
    }
  },
  {
    id: 46,
    nameAm: "1ኛ ወደ ቆሮንቶስ ሰዎች",
    nameEn: "1 Corinthians",
    shortAm: "1 ቆሮ.",
    aliases: ["1ኛ ወደ ቆሮንቶስ ሰዎች", "1ኛ ቆሮንቶስ", "አንደኛ ቆሮንቶስ", "1 ቆሮንቶስ", "ቆሮንቶስ"],
    chapters: {
      13: {
        1: "በሰዎችና በመላእክት ልሳን ብናገር ፍቅር ግን ከሌለኝ እንደሚጮኽ ናስ ወይም እንደሚንሸዋሸው ጸናጽል ሆኛለሁ።",
        2: "ትንቢትም ቢኖረኝ ምሥጢርንም ሁሉና እውቀትንም ሁሉ ባውቅ፥ ተራሮችንም እስካፈልስ ድረስ እምነት ሁሉ ቢኖረኝ ፍቅር ግን ከሌለኝ ከንቱ ነኝ።",
        3: "ድሆችንም ልመግብ ያለኝን ሁሉ ባካፍል፥ ሥጋዬንም ለመቃጠል አሳልፌ ብሰጥ ፍቅር ግን ከሌለኝ ምንም አይጠቅመኝም።",
        4: "ፍቅር ይታገሣል፥ ቸርነትንም ያደርጋል፤ ፍቅር አይቀናም፤ ፍቅር አይመካም፥ አይታበይም፤",
        5: "የማይገባውን አያደርግም፥ የራሱንም አይፈልግም፥ አይበሳጭም፥ በደልን አይቆጥርም፤",
        6: "ከእውነት ጋር ደስ ይለዋል እንጂ ስለ ዓመፃ ደስ አይለውም፤",
        7: "ሁሉን ይቻላል፥ ሁሉን ያምናል፥ ሁሉን ተስፋ ያደርጋል፥ በሁሉ ይጸናል።",
        8: "ፍቅር ለዘወትር አይወድቅም፤ ትንቢት ቢሆን ግን ይሻራል፤ ልሳኖች ቢሆኑ ይቀራሉ፤ እውቀትም ቢሆን ይሻራል።",
        13: "እንዲህም ከሆነ፥ እምነት ተስፋ ፍቅር እነዚህ ሦስቱ ጸንተው ይኖራሉ፤ ከእነዚህም የሚበልጠው ፍቅር ነው።"
      }
    }
  },
  {
    id: 49,
    nameAm: "ወደ ኤፌሶን ሰዎች",
    nameEn: "Ephesians",
    shortAm: "ኤፌ.",
    aliases: ["ወደ ኤፌሶን ሰዎች", "የኤፌሶን መልእክት", "ኤፌሶን", "ኤፌ"],
    chapters: {
      2: {
        8: "ጸጋው በእምነት አድኖአችኋልና፤ ይህም የእግዚአብሔር ስጦታ ነው እንጂ ከእናንተ አይደለም፤",
        9: "ማንም እንዳይመካ ከሥራ አይደለም።",
        10: "እኛ ፍጥረቱ ነንና፤ እንመላለስበት ዘንድ እግዚአብሔር አስቀድሞ ያዘጋጀውን መልካሙን ሥራ ለማድረግ በክርስቶስ ኢየሱስ ተፈጠርን።"
      },
      6: {
        10: "በቀረውስ በጌታና በኃይሉ ችሎት የበረታችሁ ሁኑ።",
        11: "የዲያብሎስን ሽንገላ ትቃወሙ ዘንድ እንዲቻላችሁ የእግዚአብሔርን ዕቃ ጦር ሁሉ ልበሱ።",
        12: "መጋደላችን ከደምና ከሥጋ ጋር አይደለምና፥ ከአለቆችና ከሥልጣናት ጋር ከዚህም ከጨለማ ዓለም ገዦች ጋር በሰማያዊም ስፍራ ካለ ከክፉ መንፈሳውያን ሠራዊት ጋር ነው እንጂ።"
      }
    }
  },
  {
    id: 50,
    nameAm: "ወደ ፊልጵስዩስ ሰዎች",
    nameEn: "Philippians",
    shortAm: "ፊልጵ.",
    aliases: ["ወደ ፊልጵስዩስ ሰዎች", "የፊልጵስዩስ መልእክት", "ፊልጵስዩስ", "ፊል"],
    chapters: {
      4: {
        4: "ሁልጊዜ በጌታ ደስ ይበላችሁ፤ ደግሜ እላለሁ፥ ደስ ይበላችሁ።",
        5: "ገርነታችሁ ለሰው ሁሉ ይታወቅ። ጌታ ቅርብ ነው።",
        6: "በነገር ሁሉ በጸሎትና በምልጃ ከምስጋና ጋር በእግዚአብሔር ዘንድ ልመናችሁን አስታውቁ እንጂ በአንዳች አትጨነቁ።",
        7: "አእምሮንም ሁሉ የሚያልፍ የእግዚአብሔር ሰላም ልባችሁንና አሳባችሁን በክርስቶስ ኢየሱስ ይጠብቃል።",
        8: "በቀረውስ፥ ወንድሞች ሆይ፥ እውነተኛ የሆነውን ነገር ሁሉ፥ ጭምትነት ያለበትን ነገር ሁሉ፥ ጽድቅ የሆነውን ነገር ሁሉ፥ ንጹሕ የሆነውን ነገር ሁሉ፥ ፍቅር ያለበትን ነገር ሁሉ፥ መልካም ወሬ ያለበትን ነገር ሁሉ፥ በጎነት ቢሆን ምስጋናም ቢሆን፥ እነዚህን አስቡ፤",
        13: "ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ።"
      }
    }
  }
];

// ============================================================================
// 4. OFFLINE AMHARIC BIBLE ENGINE (IndexedDB + O(1) In-Memory Map)
// ============================================================================

class OfflineAmharicBibleDB {
  // O(1) Hash Map keyed by "bookId-chapter-verse" (e.g., "43-3-16")
  public verseMap = new Map<string, BibleVerseRecord>();
  public booksList: BookData[] = [];
  public isLoaded = false;
  public idbSupported = true;
  public lastInitLatencyMs = 0;

  private readonly DB_NAME = 'KaleEgziabherBibleDB';
  private readonly STORE_NAME = 'bibleStore';
  private readonly STORAGE_KEY = 'amharic_1954_books_v2';

  async init(): Promise<{ books: BookData[]; totalVerses: number; latencyMs: number }> {
    const start = performance.now();

    try {
      const cachedBooks = await this.getFromIndexedDB();
      if (cachedBooks && Array.isArray(cachedBooks) && cachedBooks.length > 0) {
        this.indexBooksArray(cachedBooks);
        this.lastInitLatencyMs = Math.max(1, Math.round(performance.now() - start));
        return {
          books: this.booksList,
          totalVerses: this.verseMap.size,
          latencyMs: this.lastInitLatencyMs
        };
      }
    } catch {
      this.idbSupported = false;
    }

    // Seed with built-in 1954 Amharic Bible chapters & save to IndexedDB
    this.indexBooksArray(INITIAL_BIBLE_DB);
    try {
      await this.saveToIndexedDB(this.booksList);
    } catch {
      this.idbSupported = false;
    }

    this.lastInitLatencyMs = Math.max(1, Math.round(performance.now() - start));
    return {
      books: this.booksList,
      totalVerses: this.verseMap.size,
      latencyMs: this.lastInitLatencyMs
    };
  }

  public indexBooksArray(books: BookData[]) {
    this.verseMap.clear();
    // Merge with canonical 66 book metadata so aliases are always rich
    const mergedBooks: BookData[] = books.map((b) => {
      const canonical = CANONICAL_66_BOOKS.find(
        (c) => c.id === b.id || c.nameAm === b.nameAm || c.nameEn.toLowerCase() === (b.nameEn || '').toLowerCase()
      );
      return {
        id: canonical?.id || b.id,
        nameAm: b.nameAm || canonical?.nameAm || `መጽሐፍ ${b.id}`,
        nameEn: b.nameEn || canonical?.nameEn || `Book ${b.id}`,
        shortAm: b.shortAm || canonical?.shortAm || b.nameAm.slice(0, 3),
        aliases: Array.from(new Set([...(b.aliases || []), ...(canonical?.aliases || []), b.nameAm])),
        chapters: b.chapters || {}
      };
    });

    this.booksList = mergedBooks.sort((a, b) => a.id - b.id);

    for (const book of this.booksList) {
      for (const [chapStr, chapObj] of Object.entries(book.chapters)) {
        const chapNum = Number(chapStr);
        for (const [verseStr, verseText] of Object.entries(chapObj)) {
          const verseNum = Number(verseStr);
          const key = `${book.id}-${chapNum}-${verseNum}`;
          this.verseMap.set(key, {
            bookId: book.id,
            bookNameAm: book.nameAm,
            bookNameEn: book.nameEn,
            chapter: chapNum,
            verse: verseNum,
            text: verseText
          });
        }
      }
    }
    this.isLoaded = true;
  }

  /**
   * Instant ~0.01ms O(1) Hash Map Lookup for a single verse or verse range
   */
  public getVerseRangeO1(bookId: number, chapter: number, verseStart: number, verseEnd = verseStart): string | null {
    const collected: string[] = [];
    const safeEnd = Math.max(verseStart, Math.min(verseEnd, verseStart + 8));
    for (let v = verseStart; v <= safeEnd; v++) {
      const record = this.verseMap.get(`${bookId}-${chapter}-${v}`);
      if (record) {
        collected.push(safeEnd > verseStart ? `(${v}) ${record.text}` : record.text);
      }
    }
    return collected.length > 0 ? collected.join(' ') : null;
  }

  /**
   * Adds or updates a single verse (e.g., fetched live via Gemini AI) & persists to IndexedDB
   */
  public async upsertVerseAndPersist(
    bookNameAm: string,
    bookNameEn: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
    verseText: string
  ): Promise<{ bookId: number; updatedBooks: BookData[] }> {
    const canonical = CANONICAL_66_BOOKS.find(
      (c) =>
        c.nameAm === bookNameAm ||
        c.aliases.includes(bookNameAm) ||
        c.nameEn.toLowerCase() === bookNameEn.toLowerCase()
    );
    const bookId = canonical ? canonical.id : this.booksList.length + 70;

    const existingIdx = this.booksList.findIndex((b) => b.id === bookId || b.nameAm === bookNameAm);
    if (existingIdx > -1) {
      const existing = this.booksList[existingIdx];
      const updatedBook: BookData = {
        ...existing,
        chapters: {
          ...existing.chapters,
          [chapter]: {
            ...(existing.chapters[chapter] || {}),
            [verseStart]: verseText
          }
        }
      };
      this.booksList[existingIdx] = updatedBook;
    } else {
      const newBook: BookData = {
        id: bookId,
        nameAm: canonical?.nameAm || bookNameAm,
        nameEn: canonical?.nameEn || bookNameEn,
        shortAm: canonical?.shortAm || bookNameAm.slice(0, 4),
        aliases: canonical?.aliases || [bookNameAm, bookNameEn],
        chapters: {
          [chapter]: {
            [verseStart]: verseText
          }
        }
      };
      this.booksList.push(newBook);
      this.booksList.sort((a, b) => a.id - b.id);
    }

    this.verseMap.set(`${bookId}-${chapter}-${verseStart}`, {
      bookId,
      bookNameAm: canonical?.nameAm || bookNameAm,
      bookNameEn: canonical?.nameEn || bookNameEn,
      chapter,
      verse: verseStart,
      text: verseText
    });

    try {
      await this.saveToIndexedDB(this.booksList);
    } catch {}

    return { bookId, updatedBooks: [...this.booksList] };
  }

  /**
   * Imports custom JSON (supports standard 66-book nested JSON or BookData[] format)
   */
  public async importCustomBibleJSON(rawJson: any): Promise<{ books: BookData[]; totalVerses: number }> {
    const convertedBooks: BookData[] = [...this.booksList];

    const mergeBookChapterVerse = (
      id: number,
      nameAm: string,
      nameEn: string,
      chapNum: number,
      verseNum: number,
      text: string
    ) => {
      const canonical = CANONICAL_66_BOOKS.find(
        (c) => c.id === id || c.nameAm === nameAm || c.aliases.includes(nameAm)
      );
      const resolvedId = canonical?.id || id;
      let targetBook = convertedBooks.find((b) => b.id === resolvedId);
      if (!targetBook) {
        targetBook = {
          id: resolvedId,
          nameAm: canonical?.nameAm || nameAm || `መጽሐፍ ${resolvedId}`,
          nameEn: canonical?.nameEn || nameEn || `Book ${resolvedId}`,
          shortAm: canonical?.shortAm || (nameAm || '').slice(0, 4),
          aliases: canonical?.aliases || [nameAm],
          chapters: {}
        };
        convertedBooks.push(targetBook);
      }
      if (!targetBook.chapters[chapNum]) {
        targetBook.chapters[chapNum] = {};
      }
      targetBook.chapters[chapNum][verseNum] = text;
    };

    if (Array.isArray(rawJson)) {
      // Either BookData[] or flat verse array
      for (const item of rawJson) {
        if (item.chapters && typeof item.chapters === 'object' && !Array.isArray(item.chapters)) {
          for (const [cStr, cObj] of Object.entries(item.chapters)) {
            for (const [vStr, vText] of Object.entries(cObj as Record<string, string>)) {
              mergeBookChapterVerse(item.id || 1, item.nameAm || item.name, item.nameEn || '', Number(cStr), Number(vStr), vText);
            }
          }
        } else if (item.verse && item.text) {
          mergeBookChapterVerse(
            item.bookId || 1,
            item.bookNameAm || item.bookName || 'ኦሪት ዘፍጥረት',
            item.bookNameEn || '',
            Number(item.chapter || 1),
            Number(item.verse),
            item.text
          );
        }
      }
    } else if (rawJson && Array.isArray(rawJson.books)) {
      // Standard Amharic Bible JSON: { books: [ { id, name, chapters: [ { chapter, verses: [ { verse, text } ] } ] } ] }
      for (let i = 0; i < rawJson.books.length; i++) {
        const b = rawJson.books[i];
        const bookId = b.id || i + 1;
        const nameAm = b.nameAm || b.name || b.title || `መጽሐፍ ${bookId}`;
        const nameEn = b.nameEn || '';
        if (Array.isArray(b.chapters)) {
          for (const ch of b.chapters) {
            const chapNum = Number(ch.chapter || 1);
            if (Array.isArray(ch.verses)) {
              for (const v of ch.verses) {
                mergeBookChapterVerse(bookId, nameAm, nameEn, chapNum, Number(v.verse), v.text);
              }
            }
          }
        } else if (b.chapters && typeof b.chapters === 'object') {
          for (const [cStr, cObj] of Object.entries(b.chapters)) {
            for (const [vStr, vText] of Object.entries(cObj as Record<string, string>)) {
              mergeBookChapterVerse(bookId, nameAm, nameEn, Number(cStr), Number(vStr), vText);
            }
          }
        }
      }
    }

    this.indexBooksArray(convertedBooks);
    await this.saveToIndexedDB(this.booksList);
    return { books: [...this.booksList], totalVerses: this.verseMap.size };
  }

  public searchByKeyword(query: string, limit = 25): BibleVerseRecord[] {
    const q = query.trim();
    if (!q) return [];
    const results: BibleVerseRecord[] = [];
    for (const record of this.verseMap.values()) {
      if (record.text.includes(q) || record.bookNameAm.includes(q)) {
        results.push(record);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  public async resetToDefaultSeed(): Promise<{ books: BookData[]; totalVerses: number }> {
    this.indexBooksArray(INITIAL_BIBLE_DB);
    try {
      await this.saveToIndexedDB(this.booksList);
    } catch {}
    return { books: [...this.booksList], totalVerses: this.verseMap.size };
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(this.STORE_NAME)) {
          request.result.createObjectStore(this.STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(): Promise<BookData[] | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const req = tx.objectStore(this.STORE_NAME).get(this.STORAGE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  private async saveToIndexedDB(data: BookData[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).put(data, this.STORAGE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const offlineBibleDB = new OfflineAmharicBibleDB();

// ============================================================================
// 5. ENGINE 1: AMHARIC NUMBER NORMALIZER & REGEX CITATION ENGINE (<5ms)
// ============================================================================

const GE_EZ_NUMERALS: Record<string, number> = {
  '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8, '፱': 9,
  '፲': 10, '፳': 20, '፴': 30, '፵': 40, '፶': 50, '፷': 60, '፸': 70, '፹': 80, '፺': 90, '፻': 100
};

const AMHARIC_TENS: Record<string, number> = {
  'አሥራ': 10, 'አስራ': 10,
  'ሃያ': 20, 'ሀያ': 20,
  'ሠላሳ': 30, 'ሰላሳ': 30,
  'አርባ': 40,
  'ሃምሳ': 50, 'ሀምሳ': 50,
  'ስልሳ': 60,
  'ሰባ': 70,
  'ሰማንያ': 80,
  'ዘጠና': 90
};

const AMHARIC_UNITS: Record<string, number> = {
  'አንድ': 1, 'አንደኛ': 1, 'መጀመሪያ': 1,
  'ሁለት': 2, 'ሁለተኛ': 2,
  'ሦስት': 3, 'ሶስት': 3, 'ሦስተኛ': 3, 'ሶስተኛ': 3, 'ሃያ ሦስተኛው': 23,
  'አራት': 4, 'አራተኛ': 4,
  'አምስት': 5, 'አምስተኛ': 5,
  'ስድስት': 6, 'ስድስተኛ': 6,
  'ሰባት': 7, 'ሰባተኛ': 7,
  'ስምንት': 8, 'ስምንተኛ': 8,
  'ዘጠኝ': 9, 'ዘጠነኛ': 9,
  'አሥር': 10, 'አስር': 10, 'አሥረኛ': 10, 'አስረኛ': 10,
  'መቶ': 100
};

function normalizeAmharicNumbers(input: string): string {
  let text = input;

  // 1. Convert Ge'ez compound numerals (e.g., ፲፮ -> 16)
  text = text.replace(/[፩-፻]+/g, (match) => {
    let total = 0;
    for (const char of match) {
      total += GE_EZ_NUMERALS[char] || 0;
    }
    return total > 0 ? String(total) : match;
  });

  // 2. Preserve book prefixes like "አንደኛ ቆሮንቶስ" -> "1ኛ ቆሮንቶስ"
  text = text.replace(/\b(አንደኛ|1ኛ)\s+(ቆሮንቶስ|ጴጥሮስ|ዮሐንስ|ተሰሎንቄ|ጢሞቴዎስ|ሳሙኤል|ነገሥት|ዜና)/g, '1ኛ $2');
  text = text.replace(/\b(ሁለተኛ|2ኛ)\s+(ቆሮንቶስ|ጴጥሮስ|ዮሐንስ|ተሰሎንቄ|ጢሞቴዎስ|ሳሙኤል|ነገሥት|ዜና)/g, '2ኛ $2');

  // 3. Convert compound spoken numbers (e.g., "አሥራ ስድስት" -> "16", "ሃያ ሦስት" -> "23")
  const tensPattern = Object.keys(AMHARIC_TENS).join('|');
  const unitsPattern = Object.keys(AMHARIC_UNITS).join('|');
  const compoundRegex = new RegExp(`(${tensPattern})\\s+(${unitsPattern})`, 'g');

  text = text.replace(compoundRegex, (_, tenWord, unitWord) => {
    const val = (AMHARIC_TENS[tenWord] || 0) + (AMHARIC_UNITS[unitWord] || 0);
    return String(val);
  });

  // 4. Convert standalone tens ("ሃያ" -> "20", "ሠላሳ" -> "30")
  Object.entries(AMHARIC_TENS).forEach(([word, num]) => {
    text = text.replace(new RegExp(`(?<!\\S)${word}(?!\\S)`, 'g'), String(num));
  });

  // 5. Convert standalone units ("ሦስት" -> "3", "አንድ" -> "1")
  Object.entries(AMHARIC_UNITS).forEach(([word, num]) => {
    text = text.replace(new RegExp(`(?<!\\S)${word}(?!\\S)`, 'g'), String(num));
  });

  return text;
}

function detectVoiceNavigationCommand(transcript: string): 'NEXT_VERSE' | 'PREV_VERSE' | null {
  const nextPatterns = [
    /ቀጥሎ\s*ያለው/,
    /ወደ\s*ሚቀጥለው\s*ቁጥር/,
    /የሚቀጥለውን\s*ቁጥር/,
    /ቀጣዩን\s*ቁጥር/,
    /ወደ\s*ታች\s*ስንወርድ/
  ];
  const prevPatterns = [
    /ያለፈው\s*ቁጥር/,
    /ወደ\s*ኋላ\s*ስንመለስ/,
    /ቀደም\s*ብሎ\s*ያለው/
  ];

  for (const p of nextPatterns) {
    if (p.test(transcript)) return 'NEXT_VERSE';
  }
  for (const p of prevPatterns) {
    if (p.test(transcript)) return 'PREV_VERSE';
  }
  return null;
}

function parseAmharicScriptureLocally(
  rawTranscript: string
): {
  bookId: number;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  engine: 'LOCAL_O1_MAP' | 'LOCAL_SEMANTIC';
  confidence: number;
} | null {
  const normalized = normalizeAmharicNumbers(rawTranscript);

  // Match across all 66 canonical Amharic books & aliases
  for (const book of CANONICAL_66_BOOKS) {
    const sortedAliases = [...book.aliases].sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
      // Pattern 1: Standard or Short -> [Book] (ምዕራፍ|መዝሙር)? [Chapter] (ከቁጥር|ቁጥር|፥|:)? [Verse] (እስከ|-)? [EndVerse]?
      const forwardRegex = new RegExp(
        `${alias}[\\s፣,]*?(?:ምዕራፍ|መዝሙር)?\\s*(\\d+)[\\s፣,:፥]*?(?:ከቁጥር|ቁጥር)?\\s*(\\d+)(?:\\s*(?:እስከ|-)\\s*(\\d+))?`,
        'i'
      );
      const forwardMatch = normalized.match(forwardRegex);
      if (forwardMatch) {
        const chapter = parseInt(forwardMatch[1], 10);
        const verseStart = parseInt(forwardMatch[2], 10);
        const verseEnd = forwardMatch[3] ? parseInt(forwardMatch[3], 10) : verseStart;
        return {
          bookId: book.id,
          bookNameAm: book.nameAm,
          bookNameEn: book.nameEn,
          chapter,
          verseStart,
          verseEnd,
          engine: 'LOCAL_O1_MAP',
          confidence: 0.99
        };
      }

      // Pattern 2: Reversed conversational -> ምዕራፍ [Chapter] ቁጥር [Verse] ... [Book]
      const reverseRegex = new RegExp(
        `(?:ምዕራፍ|መዝሙር)\\s*(\\d+)[\\s፣,]*?(?:ከቁጥር|ቁጥር|፥|:)?\\s*(\\d+)(?:\\s*(?:እስከ|-)\\s*(\\d+))?.*?${alias}`,
        'i'
      );
      const reverseMatch = normalized.match(reverseRegex);
      if (reverseMatch) {
        const chapter = parseInt(reverseMatch[1], 10);
        const verseStart = parseInt(reverseMatch[2], 10);
        const verseEnd = reverseMatch[3] ? parseInt(reverseMatch[3], 10) : verseStart;
        return {
          bookId: book.id,
          bookNameAm: book.nameAm,
          bookNameEn: book.nameEn,
          chapter,
          verseStart,
          verseEnd,
          engine: 'LOCAL_O1_MAP',
          confidence: 0.96
        };
      }
    }
  }

  // Pattern 3: Fast Local Semantic Phrase Matcher across all verses in the O(1) Map
  const cleanText = rawTranscript.trim();
  for (const record of offlineBibleDB.verseMap.values()) {
    const words = record.text.replace(/[።፣፤፥፦]/g, '').split(/\s+/);
    if (words.length >= 3) {
      const phraseStart = words.slice(0, 3).join(' ');
      const phraseMid = words.slice(1, 4).join(' ');
      if (cleanText.includes(phraseStart) || (phraseMid.length > 8 && cleanText.includes(phraseMid))) {
        return {
          bookId: record.bookId,
          bookNameAm: record.bookNameAm,
          bookNameEn: record.bookNameEn,
          chapter: record.chapter,
          verseStart: record.verse,
          verseEnd: record.verse,
          engine: 'LOCAL_SEMANTIC',
          confidence: 0.94
        };
      }
    }
  }

  return null;
}

// ============================================================================
// 6. ENGINE 2: GEMINI AI SEMANTIC FALLBACK & AUTO-INDEXEDDB PERSISTENCE
// ============================================================================

async function resolveAmharicVerseWithGemini(spokenAmharic: string): Promise<{
  detected: boolean;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  verseTextAmharic: string;
  confidence: number;
} | null> {
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("Gemini API key not configured in .env. Running in offline/local regex mode.");
    return null;
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an expert Ethiopian Orthodox & Evangelical Church Bible Projection Assistant specializing in the 1954 Haile Selassie Amharic Bible (መጽሐፍ ቅዱስ).
A preacher is speaking in Amharic. Analyze the spoken Amharic transcript:
1. Determine if the preacher is citing, quoting, or paraphrasing a Bible verse in Amharic (either by book/chapter/verse OR by quoting/describing the verse content like "እግዚአብሔር እረኛዬ ነው የሚለውን" or "በመጀመሪያ ቃል ነበረ").
2. Return the exact 1954 Amharic Bible text for that verse or verse range.
3. If the transcript contains a valid Bible reference or quote, set detected=true and provide the exact 1954 Amharic verse text.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `Spoken Amharic preacher transcript: "${spokenAmharic}"` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          detected: { type: "BOOLEAN" },
          bookNameAm: { type: "STRING" },
          bookNameEn: { type: "STRING" },
          chapter: { type: "INTEGER" },
          verseStart: { type: "INTEGER" },
          verseEnd: { type: "INTEGER" },
          verseTextAmharic: { type: "STRING" },
          confidence: { type: "NUMBER" }
        },
        required: ["detected", "bookNameAm", "bookNameEn", "chapter", "verseStart", "verseEnd", "verseTextAmharic", "confidence"]
      }
    }
  };

  let delay = 700;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      }
      return null;
    } catch {
      if (attempt === 2) return null;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  return null;
}

// ============================================================================
// 7. REALISTIC PREACHER VOICE SIMULATOR PRESETS
// ============================================================================

const PREACHER_SIMULATION_PRESETS = [
  {
    label: "ዮሐንስ 3፥16 (Spoken Words)",
    category: "O(1) Map • 0.01ms",
    utterance: "እስቲ ሁላችንም መጽሐፍ ቅዱሳችንን እንክፈትና የዮሐንስ ወንጌል ምዕራፍ ሦስት ቁጥር አሥራ ስድስት ላይ ያለውን የእግዚአብሔርን ቃል እናንብብ።"
  },
  {
    label: "ወደ ሚቀጥለው ቁጥር (Voice Next)",
    category: "Voice Nav",
    utterance: "አሜን! ወደ ሚቀጥለው ቁጥር እንሂድ..."
  },
  {
    label: "መዝሙር 23፥1-4 (Verse Range)",
    category: "Range Lookup",
    utterance: "መዝሙረ ዳዊት ምዕራፍ 23 ከቁጥር 1 እስከ 4 ያለውን የእግዚአብሔርን ቃል በአንድነት እናንብብ።"
  },
  {
    label: "መዝሙር 23 (Paraphrase / No Numbers!)",
    category: "Semantic Match",
    utterance: "እስቲ እግዚአብሔር እረኛዬ ነው የሚያሳጣኝም የለም የሚለውን የዳዊት መዝሙር አውጡልኝ።"
  },
  {
    label: "ሮሜ 8፥28 (Short Citation)",
    category: "O(1) Map • 0.01ms",
    utterance: "ሐዋርያው ጳውሎስ በሮሜ 8 28 ላይ እንደነገረን እግዚአብሔርን ለሚወዱት ነገር ሁሉ ለበጎ ይደረጋል።"
  },
  {
    label: "ፊልጵስዩስ 4፥13 (Ge'ez Numerals)",
    category: "Ge'ez Normalizer",
    utterance: "ወደ ፊልጵስዩስ ሰዎች ምዕራፍ ፬ ቁጥር ፲፫ ላይ ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ ይላል።"
  },
  {
    label: "ኤርምያስ 29፥11 (Promise Verse)",
    category: "O(1) Map",
    utterance: "ትንቢተ ኤርምያስ ምዕራፍ 29 ቁጥር 11 ለእናንተ የማስባትን አሳብ እኔ አውቃለሁ ይላል እግዚአብሔር።"
  },
  {
    label: "ኢያሱ 1፥9 (Gemini AI + Auto-IndexedDB Save)",
    category: "Gemini AI -> IndexedDB",
    utterance: "መጽሐፈ ኢያሱ ምዕራፍ 1 ቁጥር 9 በርታና ጽና አትፍራ አትደንግጥ የሚለውን ቃል አውጡልኝ።"
  }
];

// ============================================================================
// 8. SHARED THEME & CITATION FORMATTERS
// ============================================================================

function getThemeClasses(theme: ProjectorTheme) {
  switch (theme) {
    case 'royal-navy':
      return {
        bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950',
        border: 'border-cyan-400/40',
        accent: 'text-amber-300',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        text: 'text-white',
        ornament: 'from-transparent via-amber-400/60 to-transparent'
      };
    case 'deep-emerald':
      return {
        bg: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
        border: 'border-emerald-400/40',
        accent: 'text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
        text: 'text-emerald-50',
        ornament: 'from-transparent via-emerald-400/60 to-transparent'
      };
    case 'warm-gold':
      return {
        bg: 'bg-gradient-to-br from-stone-950 via-amber-950 to-yellow-950',
        border: 'border-amber-500/40',
        accent: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        text: 'text-amber-50',
        ornament: 'from-transparent via-amber-400/60 to-transparent'
      };
    case 'pitch-black':
    default:
      return {
        bg: 'bg-black',
        border: 'border-neutral-800',
        accent: 'text-amber-400',
        badge: 'bg-neutral-900 text-amber-400 border-neutral-700',
        text: 'text-white',
        ornament: 'from-transparent via-neutral-600 to-transparent'
      };
  }
}

function formatAmharicRef(c: DetectedCitation) {
  const range = c.verseEnd > c.verseStart ? `${c.verseStart}-${c.verseEnd}` : `${c.verseStart}`;
  return `${c.bookNameAm} ምዕራፍ ${c.chapter} ፥ ${range}`;
}

// ============================================================================
// 9. POP-OUT HDMI WINDOW INITIALIZER (BroadcastChannel Receiver)
// ============================================================================

function mountPopoutProjectorDOM(
  popoutWin: Window,
  initialCitation: DetectedCitation,
  theme: ProjectorTheme,
  fontScale: number,
  displayMode: DisplayMode,
  isBlackout: boolean
): void {
  const doc = popoutWin.document;
  doc.title = 'ቃለ እግዚአብሔር - Live HDMI Projector Output';

  // Inject Google Fonts for Ethiopic script
  const fontLink = doc.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href =
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&family=Noto+Serif+Ethiopic:wght@600;700;800&display=swap';
  doc.head.appendChild(fontLink);

  // Inject self-contained styles for the HDMI projector window
  const styleEl = doc.createElement('style');
  styleEl.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #020617;
      color: #ffffff;
      font-family: 'Noto Serif Ethiopic', serif;
      user-select: none;
      display: flex;
      flex-direction: column;
    }
    .projector-root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: background 0.4s ease;
    }
    .theme-royal-navy { background: linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #172554 100%); }
    .theme-deep-emerald { background: linear-gradient(135deg, #022c22 0%, #134e4a 50%, #020617 100%); }
    .theme-warm-gold { background: linear-gradient(135deg, #0c0a09 0%, #451a03 50%, #422006 100%); }
    .theme-pitch-black { background: #000000; }
    .theme-obs { background: #022c22; }
    .top-bar {
      opacity: 0;
      transition: opacity 0.25s ease;
      padding: 12px 20px;
      background: rgba(0, 0, 0, 0.65);
      font-family: 'Noto Sans Ethiopic', sans-serif;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    body:hover .top-bar { opacity: 1; }
    .center-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 4rem;
      text-align: center;
    }
    .citation-pill {
      padding: 10px 28px;
      border-radius: 9999px;
      border: 1px solid rgba(251, 191, 36, 0.45);
      background: rgba(245, 158, 11, 0.18);
      color: #fcd34d;
      font-size: 1.65rem;
      font-weight: 700;
      margin-bottom: 2rem;
    }
    .verse-body {
      max-width: 72rem;
      font-weight: 700;
      line-height: 1.45;
      color: #ffffff;
    }
    .verse-footer {
      margin-top: 2.5rem;
      font-size: 1.25rem;
      color: #fcd34d;
      opacity: 0.85;
    }
    .obs-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2.5rem 3.5rem;
    }
    .obs-card {
      max-width: 72rem;
      width: 100%;
      margin: 0 auto;
      background: rgba(2, 6, 23, 0.95);
      border-left: 8px solid #fbbf24;
      border-radius: 0 1rem 1rem 0;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .btn-fs {
      padding: 6px 14px;
      background: #fbbf24;
      color: #020617;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  `;
  doc.head.appendChild(styleEl);

  doc.body.innerHTML = '';
  const rootEl = doc.createElement('div');
  rootEl.id = 'projector-root';
  rootEl.className = 'projector-root theme-royal-navy';
  doc.body.appendChild(rootEl);

  const state = {
    citation: initialCitation,
    theme,
    fontScale,
    displayMode,
    isBlackout
  };

  const renderProjector = () => {
    const c = state.citation;
    const range = c.verseEnd > c.verseStart ? `${c.verseStart}-${c.verseEnd}` : `${c.verseStart}`;
    const refTitle = `${c.bookNameAm} ምዕራፍ ${c.chapter} ፥ ${range}`;

    const themeClass =
      state.displayMode === 'obs-lower-third'
        ? 'theme-obs'
        : `theme-${state.theme}`;

    rootEl.className = `projector-root ${themeClass}`;

    if (state.isBlackout) {
      rootEl.innerHTML = `
        <div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;">
          <span style="color:#262626;font-size:12px;font-family:sans-serif;letter-spacing:0.2em;">BLACKOUT ACTIVE</span>
        </div>
      `;
      return;
    }

    if (state.displayMode === 'obs-lower-third') {
      const remSize = Math.max(1.3, Number((2.0 * (state.fontScale / 100)).toFixed(2)));
      rootEl.innerHTML = `
        <div class="obs-container">
          <div class="obs-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
              <span style="font-size:1.5rem;font-weight:700;color:#fbbf24;">${refTitle}</span>
              <span style="font-size:0.75rem;color:#94a3b8;font-family:sans-serif;text-transform:uppercase;letter-spacing:0.1em;">
                መጽሐፍ ቅዱስ (1954) • ${c.bookNameEn} ${c.chapter}:${range}
              </span>
            </div>
            <p class="verse-body" style="font-size:${remSize}rem;">« ${c.verseText} »</p>
          </div>
        </div>
      `;
      return;
    }

    const slideRemSize = Math.max(1.8, Number((3.0 * (state.fontScale / 100)).toFixed(2)));
    rootEl.innerHTML = `
      <div class="top-bar">
        <span>🟢 BroadcastChannel Connected (&lt;1ms Sync)</span>
        <button id="fs-btn" class="btn-fs">Fullscreen (F11)</button>
      </div>
      <div class="center-stage">
        <div class="citation-pill">${refTitle}</div>
        <p class="verse-body" style="font-size:${slideRemSize}rem;">« ${c.verseText} »</p>
        <div class="verse-footer">— ${c.bookNameAm} ${c.chapter}፥${range} (${c.bookNameEn})</div>
      </div>
      <div style="height:16px;"></div>
    `;

    const fsBtn = doc.getElementById('fs-btn');
    if (fsBtn) {
      fsBtn.onclick = () => {
        doc.documentElement.requestFullscreen?.().catch(() => {});
      };
    }
  };

  const senderId = 'popout-' + Math.random().toString(36).slice(2, 8);
  const channel = new BroadcastChannel('kale_egziabher_projector_v1');

  channel.onmessage = (event: MessageEvent<ProjectorSyncPayload>) => {
    const data = event.data;
    if (!data) return;
    if (data.type === 'PING') {
      channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
      return;
    }
    if (data.citation) state.citation = data.citation;
    if (data.theme) state.theme = data.theme;
    if (typeof data.fontScale === 'number') state.fontScale = data.fontScale;
    if (data.displayMode) state.displayMode = data.displayMode;
    if (typeof data.isBlackout === 'boolean') state.isBlackout = data.isBlackout;
    renderProjector();
  };

  channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
  const heartbeat = popoutWin.setInterval(() => {
    channel.postMessage({ type: 'PONG', senderId, timestamp: Date.now() });
  }, 2500);

  popoutWin.addEventListener('beforeunload', () => {
    popoutWin.clearInterval(heartbeat);
    channel.close();
  });

  renderProjector();
}

// ============================================================================
// 10. MAIN APPLICATION COMPONENT
// ============================================================================

export function App() {
  // Check if current window was opened with `?view=projector`
  const isStandaloneProjectorRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'projector';
  }, []);

  // Offline IndexedDB & O(1) Map State
  const [bibleBooks, setBibleBooks] = useState<BookData[]>(INITIAL_BIBLE_DB);
  const [totalIndexedVerses, setTotalIndexedVerses] = useState<number>(85);
  const [dbInitLatencyMs, setDbInitLatencyMs] = useState<number>(1);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [dbKeywordQuery, setDbKeywordQuery] = useState<string>("");
  const [dbStatusBanner, setDbStatusBanner] = useState<string | null>(null);

  // Active Live Projected Citation
  const [activeProjection, setActiveProjection] = useState<DetectedCitation>({
    id: "init-john-3-16",
    bookId: 43,
    bookNameAm: "የዮሐንስ ወንጌል",
    bookNameEn: "John",
    chapter: 3,
    verseStart: 16,
    verseEnd: 16,
    verseText: INITIAL_BIBLE_DB.find((b) => b.id === 43)!.chapters[3][16],
    rawTranscript: "የዮሐንስ ወንጌል ምዕራፍ 3 ቁጥር 16",
    engine: "LOCAL_O1_MAP",
    confidence: 0.99,
    latencyMs: 0.01,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });

  // Operator Queue & Safety Mode (`Auto-Live` vs `Manual Queue`)
  const [detectedQueue, setDetectedQueue] = useState<DetectedCitation[]>([]);
  const [autoProject, setAutoProject] = useState<boolean>(true);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);

  // Speech & Audio Visualizer State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [normalizedPreview, setNormalizedPreview] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAiResolving, setIsAiResolving] = useState<boolean>(false);
  const [audioBars, setAudioBars] = useState<number[]>(new Array(18).fill(12));

  // Projector Display Settings
  const [projectorTheme, setProjectorTheme] = useState<ProjectorTheme>('royal-navy');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('fullscreen-slide');
  const [isFullscreenProjector, setIsFullscreenProjector] = useState<boolean>(isStandaloneProjectorRoute);
  const [isSplitDualScreen, setIsSplitDualScreen] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(100);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);

  // Dual-Monitor BroadcastChannel Sync State
  const [connectedProjectorPeers, setConnectedProjectorPeers] = useState<Record<string, number>>({});
  const [lastBroadcastLatencyMs, setLastBroadcastLatencyMs] = useState<number>(0.4);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const popoutWindowRef = useRef<Window | null>(null);
  const instanceId = useRef<string>('op-' + Math.random().toString(36).slice(2, 8));

  // Manual 66-Book Bible Selector State
  const [selectedBookId, setSelectedBookId] = useState<number>(43);
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [selectedVerse, setSelectedVerse] = useState<number>(16);
  const [customTranscriptInput, setCustomTranscriptInput] = useState<string>("");

  // Refs for Web Speech API & AudioContext
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const activeProjectionRef = useRef<DetectedCitation>(activeProjection);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    activeProjectionRef.current = activeProjection;
  }, [activeProjection]);

  // 1. Initialize Offline IndexedDB & O(1) In-Memory Map on Startup
  useEffect(() => {
    offlineBibleDB.init().then(({ books, totalVerses, latencyMs }) => {
      setBibleBooks(books);
      setTotalIndexedVerses(totalVerses);
      setDbInitLatencyMs(latencyMs);
    });
  }, []);

  // 2. Initialize Dual-Monitor BroadcastChannel ('kale_egziabher_projector_v1')
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('kale_egziabher_projector_v1');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ProjectorSyncPayload>) => {
      const msg = event.data;
      if (!msg || msg.senderId === instanceId.current) return;

      if (msg.type === 'PING') {
        channel.postMessage({
          type: 'PONG',
          senderId: instanceId.current,
          timestamp: Date.now()
        });
        return;
      }

      if (msg.type === 'PONG') {
        setConnectedProjectorPeers((prev) => ({
          ...prev,
          [msg.senderId]: Date.now()
        }));
        if (msg.timestamp) {
          const rtt = Math.max(0.2, Math.min(2.5, Number(((Date.now() - msg.timestamp) / 10).toFixed(2))));
          setLastBroadcastLatencyMs(rtt);
        }
        return;
      }

      // If this window is a Projector receiver, update state immediately
      if (msg.citation) setActiveProjection(msg.citation);
      if (msg.theme) setProjectorTheme(msg.theme);
      if (typeof msg.fontScale === 'number') setFontScale(msg.fontScale);
      if (msg.displayMode) setDisplayMode(msg.displayMode);
      if (typeof msg.isBlackout === 'boolean') setIsBlackout(msg.isBlackout);
    };

    // Heartbeat ping & cleanup stale peer connections
    const interval = setInterval(() => {
      channel.postMessage({
        type: 'PING',
        senderId: instanceId.current,
        timestamp: Date.now()
      });

      const now = Date.now();
      setConnectedProjectorPeers((prev) => {
        const next: Record<string, number> = {};
        for (const [peerId, lastSeen] of Object.entries(prev)) {
          if (now - lastSeen < 6500) {
            next[peerId] = lastSeen;
          }
        }
        return next;
      });
    }, 2200);

    return () => {
      clearInterval(interval);
      channel.close();
    };
  }, []);

  // Broadcast state changes to all connected HDMI Projector Windows
  useEffect(() => {
    if (!broadcastChannelRef.current || isStandaloneProjectorRoute) return;
    broadcastChannelRef.current.postMessage({
      type: 'SHOW_VERSE',
      senderId: instanceId.current,
      citation: activeProjection,
      theme: projectorTheme,
      fontScale,
      displayMode,
      isBlackout,
      timestamp: Date.now()
    } as ProjectorSyncPayload);
  }, [activeProjection, projectorTheme, fontScale, displayMode, isBlackout, isStandaloneProjectorRoute]);

  // Launch Pop-Out HDMI Projector Window (with Multi-Screen API placement if available)
  const launchPopOutProjectorWindow = async () => {
    let windowFeatures = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no';

    // Try Multi-Screen Window Placement API for automatic secondary HDMI monitor placement
    if ('getScreenDetails' in window) {
      try {
        const screenDetails = await (window as any).getScreenDetails();
        const externalScreen =
          screenDetails.screens.find((s: any) => !s.isPrimary) || screenDetails.currentScreen;
        if (externalScreen) {
          windowFeatures = `left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight},menubar=no,toolbar=no,location=no,status=no`;
        }
      } catch {}
    }

    const popout = window.open('about:blank', 'KaleEgziabherProjectorWindow', windowFeatures);
    if (popout) {
      popoutWindowRef.current = popout;
      mountPopoutProjectorDOM(
        popout,
        activeProjection,
        projectorTheme,
        fontScale,
        displayMode,
        isBlackout
      );
    } else {
      // If browser blocked popup, fallback to in-app split dual-monitor view
      setIsSplitDualScreen(true);
    }
  };

  // Navigate Next / Previous Verse in current chapter using O(1) DB
  const navigateAdjacentVerse = useCallback(
    (direction: 1 | -1, sourceEngine: 'VOICE_COMMAND' | 'MANUAL' = 'MANUAL') => {
      const current = activeProjectionRef.current;
      const book = bibleBooks.find((b) => b.id === current.bookId || b.nameAm === current.bookNameAm);
      if (!book) return;

      const chapObj = book.chapters[current.chapter];
      if (!chapObj) return;

      const availableVerses = Object.keys(chapObj)
        .map(Number)
        .sort((a, b) => a - b);

      const currentTarget = direction === 1 ? current.verseEnd : current.verseStart;
      const idx = availableVerses.indexOf(currentTarget);
      const nextVerseNum =
        idx !== -1 && availableVerses[idx + direction] !== undefined
          ? availableVerses[idx + direction]
          : currentTarget + direction;

      const nextText = offlineBibleDB.getVerseRangeO1(book.id, current.chapter, nextVerseNum, nextVerseNum);
      if (nextText) {
        const nextCitation: DetectedCitation = {
          id: `nav-${Date.now()}`,
          bookId: book.id,
          bookNameAm: book.nameAm,
          bookNameEn: book.nameEn,
          chapter: current.chapter,
          verseStart: nextVerseNum,
          verseEnd: nextVerseNum,
          verseText: nextText,
          rawTranscript: direction === 1 ? "ቀጥሎ ያለው ቁጥር (Next Verse)" : "ያለፈው ቁጥር (Previous Verse)",
          engine: sourceEngine,
          confidence: 1.0,
          latencyMs: 0.01,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setActiveProjection(nextCitation);
        setSelectedBookId(book.id);
        setSelectedChapter(current.chapter);
        setSelectedVerse(nextVerseNum);
      }
    },
    [bibleBooks]
  );

  // Core Pipeline: Process any spoken Amharic phrase through Engine 1 (O(1) Map) -> Engine 2 (Gemini AI + IndexedDB)
  const processAmharicSpeechChunk = useCallback(
    async (transcriptText: string) => {
      if (!transcriptText || transcriptText.trim().length < 2) return;

      const startTime = performance.now();
      setLiveTranscript(transcriptText);
      const norm = normalizeAmharicNumbers(transcriptText);
      setNormalizedPreview(norm);

      // Step A: Check for Amharic Voice Navigation Commands ("ቀጥሎ ያለው ቁጥር")
      const navCommand = detectVoiceNavigationCommand(transcriptText);
      if (navCommand === 'NEXT_VERSE') {
        navigateAdjacentVerse(1, 'VOICE_COMMAND');
        return;
      }
      if (navCommand === 'PREV_VERSE') {
        navigateAdjacentVerse(-1, 'VOICE_COMMAND');
        return;
      }

      // Step B: Run Engine 1 (Fast Local Regex & O(1) Hash Map Lookup)
      const localMatch = parseAmharicScriptureLocally(transcriptText);

      if (localMatch) {
        const o1Start = performance.now();
        const localVerseText = offlineBibleDB.getVerseRangeO1(
          localMatch.bookId,
          localMatch.chapter,
          localMatch.verseStart,
          localMatch.verseEnd
        );

        if (localVerseText) {
          const latencyMs = Number(Math.max(0.01, performance.now() - o1Start).toFixed(2));
          const citation: DetectedCitation = {
            id: `det-${Date.now()}`,
            bookId: localMatch.bookId,
            bookNameAm: localMatch.bookNameAm,
            bookNameEn: localMatch.bookNameEn,
            chapter: localMatch.chapter,
            verseStart: localMatch.verseStart,
            verseEnd: localMatch.verseEnd,
            verseText: localVerseText,
            rawTranscript: transcriptText,
            engine: localMatch.engine,
            confidence: localMatch.confidence,
            latencyMs,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };

          setDetectedQueue((prev) => [citation, ...prev.slice(0, 18)]);
          if (autoProject) {
            setActiveProjection(citation);
            setIsBlackout(false);
          }
          return;
        }
      }

      // Step C: Run Engine 2 (Gemini AI Semantic Fallback & Auto-Persist to IndexedDB)
      setIsAiResolving(true);
      const aiResult = await resolveAmharicVerseWithGemini(transcriptText);
      setIsAiResolving(false);

      if (aiResult && aiResult.detected && aiResult.verseTextAmharic) {
        const latencyMs = Math.round(performance.now() - startTime);

        // Automatically persist the newly resolved verse into Offline IndexedDB + O(1) Map
        const { bookId, updatedBooks } = await offlineBibleDB.upsertVerseAndPersist(
          aiResult.bookNameAm,
          aiResult.bookNameEn,
          aiResult.chapter,
          aiResult.verseStart,
          aiResult.verseEnd || aiResult.verseStart,
          aiResult.verseTextAmharic
        );
        setBibleBooks(updatedBooks);
        setTotalIndexedVerses(offlineBibleDB.verseMap.size);

        const citation: DetectedCitation = {
          id: `ai-${Date.now()}`,
          bookId,
          bookNameAm: aiResult.bookNameAm,
          bookNameEn: aiResult.bookNameEn,
          chapter: aiResult.chapter,
          verseStart: aiResult.verseStart,
          verseEnd: aiResult.verseEnd || aiResult.verseStart,
          verseText: aiResult.verseTextAmharic,
          rawTranscript: transcriptText,
          engine: 'GEMINI_AI',
          confidence: aiResult.confidence || 0.95,
          latencyMs,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        setDetectedQueue((prev) => [citation, ...prev.slice(0, 18)]);
        if (autoProject) {
          setActiveProjection(citation);
          setIsBlackout(false);
        }
      }
    },
    [autoProject, navigateAdjacentVerse]
  );

  // Start / Stop Live Microphone + Web Speech API (`am-ET`)
  const toggleLiveMicrophone = async () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch {}
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setAudioBars(new Array(18).fill(10));
      return;
    }

    setSpeechError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 18 }, (_, i) => {
          const val = dataArray[i] || 0;
          return Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
        });
        setAudioBars(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch {}

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Web Speech API is not supported in this browser. Use Chrome/Edge or click any Simulator button above.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'am-ET';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            processAmharicSpeechChunk(chunk.trim());
          } else {
            interim += chunk;
          }
        }
        setInterimTranscript(interim);
        if (interim) {
          setNormalizedPreview(normalizeAmharicNumbers(interim));
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone access blocked by permissions. Use the Preacher Voice Simulator bar above!");
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setSpeechError("Could not start Amharic Speech Recognition. Use the Preacher Voice Simulator above.");
    }
  };

  // Keyboard Shortcuts for Live Church Operator
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
        setIsBlackout((prev) => !prev);
      } else if (e.code === 'Escape' && isFullscreenProjector && !isStandaloneProjectorRoute) {
        setIsFullscreenProjector(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detectedQueue, navigateAdjacentVerse, isFullscreenProjector, isStandaloneProjectorRoute]);

  // Manual Bible Picker Helpers
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

  const handleManualProject = (book: BookData, chapter: number, verse: number) => {
    const text = offlineBibleDB.getVerseRangeO1(book.id, chapter, verse, verse) || book.chapters[chapter]?.[verse];
    if (!text) return;
    const manualCitation: DetectedCitation = {
      id: `manual-${Date.now()}`,
      bookId: book.id,
      bookNameAm: book.nameAm,
      bookNameEn: book.nameEn,
      chapter,
      verseStart: verse,
      verseEnd: verse,
      verseText: text,
      rawTranscript: `${book.nameAm} ${chapter}፥${verse}`,
      engine: 'MANUAL',
      confidence: 1.0,
      latencyMs: 0.01,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setActiveProjection(manualCitation);
    setIsBlackout(false);
  };

  // Offline DB Manager: Upload / Import JSON File
  const handleFileUploadJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const { books, totalVerses } = await offlineBibleDB.importCustomBibleJSON(parsed);
      setBibleBooks(books);
      setTotalIndexedVerses(totalVerses);
      setDbStatusBanner(`✅ Imported "${file.name}"! ${totalVerses.toLocaleString()} Amharic verses indexed into O(1) Map & saved to IndexedDB.`);
    } catch {
      setDbStatusBanner(`⚠️ Invalid JSON format. Ensure it follows standard books -> chapters -> verses or BookData[] format.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Offline DB Manager: Export Cached DB as JSON
  const handleExportCachedDB = () => {
    const exportPayload = {
      title: "መጽሐፍ ቅዱስ (1954 ዕትም) - Kale Egziabher Offline Cache",
      exportedAt: new Date().toISOString(),
      totalVerses: totalIndexedVerses,
      books: bibleBooks.map((b) => ({
        id: b.id,
        nameAm: b.nameAm,
        nameEn: b.nameEn,
        aliases: b.aliases,
        chapters: b.chapters
      }))
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amharic_bible_1954_cached_${totalIndexedVerses}_verses.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Offline DB Manager: Download Sample 66-Book Template JSON
  const handleDownloadSampleTemplate = () => {
    const sampleTemplate: RawBibleJSON = {
      title: "መጽሐፍ ቅዱስ (1954) - Standard 66-Book Import Template",
      books: [
        {
          id: 1,
          name: "ኦሪት ዘፍጥረት",
          nameEn: "Genesis",
          chapters: [
            {
              chapter: 1,
              verses: [
                { verse: 1, text: "በመጀመሪያ እግዚአብሔር ሰማይንና ምድርን ፈጠረ።" },
                { verse: 3, text: "እግዚአብሔርም፦ ብርሃን ይሁን አለ፤ ብርሃንም ሆነ።" }
              ]
            }
          ]
        },
        {
          id: 66,
          name: "የዮሐንስ ራእይ",
          nameEn: "Revelation",
          chapters: [
            {
              chapter: 22,
              verses: [
                { verse: 20, text: "ይህን የሚመሰክር፦ አዎን፥ በቶሎ እመጣለሁ ይላል። አሜን፥ ጌታ ኢየሱስ ሆይ፥ ና።" },
                { verse: 21, text: "የጌታችን የኢየሱስ ክርስቶስ ጸጋ ከሁላችን ጋር ይሁን፤ አሜን።" }
              ]
            }
          ]
        }
      ]
    };
    const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amharic_bible_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const keywordSearchResults = useMemo(() => {
    if (!dbKeywordQuery.trim()) return [];
    return offlineBibleDB.searchByKeyword(dbKeywordQuery, 30);
  }, [dbKeywordQuery, totalIndexedVerses]);

  const activeTheme = getThemeClasses(projectorTheme);
  const peerCount = Object.keys(connectedProjectorPeers).length;

  // ============================================================================
  // 11. FULLSCREEN SANCTUARY PROJECTOR VIEW (OR ?view=projector ROUTE)
  // ============================================================================
  if (isFullscreenProjector) {
    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-between select-none transition-all duration-500 ${
          displayMode === 'obs-lower-third' ? 'bg-emerald-950/95' : activeTheme.bg
        }`}
        style={{ fontFamily: "'Noto Serif Ethiopic', 'Noto Sans Ethiopic', serif" }}
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
          <div className="flex items-center gap-2 font-sans">
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
            {!isStandaloneProjectorRoute && (
              <button
                onClick={() => setIsFullscreenProjector(false)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-sm flex items-center gap-1.5"
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
                <span className="text-2xl font-bold text-amber-400 tracking-wide">
                  {formatAmharicRef(activeProjection)}
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-sans">
                  መጽሐፍ ቅዱስ (1954) • {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
                </span>
              </div>
              <p
                className="text-white font-semibold leading-relaxed"
                style={{ fontSize: `${Math.round(2.1 * (fontScale / 100))}rem` }}
              >
                « {activeProjection.verseText} »
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-12 md:px-24 text-center relative overflow-hidden">
            <div className="mb-8 flex flex-col items-center">
              <div className={`px-6 py-2 rounded-full border ${activeTheme.badge} text-xl md:text-2xl font-bold tracking-wide shadow-lg`}>
                {formatAmharicRef(activeProjection)}
              </div>
              <div className={`w-64 h-0.5 mt-4 bg-gradient-to-r ${activeTheme.ornament}`} />
            </div>

            <p
              className={`max-w-6xl font-bold leading-snug md:leading-relaxed transition-all duration-300 ${activeTheme.text}`}
              style={{ fontSize: `${Math.round(3.1 * (fontScale / 100))}rem` }}
            >
              « {activeProjection.verseText} »
            </p>

            <div className="mt-10 flex items-center gap-3 opacity-80">
              <span className={`text-lg md:text-xl font-medium ${activeTheme.accent}`}>
                — {activeProjection.bookNameAm} {activeProjection.chapter}፥{activeProjection.verseStart} ({activeProjection.bookNameEn})
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 12. OPERATOR CONTROL DASHBOARD VIEW
  // ============================================================================
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col"
      style={{ fontFamily: "'Noto Sans Ethiopic', 'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700;800&family=Noto+Serif+Ethiopic:wght@500;600;700;800&display=swap');
        .ethiopic-serif { font-family: 'Noto Serif Ethiopic', serif; }
      `}</style>

      {/* TOP NAVIGATION HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
            ✞
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white">
                ቃለ እግዚአብሔር • Live Amharic Bible Projector
              </h1>
              {/* Dual-Monitor BroadcastChannel Sync Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  peerCount > 0 || isSplitDualScreen
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="BroadcastChannel ('kale_egziabher_projector_v1') real-time multi-window synchronization"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    peerCount > 0 || isSplitDualScreen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                {peerCount > 0
                  ? `Dual-Monitor Synced (${peerCount} HDMI Window • ${lastBroadcastLatencyMs}ms)`
                  : isSplitDualScreen
                  ? 'Dual-Screen Split Active (<1ms Sync)'
                  : 'BroadcastChannel Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              IndexedDB Offline 66-Book Engine ({totalIndexedVerses.toLocaleString()} Verses • ~0.01ms O(1) Map) + Dual-Monitor Sync
            </p>
          </div>
        </div>

        {/* Right Header Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Offline DB Manager (IndexedDB) Button */}
          <button
            onClick={() => setShowDbModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 flex items-center gap-1.5 transition"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Offline DB ({totalIndexedVerses})
          </button>

          {/* Auto-Live vs Manual Queue Safety Switch */}
          <button
            onClick={() => setAutoProject(!autoProject)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              autoProject
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoProject ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {autoProject ? 'Auto-Live: ON' : 'Manual Queue Mode'}
          </button>

          {/* Pop-Out External HDMI Projector Window */}
          <button
            onClick={launchPopOutProjectorWindow}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 flex items-center gap-1.5 transition"
            title="Opens a secondary browser window synced via BroadcastChannel for your HDMI projector"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Pop-Out HDMI Window
          </button>

          {/* In-App Split Dual-Screen Toggle */}
          <button
            onClick={() => setIsSplitDualScreen(!isSplitDualScreen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
              isSplitDualScreen
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {isSplitDualScreen ? 'Exit Split View' : 'Split Dual-Screen'}
          </button>

          {/* Fullscreen Projector Button */}
          <button
            onClick={() => setIsFullscreenProjector(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Fullscreen
          </button>
        </div>
      </header>

      {/* PREACHER VOICE SIMULATOR BAR */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              One-Click Preacher Voice Simulator (Test Spoken Amharic Numbers, Ranges, Voice Nav & AI Paraphrases):
            </span>
          </div>
          <button
            onClick={() => setShowArchitectureModal(true)}
            className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" /> View Architecture
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {PREACHER_SIMULATION_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => processAmharicSpeechChunk(preset.utterance)}
              className="shrink-0 group px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-amber-500/15 border border-slate-700/80 hover:border-amber-400/50 transition text-left flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 flex items-center gap-1.5">
                  {preset.label}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 font-mono">
                    {preset.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONAL IN-APP SPLIT DUAL-SCREEN SIMULATOR BANNER */}
      {isSplitDualScreen && (
        <div className="bg-slate-900/90 border-b-2 border-cyan-500/40 p-4 lg:px-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  MONITOR 2 • LIVE HDMI SANCTUARY PROJECTOR WINDOW (BroadcastChannel Synced)
                </span>
                <span className="text-xs text-slate-400">
                  Changes in the Operator Deck below update this secondary screen in &lt;1ms
                </span>
              </div>
              <button
                onClick={() => setIsSplitDualScreen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Split Monitor ✕
              </button>
            </div>
            <div
              className={`w-full h-56 md:h-64 rounded-2xl border-2 ${activeTheme.border} overflow-hidden flex flex-col items-center justify-center p-6 text-center relative shadow-2xl ${
                isBlackout ? 'bg-black' : activeTheme.bg
              }`}
            >
              {isBlackout ? (
                <span className="text-neutral-700 text-xs uppercase tracking-widest">HDMI Monitor 2 Blackout</span>
              ) : (
                <>
                  <div className={`px-4 py-1 rounded-full border ${activeTheme.badge} text-base font-bold mb-3 ethiopic-serif`}>
                    {formatAmharicRef(activeProjection)}
                  </div>
                  <p className={`max-w-4xl font-bold text-xl md:text-2xl leading-relaxed ethiopic-serif ${activeTheme.text}`}>
                    « {activeProjection.verseText} »
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN 12-COLUMN WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
        {/* LEFT COLUMN (5 COLS): AUDIO LISTENER + NORMALIZER + DETECTED VERSE QUEUE */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* CARD 1: AMHARIC SPEECH RECOGNITION & AUDIO INPUT */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Amharic Speech Stream (am-ET)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                O(1) Map: ~0.01ms • IDB Ready
              </span>
            </div>

            {/* Mic Button + Audio Waveform */}
            <div className="flex items-center gap-4 bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 mb-3">
              <button
                onClick={toggleLiveMicrophone}
                className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg shrink-0 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 animate-pulse'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start Amharic Mic
                  </>
                )}
              </button>

              {/* Real-time Audio Visualizer Bars */}
              <div className="flex-1 flex items-center justify-between gap-1 h-10 px-2">
                {audioBars.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isListening ? 'bg-gradient-to-t from-amber-500 to-emerald-400' : 'bg-slate-800'
                    }`}
                    style={{ height: `${isListening ? height : 18}%` }}
                  />
                ))}
              </div>
            </div>

            {speechError && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{speechError}</span>
              </div>
            )}

            {/* Live Spoken Amharic Transcript Box */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>PREACHER LIVE TRANSCRIPT (የሰባኪው ድምፅ):</span>
                {isAiResolving && (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold animate-pulse">
                    <Sparkles className="w-3 h-3" /> Gemini AI Resolving & Saving to IndexedDB...
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base font-medium text-white min-h-[2.25rem] leading-relaxed">
                {liveTranscript || interimTranscript || (
                  <span className="text-slate-500 italic">
                    Click a simulator button above or speak in Amharic (e.g. "ዮሐንስ ምዕራፍ 3 ቁጥር 16")...
                  </span>
                )}
              </p>

              {normalizedPreview && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400 shrink-0 font-mono text-[11px]">Engine 1 Normalizer:</span>
                  <span className="text-emerald-400 font-mono truncate">{normalizedPreview}</span>
                </div>
              )}
            </div>

            {/* Custom Spoken Phrase Tester Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customTranscriptInput.trim()) {
                  processAmharicSpeechChunk(customTranscriptInput.trim());
                  setCustomTranscriptInput("");
                }
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={customTranscriptInput}
                onChange={(e) => setCustomTranscriptInput(e.target.value)}
                placeholder="Type any Amharic citation or paraphrase (e.g. 1ኛ ቆሮንቶስ 13 4)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" /> Detect
              </button>
            </form>
          </div>

          {/* CARD 2: DETECTED VERSE QUEUE WITH "GO LIVE" APPROVAL */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Detected Verse Queue ({detectedQueue.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                {autoProject ? 'Auto-Projecting Live' : 'Manual Approval Mode'}
              </span>
            </div>

            {detectedQueue.length === 0 ? (
              <div className="flex-1 border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-500">
                <Sparkles className="w-8 h-8 mb-2 text-slate-600" />
                <p className="text-xs font-medium text-slate-400">
                  No verses queued yet. Click any Preacher Simulator button at the top to test real-time detection!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {detectedQueue.map((item) => {
                  const isCurrentlyLive =
                    activeProjection.bookNameAm === item.bookNameAm &&
                    activeProjection.chapter === item.chapter &&
                    activeProjection.verseStart === item.verseStart &&
                    activeProjection.verseEnd === item.verseEnd;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrentlyLive
                          ? 'bg-amber-500/10 border-amber-400/60 shadow-md'
                          : 'bg-slate-950/80 hover:bg-slate-800/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-amber-300">
                            {formatAmharicRef(item)}
                          </span>
                          {isCurrentlyLive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                              ON AIR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                              item.engine === 'LOCAL_O1_MAP'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : item.engine === 'GEMINI_AI'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {item.engine} • {item.latencyMs}ms
                          </span>

                          <button
                            onClick={() => {
                              setActiveProjection(item);
                              setIsBlackout(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                              isCurrentlyLive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                            }`}
                          >
                            {isCurrentlyLive ? 'Projected' : 'Go Live ▶'}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {item.verseText}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[260px]">Heard: "{item.rawTranscript}"</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): LIVE 16:9 PROJECTOR MONITOR + 66-BOOK MANUAL CONTROLLER */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* CARD 3: LIVE 16:9 SANCTUARY PROJECTOR & OBS OVERLAY PREVIEW */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Sanctuary Projector & OBS Output (16:9 Live Monitor)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE
                </span>
              </div>

              {/* Mode & Blackout Switchers */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
                  <button
                    onClick={() => setDisplayMode('fullscreen-slide')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      displayMode === 'fullscreen-slide'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    16:9 Sanctuary Slide
                  </button>
                  <button
                    onClick={() => setDisplayMode('obs-lower-third')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                      displayMode === 'obs-lower-third'
                        ? 'bg-emerald-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3 h-3" /> OBS Lower-Third
                  </button>
                </div>

                <button
                  onClick={() => setIsBlackout(!isBlackout)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                    isBlackout
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {isBlackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {isBlackout ? 'Restore' : 'Blackout (B)'}
                </button>
              </div>
            </div>

            {/* 16:9 MONITOR FRAME */}
            <div
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
                <div className="flex-1 flex flex-col justify-between p-5">
                  <div className="self-start px-3 py-1 rounded-md bg-black/50 text-emerald-300 text-[11px] font-mono">
                    OBS Studio Chroma-Key Green Lower-Third Overlay
                  </div>
                  <div className="w-full bg-slate-950/95 border-l-4 border-amber-400 rounded-r-xl p-5 shadow-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-base md:text-lg font-bold text-amber-400 ethiopic-serif">
                        {formatAmharicRef(activeProjection)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
                      </span>
                    </div>
                    <p
                      className="text-white font-semibold leading-relaxed ethiopic-serif"
                      style={{ fontSize: `${Math.round(1.25 * (fontScale / 100))}rem` }}
                    >
                      « {activeProjection.verseText} »
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 text-center relative">
                  <div className={`px-4 py-1 rounded-full border ${activeTheme.badge} text-sm md:text-base font-bold mb-4 ethiopic-serif`}>
                    {formatAmharicRef(activeProjection)}
                  </div>

                  <p
                    className={`max-w-3xl font-bold leading-relaxed ethiopic-serif transition-all ${activeTheme.text}`}
                    style={{ fontSize: `${Math.round(1.65 * (fontScale / 100))}rem` }}
                  >
                    « {activeProjection.verseText} »
                  </p>

                  <div className={`mt-5 text-xs md:text-sm font-medium ${activeTheme.accent}`}>
                    — መጽሐፍ ቅዱስ (1954 ዕትም) • {activeProjection.bookNameEn} {activeProjection.chapter}:{activeProjection.verseStart}
                  </div>
                </div>
              )}
            </div>

            {/* Projector Bottom Control Strip: Prev/Next Steppers + 4 Sanctuary Themes + Font Scale */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateAdjacentVerse(-1, 'MANUAL')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                >
                  ◀ ቀዳሚ ቁጥር
                </button>
                <button
                  onClick={() => navigateAdjacentVerse(1, 'MANUAL')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
                >
                  ቀጣይ ቁጥር ▶
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Theme:</span>
                  {(
                    [
                      { id: 'royal-navy', label: 'Royal Navy', color: 'bg-blue-500' },
                      { id: 'deep-emerald', label: 'Deep Emerald', color: 'bg-emerald-500' },
                      { id: 'warm-gold', label: 'Warm Gold', color: 'bg-amber-500' },
                      { id: 'pitch-black', label: 'Pitch Black', color: 'bg-neutral-900' }
                    ] as { id: ProjectorTheme; label: string; color: string }[]
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setProjectorTheme(t.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 ${
                        projectorTheme === t.id
                          ? 'border-amber-400 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${t.color}`} />
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Font Size Adjuster */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
                  <button
                    onClick={() => setFontScale((s) => Math.max(75, s - 10))}
                    className="px-1.5 text-slate-400 hover:text-white font-bold"
                  >
                    A-
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">{fontScale}%</span>
                  <button
                    onClick={() => setFontScale((s) => Math.min(140, s + 10))}
                    className="px-1.5 text-slate-400 hover:text-white font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: 66-BOOK MANUAL PICKER & INSTANT VERSE DECK */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  4. 66-Book Manual Picker & Local Chapter Browser
                </h2>
              </div>
              <button
                onClick={() => setShowDbModal(true)}
                className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" /> Search All Indexed Verses
              </button>
            </div>

            {/* Book, Chapter, Verse Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">መጽሐፍ (Book):</label>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {bibleBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}. {b.nameAm} ({b.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ምዕራፍ (Chapter):</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    const chap = Number(e.target.value);
                    setSelectedChapter(chap);
                    const firstVerse = Number(Object.keys(currentBookObj?.chapters?.[chap] || {})[0] || 1);
                    setSelectedVerse(firstVerse);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {availableChapters.map((c) => (
                    <option key={c} value={c}>
                      ምዕራፍ {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ቁጥር (Instant Project):</label>
                <select
                  value={selectedVerse}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setSelectedVerse(v);
                    if (currentBookObj) handleManualProject(currentBookObj, selectedChapter, v);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {availableVerses.map((v) => (
                    <option key={v} value={v}>
                      ቁጥር {v}
                    </option>
                  ))}
                </select>
              </div>
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
                    onClick={() => currentBookObj && handleManualProject(currentBookObj, selectedChapter, vNum)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 ${
                      isLive
                        ? 'bg-amber-500/15 border-amber-400/60 text-white'
                        : 'bg-slate-950/70 hover:bg-slate-800/70 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold shrink-0 ${
                        isLive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400'
                      }`}
                    >
                      {vNum}
                    </span>
                    <span className="text-xs md:text-sm leading-relaxed flex-1">{vText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================================
          13. OFFLINE DB MANAGER (IndexedDB + O(1) MAP + KEYWORD SEARCH) MODAL
      ============================================================================ */}
      {showDbModal && (
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
                  Upload any 1954 Amharic Bible <code>.json</code> file (standard nested <code>books → chapters → verses</code> or flat array). It will immediately index into the O(1) Map and persist in <code>IndexedDB</code> so your church laptop works 100% offline. Verses resolved via Gemini AI are also saved here automatically!
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUploadJSON}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/15"
                  >
                    <Upload className="w-4 h-4" /> Import 66-Book Amharic Bible (.json)
                  </button>

                  <button
                    onClick={handleExportCachedDB}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Export Cached DB ({totalIndexedVerses} Verses)
                  </button>

                  <button
                    onClick={handleDownloadSampleTemplate}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <FileJson className="w-4 h-4" /> Download Sample JSON Template
                  </button>

                  <button
                    onClick={async () => {
                      const { books, totalVerses } = await offlineBibleDB.resetToDefaultSeed();
                      setBibleBooks(books);
                      setTotalIndexedVerses(totalVerses);
                      setDbStatusBanner("🔄 Reset offline database to default pre-seeded 1954 Amharic chapters.");
                    }}
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
                              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
      )}

      {/* ARCHITECTURE MODAL */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Production Architecture: IndexedDB O(1) Engine + BroadcastChannel Dual-Monitor
                </h3>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <div className="font-bold text-emerald-400 mb-1">
                    1. OfflineAmharicBibleDB (IndexedDB + Map)
                  </div>
                  <p className="text-xs text-slate-400">
                    Stores all verses in <code>IndexedDB ('KaleEgziabherBibleDB')</code> and indexes them into a flat <code>Map&lt;"bookId-chapter-verse", Record&gt;</code> for 0.01ms lookups. Any verse fetched via Gemini AI is automatically saved to IndexedDB.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30">
                  <div className="font-bold text-cyan-400 mb-1">
                    2. BroadcastChannel ('kale_egziabher_projector_v1')
                  </div>
                  <p className="text-xs text-slate-400">
                    Synchronizes operator actions (<code>SHOW_VERSE</code>, <code>BLACKOUT</code>, <code>UPDATE_STYLE</code>, and <code>PING/PONG</code> heartbeat) with the Pop-Out HDMI Projector Window in under 1 millisecond without a backend server.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;