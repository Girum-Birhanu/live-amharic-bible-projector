import type { ProjectorTheme, DetectedCitation, AmharicFontFamily, CustomFontRecord } from '../types';

// ============================================================================
// 8. SHARED THEME & CITATION FORMATTERS
// ============================================================================

export interface ThemeClasses {
  bg: string;
  border: string;
  accent: string;
  badge: string;
  text: string;
  ornament: string;
  activeVerseBox: string;
  activeVerseText: string;
}

export function getThemeClasses(theme: ProjectorTheme): ThemeClasses {
  switch (theme) {
    case 'royal-navy':
      return {
        bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950',
        border: 'border-cyan-400/40',
        accent: 'text-amber-300',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        text: 'text-white',
        ornament: 'from-transparent via-amber-400/60 to-transparent',
        activeVerseBox: 'border-amber-400/90 bg-amber-500/20 shadow-xl shadow-amber-500/10',
        activeVerseText: 'text-amber-200'
      };
    case 'deep-emerald':
      return {
        bg: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950',
        border: 'border-emerald-400/40',
        accent: 'text-emerald-300',
        badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
        text: 'text-emerald-50',
        ornament: 'from-transparent via-emerald-400/60 to-transparent',
        activeVerseBox: 'border-emerald-400/90 bg-emerald-500/25 shadow-xl shadow-emerald-500/10',
        activeVerseText: 'text-emerald-100'
      };
    case 'warm-gold':
      return {
        bg: 'bg-gradient-to-br from-stone-950 via-amber-950 to-yellow-950',
        border: 'border-amber-500/40',
        accent: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        text: 'text-amber-50',
        ornament: 'from-transparent via-amber-400/60 to-transparent',
        activeVerseBox: 'border-amber-400/90 bg-amber-500/30 shadow-xl shadow-amber-500/15',
        activeVerseText: 'text-amber-100'
      };
    case 'pitch-black':
    default:
      return {
        bg: 'bg-black',
        border: 'border-neutral-800',
        accent: 'text-amber-400',
        badge: 'bg-neutral-900 text-amber-400 border-neutral-700',
        text: 'text-white',
        ornament: 'from-transparent via-neutral-600 to-transparent',
        activeVerseBox: 'border-amber-500 bg-amber-500/15 shadow-xl',
        activeVerseText: 'text-amber-300'
      };
  }
}

export function formatAmharicRef(c: DetectedCitation, overrideRange?: string): string {
  if (overrideRange) {
    return `${c.bookNameAm} ምዕራፍ ${c.chapter} ፥ ${overrideRange}`;
  }
  const range = c.verseEnd > c.verseStart ? `${c.verseStart}-${c.verseEnd}` : `${c.verseStart}`;
  return `${c.bookNameAm} ምዕራፍ ${c.chapter} ፥ ${range}`;
}

export interface AmharicFontOption {
  id: AmharicFontFamily;
  label: string;
  amLabel: string;
  cssClass: string;
  fontFamily: string;
  category: 'Serif' | 'Sans' | 'Calligraphic' | 'Modern' | 'System' | 'Mono';
  description: string;
}

export const AMHARIC_FONTS: AmharicFontOption[] = [
  {
    id: 'noto-serif',
    label: 'Noto Serif Ethiopic',
    amLabel: 'ኖቶ ሰሪፍ (ባህላዊ መደበኛ)',
    cssClass: 'font-noto-serif',
    fontFamily: "'Noto Serif Ethiopic', 'Nyala', serif",
    category: 'Serif',
    description: 'የታተመ መጽሐፍ ቅዱስ መደበኛ ቅርጸ-ቁምፊ (Classic Printed Bible Serif)'
  },
  {
    id: 'noto-sans',
    label: 'Noto Sans Ethiopic',
    amLabel: 'ኖቶ ሳንስ (ዘመናዊ ንጹህ)',
    cssClass: 'font-noto-sans',
    fontFamily: "'Noto Sans Ethiopic', 'Segoe UI Historic', sans-serif",
    category: 'Sans',
    description: 'ንጹህና ዘመናዊ ቅርጽ ለኤልኢዲ ፕሮጀክተር (Clean Modern Sans-Serif)'
  },
  {
    id: 'abyssinica',
    label: 'Abyssinica SIL',
    amLabel: 'አቢሲኒካ (ጥንታዊ የብራና ቅጂ)',
    cssClass: 'font-abyssinica',
    fontFamily: "'Abyssinica SIL', 'Noto Serif Ethiopic', serif",
    category: 'Calligraphic',
    description: 'የጥንት የብራና መጻሕፍት ውብ የካሊግራፊ ቅርጽ (Ecclesiastical Calligraphy)'
  },
  {
    id: 'menbere',
    label: 'Menbere',
    amLabel: 'መንበረ (ውብና ግልጽ)',
    cssClass: 'font-menbere',
    fontFamily: "'Menbere', 'Noto Sans Ethiopic', sans-serif",
    category: 'Modern',
    description: 'ዘመናዊና የተመጣጠነ ማራኪ ቅርጽ (Contemporary Low-Contrast Display)'
  },
  {
    id: 'nyala',
    label: 'Nyala',
    amLabel: 'ኛላ (የዊንዶውስ መደበኛ)',
    cssClass: 'font-nyala',
    fontFamily: "'Nyala', 'Noto Serif Ethiopic', serif",
    category: 'System',
    description: 'በቤተክርስቲያን ሚዲያ የተለመደው የዊንዶውስ ፊደል (Windows Classic)'
  },
  {
    id: 'hibur-mono',
    label: 'Hibur Mono',
    amLabel: 'ሂቡር ሞኖ (ጂኦሜትሪክ)',
    cssClass: 'font-hibur-mono',
    fontFamily: "'Hibur Mono', monospace",
    category: 'Mono',
    description: 'ቋሚ ወርድ ያለው ጂኦሜትሪክ ቅርጽ (Monospaced Geometric)'
  }
];

export function getAmharicFontClass(font: AmharicFontFamily): string {
  const match = AMHARIC_FONTS.find((f) => f.id === font);
  return match ? match.cssClass : 'font-noto-serif';
}

export function getAmharicFontFamily(font: AmharicFontFamily, customFonts?: CustomFontRecord[]): string {
  if (customFonts && customFonts.length > 0) {
    const customMatch = customFonts.find((f) => f.id === font);
    if (customMatch) return customMatch.family;
  }
  const match = AMHARIC_FONTS.find((f) => f.id === font);
  if (match) return match.fontFamily;
  if (font && !AMHARIC_FONTS.some((f) => f.id === font)) {
    return `'${font}', 'Noto Serif Ethiopic', 'Nyala', serif`;
  }
  return "'Noto Serif Ethiopic', 'Nyala', serif";
}
