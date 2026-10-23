import { CANONICAL_66_BOOKS } from '../data/canonical-books';
import { offlineBibleDB } from './bible-db';

export const GE_EZ_NUMERALS: Record<string, number> = {
  '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8, '፱': 9,
  '፲': 10, '፳': 20, '፴': 30, '፵': 40, '፶': 50, '፷': 60, '፸': 70, '፹': 80, '፺': 90, '፻': 100
};

export const AMHARIC_TENS: Record<string, number> = {
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

export const AMHARIC_UNITS: Record<string, number> = {
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

export const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  'zero': 0, 'one': 1, 'first': 1, 'two': 2, 'second': 2, 'three': 3, 'third': 3,
  'four': 4, 'fourth': 4, 'five': 5, 'fifth': 5, 'six': 6, 'sixth': 6, 'seven': 7,
  'seventh': 7, 'eight': 8, 'eighth': 8, 'nine': 9, 'ninth': 9, 'ten': 10, 'tenth': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty one': 21, 'twenty two': 22, 'twenty three': 23, 'twenty four': 24, 'twenty five': 25,
  'thirty': 30, 'forty': 40, 'fifty': 50
};

// English abbreviations & aliases for canonical books
const ENGLISH_BOOK_ABBREVIATIONS: Record<number, string[]> = {
  1: ['Gen', 'Genesis'], 2: ['Ex', 'Exod', 'Exodus'], 3: ['Lev', 'Leviticus'], 4: ['Num', 'Numbers'], 5: ['Deut', 'Deuteronomy'],
  6: ['Josh', 'Joshua'], 7: ['Judg', 'Judges'], 8: ['Ruth'],
  9: ['1 Sam', '1Sam', '1 Samuel', '1st Samuel'], 10: ['2 Sam', '2Sam', '2 Samuel', '2nd Samuel'],
  11: ['1 Kings', '1Kgs', '1st Kings'], 12: ['2 Kings', '2Kgs', '2nd Kings'],
  13: ['1 Chron', '1Chr', '1 Chronicles'], 14: ['2 Chron', '2Chr', '2 Chronicles'],
  15: ['Ezra'], 16: ['Neh', 'Nehemiah'], 17: ['Esther', 'Esth'], 18: ['Job'],
  19: ['Ps', 'Psalm', 'Psalms'], 20: ['Prov', 'Proverbs'], 21: ['Eccl', 'Ecclesiastes'],
  22: ['Song of Solomon', 'Song'], 23: ['Isa', 'Isaiah'], 24: ['Jer', 'Jeremiah'],
  25: ['Lam', 'Lamentations'], 26: ['Ezek', 'Ezekiel'], 27: ['Dan', 'Daniel'],
  28: ['Hos', 'Hosea'], 29: ['Joel'], 30: ['Amos'], 31: ['Obad', 'Obadiah'],
  32: ['Jonah', 'Jon'], 33: ['Mic', 'Micah'], 34: ['Nah', 'Nahum'],
  35: ['Hab', 'Habakkuk'], 36: ['Zeph', 'Zephaniah'], 37: ['Hag', 'Haggai'],
  38: ['Zech', 'Zechariah'], 39: ['Mal', 'Malachi'],
  40: ['Matt', 'Mt', 'Matthew'], 41: ['Mark', 'Mk'], 42: ['Luke', 'Lk'],
  43: ['John', 'Jn', 'Jhn', 'Gospel of John', 'John Gospel'],
  44: ['Acts'], 45: ['Rom', 'Romans'],
  46: ['1 Cor', '1Cor', '1 Corinthians', '1st Corinthians'],
  47: ['2 Cor', '2Cor', '2 Corinthians', '2nd Corinthians'],
  48: ['Gal', 'Galatians'], 49: ['Eph', 'Ephesians'],
  50: ['Phil', 'Philippians'], 51: ['Col', 'Colossians'],
  52: ['1 Thess', '1Thess', '1 Thessalonians'], 53: ['2 Thess', '2Thess', '2 Thessalonians'],
  54: ['1 Tim', '1Tim', '1 Timothy'], 55: ['2 Tim', '2Tim', '2 Timothy'],
  56: ['Titus', 'Tit'], 57: ['Philem', 'Philemon'], 58: ['Heb', 'Hebrews'],
  59: ['Jas', 'James'], 60: ['1 Pet', '1Pet', '1 Peter'], 61: ['2 Pet', '2Pet', '2 Peter'],
  62: ['1 John', '1John', '1st John', '1 Jn', '1Jn', 'First John'],
  63: ['2 John', '2John', '2nd John', '2 Jn', '2Jn', 'Second John'],
  64: ['3 John', '3John', '3rd John', '3 Jn', '3Jn', 'Third John'],
  65: ['Jude'], 66: ['Rev', 'Revelation', 'Revelations']
};

/**
 * Normalizes Ge'ez numerals, compound spoken numbers, English number words, and standalone spoken numbers to digits.
 */
export function normalizeAmharicNumbers(input: string): string {
  let text = input;

  // 1. Convert Ge'ez compound numerals (e.g., ፲፮ -> 16)
  text = text.replace(/[፩-፻]+/g, (match) => {
    let total = 0;
    for (const char of match) {
      total += GE_EZ_NUMERALS[char] || 0;
    }
    return total > 0 ? String(total) : match;
  });

  // 2. Convert spoken English numbers (e.g., "six" -> "6", "seven" -> "7")
  Object.entries(ENGLISH_NUMBER_WORDS).forEach(([word, num]) => {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(num));
  });

  // 3. Normalize book prefixes for multi-part books (English and Amharic)
  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ዮሐንስ|john|jn)/gi, ' 1ኛ ዮሐንስ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ዮሐንስ|john|jn)/gi, ' 2ኛ ዮሐንስ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሦስተኛ|ሶስተኛ|3ኛ|3rd|third|3|፫|፫ኛ)\s*(?:ዮሐንስ|john|jn)/gi, ' 3ኛ ዮሐንስ ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ቆሮንቶስ|corinthians|cor)/gi, ' 1ኛ ቆሮንቶስ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ቆሮንቶስ|corinthians|cor)/gi, ' 2ኛ ቆሮንቶስ ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ጴጥሮስ|peter|pet)/gi, ' 1ኛ ጴጥሮስ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ጴጥሮስ|peter|pet)/gi, ' 2ኛ ጴጥሮስ ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ጢሞቴዎስ|timothy|tim)/gi, ' 1ኛ ጢሞቴዎስ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ጢሞቴዎስ|timothy|tim)/gi, ' 2ኛ ጢሞቴዎስ ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ተሰሎንቄ|thessalonians|thess)/gi, ' 1ኛ ተሰሎንቄ ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ተሰሎንቄ|thessalonians|thess)/gi, ' 2ኛ ተሰሎንቄ ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ሳሙኤል|samuel|sam)/gi, ' 1ኛ ሳሙኤል ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ሳሙኤል|samuel|sam)/gi, ' 2ኛ ሳሙኤል ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ነገሥት|ነገስት|kings|kgs)/gi, ' 1ኛ ነገሥት ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ነገሥት|ነገስት|kings|kgs)/gi, ' 2ኛ ነገሥት ');

  text = text.replace(/(?:^|[\s፡፣,])(?:አንደኛ|1ኛ|1st|first|1|፩|፩ኛ)\s*(?:ዜና|chronicles|chr)/gi, ' 1ኛ ዜና ');
  text = text.replace(/(?:^|[\s፡፣,])(?:ሁለተኛ|2ኛ|2nd|second|2|፪|፪ኛ)\s*(?:ዜና|chronicles|chr)/gi, ' 2ኛ ዜና ');

  // 4. Convert compound spoken Amharic numbers (e.g., "አሥራ ስድስት" -> "16", "ሃያ ሦስት" -> "23")
  const tensPattern = Object.keys(AMHARIC_TENS).join('|');
  const unitsPattern = Object.keys(AMHARIC_UNITS).join('|');
  const compoundRegex = new RegExp(`(${tensPattern})\\s+(${unitsPattern})`, 'g');

  text = text.replace(compoundRegex, (_, tenWord, unitWord) => {
    const val = (AMHARIC_TENS[tenWord] || 0) + (AMHARIC_UNITS[unitWord] || 0);
    return String(val);
  });

  // 5. Convert standalone tens ("ሃያ" -> "20", "ሠላሳ" -> "30")
  Object.entries(AMHARIC_TENS).forEach(([word, num]) => {
    text = text.replace(new RegExp(`(?<!\\S)${word}(?!\\S)`, 'g'), String(num));
  });

  // 6. Convert standalone units ("ሦስት" -> "3", "አንድ" -> "1")
  Object.entries(AMHARIC_UNITS).forEach(([word, num]) => {
    text = text.replace(new RegExp(`(?<!\\S)${word}(?!\\S)`, 'g'), String(num));
  });

  return text;
}

/**
 * Detects voice navigation cues such as "ቀጣዩን ቁጥር" or "ወደ ኋላ ስንመለስ"
 */
export function detectVoiceNavigationCommand(transcript: string): 'NEXT_VERSE' | 'PREV_VERSE' | null {
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

export interface ParsedScriptureResult {
  bookId: number;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  engine: 'LOCAL_O1_MAP' | 'LOCAL_SEMANTIC';
  confidence: number;
}

export interface CompiledBookAlias {
  bookId: number;
  bookNameAm: string;
  bookNameEn: string;
  alias: string;
  isSpecific: boolean;
  prefixPattern: string;
  suffixPattern: string;
}

// Pre-compiled global alias registry sorted: specific/numbered first, then longest-match first
export const COMPILED_BOOK_ALIASES: CompiledBookAlias[] = (() => {
  const list: CompiledBookAlias[] = [];
  for (const book of CANONICAL_66_BOOKS) {
    const allAliases = new Set<string>(book.aliases);
    const cleanEn = book.nameEn.replace(/\s*\(Gospel\)/i, '').trim();
    allAliases.add(cleanEn);
    allAliases.add(cleanEn.toLowerCase());

    const extraEn = ENGLISH_BOOK_ABBREVIATIONS[book.id];
    if (extraEn) {
      for (const e of extraEn) {
        allAliases.add(e);
        allAliases.add(e.toLowerCase());
      }
    }

    for (const alias of allAliases) {
      const isSpecific = /^(?:[123፩፪፫]|1ኛ|2ኛ|3ኛ|1st|2nd|3rd|first|second|third|አንደኛ|ሁለተኛ|ሦስተኛ|ሶስተኛ|የ|ወደ|gospel)/i.test(alias);
      const isGenericPlain = !isSpecific;
      const prefixPattern = isGenericPlain
        ? '(?<!(?:[123፩፪፫]|1ኛ|2ኛ|3ኛ|1st|2nd|3rd|first|second|third|አንደኛ|ሁለተኛ|ሦስተኛ|ሶስተኛ)\\s*)'
        : '';
      const suffixPattern = /^(?:ዮሐንስ|john)$/i.test(alias)
        ? '(?!\\s*(?:መልእክት|ራእይ|ራዕይ|epistle|letter|revelation))'
        : '';

      list.push({
        bookId: book.id,
        bookNameAm: book.nameAm,
        bookNameEn: book.nameEn,
        alias,
        isSpecific,
        prefixPattern,
        suffixPattern,
      });
    }
  }

  // Specific / Numbered books match first; within that, longest alias wins
  list.sort((x, y) => {
    if (x.isSpecific !== y.isSpecific) return x.isSpecific ? -1 : 1;
    return y.alias.length - x.alias.length;
  });

  return list;
})();

// Canonical max chapters for all 66 books
export const BOOK_MAX_CHAPTERS: Record<number, number> = {
  1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
  11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150, 20: 31,
  21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14, 29: 3, 30: 9,
  31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14, 39: 4, 40: 28,
  41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13, 48: 6, 49: 6, 50: 4,
  51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1, 58: 13, 59: 5, 60: 5,
  61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22
};

/**
 * Dynamically decomposes fused numbers (e.g. "25" -> chapter 2, verse 5; "316" -> chapter 3, verse 16;
 * "67" -> chapter 6, verse 7; "828" -> chapter 8, verse 28) across all 66 books.
 * Triggered whenever speech-to-text outputs a single fused numeral exceeding the book's chapter count.
 */
export function decomposeFusedChapterVerse(
  bookId: number,
  numStr: string
): { chapter: number; verse: number } | null {
  const maxChap = BOOK_MAX_CHAPTERS[bookId] || 50;
  const originalNum = parseInt(numStr, 10);

  // If the number is already a valid chapter in this book (and not a single-chapter book), keep as chapter
  if (originalNum <= maxChap && maxChap > 1) {
    return null;
  }

  // Handle single-chapter books (Jude, Philemon, 2 John, 3 John, Obadiah)
  // e.g. "ይሁዳ 24" -> Chapter 1, Verse 24
  if (maxChap === 1 && originalNum > 1) {
    return { chapter: 1, verse: originalNum };
  }

  const candidates: Array<{ chapter: number; verse: number; hasVerseInDb: boolean }> = [];

  for (let i = 1; i < numStr.length; i++) {
    const cStr = numStr.slice(0, i);
    const vStr = numStr.slice(i);

    // Verse numbers cannot start with 0
    if (vStr.startsWith('0')) continue;

    const c = parseInt(cStr, 10);
    const v = parseInt(vStr, 10);

    if (c >= 1 && c <= maxChap && v >= 1) {
      const hasVerseInDb = offlineBibleDB.verseMap.has(`${bookId}-${c}-${v}`);
      candidates.push({ chapter: c, verse: v, hasVerseInDb });
    }
  }

  if (candidates.length === 0) return null;

  // 1. If any candidate matches an indexed verse in the database, prioritize it
  const dbMatch = candidates.find((c) => c.hasVerseInDb);
  if (dbMatch) {
    return { chapter: dbMatch.chapter, verse: dbMatch.verse };
  }

  // 2. Otherwise pick the most plausible candidate
  return candidates[candidates.length - 1];
}

/**
 * Checks specifically for explicit citation patterns (Book + Chapter [ + Verse])
 * Supports both full conversational phrases (e.g. "ዮሐንስ ምዕራፍ 6 ቁጥር 7", "john chapter 6 verse 7")
 * and fast short syntax (e.g. "john 6 7", "john 6:7", "ዮሐንስ 6 7", "ዮሐንስ 6 7-10")
 * Used by speech recognition to immediately trigger without waiting for sentence debounce.
 */
export function parseExplicitCitationLocally(
  rawTranscript: string
): ParsedScriptureResult | null {
  const normalized = normalizeAmharicNumbers(rawTranscript);

  // Match against pre-compiled canonical aliases (priority-ordered & length-sorted)
  for (const item of COMPILED_BOOK_ALIASES) {
    // Pattern 1: Standard or Fast Short -> [Book] (በምዕራፍ|chapter|ch)? [Chapter] (ከቁጥር|verse|v)? [Verse]?
    const forwardRegex = new RegExp(
      `${item.prefixPattern}${item.alias}${item.suffixPattern}[\\s፣,]*?(?:በምዕራፍ|ምዕራፍ|መዝሙር|ላይ|chapter|chap|ch|c)?\\s*(\\d+)(?:[\\s፣,:፥]*(?:ከቁጥር|በቁጥር|ቁጥር|verses|verse|vs|v|from)?\\s*(\\d+)(?:\\s*(?:እስከ|-|to|through)\\s*(\\d+))?)?`,
      'i'
    );
    const forwardMatch = normalized.match(forwardRegex);
    if (forwardMatch) {
      let chapter = parseInt(forwardMatch[1], 10);
      let verseStart = forwardMatch[2] ? parseInt(forwardMatch[2], 10) : undefined;
      let verseEnd = forwardMatch[3] ? parseInt(forwardMatch[3], 10) : verseStart;

      // Dynamic Fused Number Decomposition:
      // If no verse was explicitly matched and chapter exceeds the book's canonical max chapters
      // (e.g. STT fused "2 5" as "25" for 1 Cor, "3 16" as "316" for John, "8 28" as "828" for Romans),
      // dynamically split into (chapter, verse).
      if (verseStart === undefined) {
        const decomposed = decomposeFusedChapterVerse(item.bookId, forwardMatch[1]);
        if (decomposed) {
          chapter = decomposed.chapter;
          verseStart = decomposed.verse;
          verseEnd = decomposed.verse;
        } else {
          verseStart = 1;
          verseEnd = 1;
        }
      }

      return {
        bookId: item.bookId,
        bookNameAm: item.bookNameAm,
        bookNameEn: item.bookNameEn,
        chapter,
        verseStart: verseStart ?? 1,
        verseEnd: verseEnd ?? (verseStart ?? 1),
        engine: 'LOCAL_O1_MAP',
        confidence: 0.99
      };
    }

    // Pattern 2: Reversed conversational -> ምዕራፍ [Chapter] ቁጥር [Verse] ... [Book]
    const reverseRegex = new RegExp(
      `(?:በምዕራፍ|ምዕራፍ|መዝሙር|chapter|chap|ch)\\s*(\\d+)(?:[\\s፣,:፥]*(?:ከቁጥር|በቁጥር|ቁጥር|verses|verse|vs|v|from)?\\s*(\\d+)(?:\\s*(?:እስከ|-|to)\\s*(\\d+))?)?.*?${item.prefixPattern}${item.alias}${item.suffixPattern}`,
      'i'
    );
    const reverseMatch = normalized.match(reverseRegex);
    if (reverseMatch) {
      let chapter = parseInt(reverseMatch[1], 10);
      let verseStart = reverseMatch[2] ? parseInt(reverseMatch[2], 10) : undefined;
      let verseEnd = reverseMatch[3] ? parseInt(reverseMatch[3], 10) : verseStart;

      if (verseStart === undefined) {
        const decomposed = decomposeFusedChapterVerse(item.bookId, reverseMatch[1]);
        if (decomposed) {
          chapter = decomposed.chapter;
          verseStart = decomposed.verse;
          verseEnd = decomposed.verse;
        } else {
          verseStart = 1;
          verseEnd = 1;
        }
      }

      return {
        bookId: item.bookId,
        bookNameAm: item.bookNameAm,
        bookNameEn: item.bookNameEn,
        chapter,
        verseStart: verseStart ?? 1,
        verseEnd: verseEnd ?? (verseStart ?? 1),
        engine: 'LOCAL_O1_MAP',
        confidence: 0.96
      };
    }
  }

  return null;
}

/**
 * Fast regex citation parser + 4-tier local semantic phrase matcher (<15ms)
 * Resolves both numbered citations and famous spoken scripture quotes directly offline.
 */
export function parseAmharicScriptureLocally(
  rawTranscript: string
): ParsedScriptureResult | null {
  // Step 1: Check explicit book/chapter/verse citations first
  const explicit = parseExplicitCitationLocally(rawTranscript);
  if (explicit) return explicit;

  // Step 2: 4-Tier Zero-Latency Local Semantic Scripture Engine
  const cleanSpoken = rawTranscript.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleanSpoken.length < 5) return null;

  const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

  // Tier 1: Spoken phrase is directly inside verse (Verbatim quote e.g., "እግዚአብሔር ፍቅር ነው")
  for (const record of offlineBibleDB.verseMap.values()) {
    const cleanVerse = record.cleanText || record.text.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanVerse.includes(cleanSpoken)) {
      return {
        bookId: record.bookId,
        bookNameAm: record.bookNameAm,
        bookNameEn: record.bookNameEn,
        chapter: record.chapter,
        verseStart: record.verse,
        verseEnd: record.verse,
        engine: 'LOCAL_SEMANTIC',
        confidence: 0.98
      };
    }
  }

  // Tier 2: Preacher recited full verse (cleanVerse is in cleanSpoken)
  for (const record of offlineBibleDB.verseMap.values()) {
    const cleanVerse = record.cleanText || record.text.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanVerse.length >= 10 && cleanSpoken.includes(cleanVerse)) {
      return {
        bookId: record.bookId,
        bookNameAm: record.bookNameAm,
        bookNameEn: record.bookNameEn,
        chapter: record.chapter,
        verseStart: record.verse,
        verseEnd: record.verse,
        engine: 'LOCAL_SEMANTIC',
        confidence: 0.99
      };
    }
  }

  // Tier 3: Preacher added words around quote (e.g., "ሰባኪው እንዳለው እግዚአብሔር ፍቅር ነው ይላል")
  // Check sliding window n-grams from 5 words down to 3 words
  if (spokenWords.length >= 3) {
    const maxWindowSize = Math.min(spokenWords.length - 1, 5);
    for (let size = maxWindowSize; size >= 3; size--) {
      const windows: string[] = [];
      for (let i = 0; i <= spokenWords.length - size; i++) {
        const win = spokenWords.slice(i, i + size).join(' ');
        if (win.length >= 8) windows.push(win);
      }
      if (windows.length === 0) continue;

      for (const record of offlineBibleDB.verseMap.values()) {
        const cleanVerse = record.cleanText || record.text.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
        for (const win of windows) {
          if (cleanVerse.includes(win)) {
            return {
              bookId: record.bookId,
              bookNameAm: record.bookNameAm,
              bookNameEn: record.bookNameEn,
              chapter: record.chapter,
              verseStart: record.verse,
              verseEnd: record.verse,
              engine: 'LOCAL_SEMANTIC',
              confidence: 0.95
            };
          }
        }
      }
    }
  }

  // Tier 4: Content Words Co-occurrence (paraphrased or slight speech-to-text variation)
  const stopWords = new Set(['ነው', 'ና', 'ስለ', 'ይላል', 'ብሎ', 'ወደ', 'ጋር', 'ላይ', 'ውስጥ', 'እንደ', 'እኔ', 'አንተ', 'እኛ', 'ግን', 'ሁሉ', 'እንዲህ', 'ደግሞ', 'ሆይ']);
  const contentWords = spokenWords.filter(w => w.length >= 3 && !stopWords.has(w));
  if (contentWords.length >= 3) {
    let bestRecord: any = null;
    let maxMatches = 0;

    for (const record of offlineBibleDB.verseMap.values()) {
      const cleanVerse = record.cleanText || record.text.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
      let matches = 0;
      for (const w of contentWords) {
        if (cleanVerse.includes(w)) matches++;
      }
      if (matches >= 3 && matches / contentWords.length >= 0.75) {
        if (matches > maxMatches) {
          maxMatches = matches;
          bestRecord = record;
        }
      }
    }

    if (bestRecord) {
      return {
        bookId: bestRecord.bookId,
        bookNameAm: bestRecord.bookNameAm,
        bookNameEn: bestRecord.bookNameEn,
        chapter: bestRecord.chapter,
        verseStart: bestRecord.verse,
        verseEnd: bestRecord.verse,
        engine: 'LOCAL_SEMANTIC',
        confidence: 0.88
      };
    }
  }

  return null;
}

