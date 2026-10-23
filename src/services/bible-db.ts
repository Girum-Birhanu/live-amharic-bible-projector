import { BibleVerseRecord, BookData, RawBibleJSON, ContextVerseItem, PassageSpanMode } from '../types';
import { DB_NAME, DB_VERSION, STORE_NAME, STORAGE_KEY } from '../utils/constants';
import { INITIAL_BIBLE_DB } from '../data/initial-bible-seed';
import { CANONICAL_66_BOOKS } from '../data/canonical-books';

/**
 * Offline Amharic Bible Database Engine
 * Features O(1) in-memory verse lookup Map backed by IndexedDB persistence
 */
export class OfflineAmharicBibleDB {
  // O(1) Hash Map keyed by "bookId-chapter-verse" (e.g., "43-3-16")
  public verseMap = new Map<string, BibleVerseRecord>();
  public booksList: BookData[] = [];
  public isLoaded = false;
  public idbSupported = true;
  public lastInitLatencyMs = 0;

  private readonly DB_NAME = DB_NAME;
  private readonly STORE_NAME = STORE_NAME;
  private readonly STORAGE_KEY = STORAGE_KEY;

  async init(): Promise<{ books: BookData[]; totalVerses: number; latencyMs: number }> {
    const start = performance.now();

    try {
      const cachedBooks = await this.getFromIndexedDB();
      if (cachedBooks && Array.isArray(cachedBooks) && cachedBooks.length > 0) {
        this.indexBooksArray(cachedBooks);
        this.lastInitLatencyMs = Math.max(1, Math.round(performance.now() - start));

        // If the cache only has the small initial seed (< 1000 verses), automatically load the full 30,752-verse Bible in background
        if (this.verseMap.size < 1000 && typeof window !== 'undefined') {
          this.loadPrepackagedBible().catch(() => {});
        }

        return {
          books: this.booksList,
          totalVerses: this.verseMap.size,
          latencyMs: this.lastInitLatencyMs
        };
      }
    } catch {
      this.idbSupported = false;
    }

    // Try auto-loading bundled /amharic_bible.json first if available
    try {
      const res = await fetch('/amharic_bible.json');
      if (res.ok) {
        const rawJson = await res.json();
        const result = await this.importCustomBibleJSON(rawJson);
        this.lastInitLatencyMs = Math.max(1, Math.round(performance.now() - start));
        return {
          books: result.books,
          totalVerses: result.totalVerses,
          latencyMs: this.lastInitLatencyMs
        };
      }
    } catch {}

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

  public indexBooksArray(books: BookData[]): void {
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
          const cleanText = verseText.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
          this.verseMap.set(key, {
            bookId: book.id,
            bookNameAm: book.nameAm,
            bookNameEn: book.nameEn,
            chapter: chapNum,
            verse: verseNum,
            text: verseText,
            cleanText
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
    const safeEnd = Math.max(verseStart, Math.min(verseEnd, 200));
    for (let v = verseStart; v <= safeEnd; v++) {
      let text = this.verseMap.get(`${bookId}-${chapter}-${v}`)?.text;
      if (!text) {
        const book = this.booksList.find((b) => b.id === bookId);
        text = book?.chapters?.[chapter]?.[v];
      }
      if (text) {
        collected.push(safeEnd > verseStart ? `(${v}) ${text}` : text);
      }
    }
    return collected.length > 0 ? collected.join(' ') : null;
  }

  /**
   * Retrieves structured multi-verse context passage for church storytelling and congregational reading
   */
  public getContextPassage(
    bookId: number,
    chapter: number,
    verseStart: number,
    verseEnd = verseStart,
    mode: PassageSpanMode = 'context-3',
    focusedVerse?: number
  ): ContextVerseItem[] {
    const items: ContextVerseItem[] = [];
    const targetVerse = focusedVerse ?? verseStart;

    // If an explicit range was specified (e.g. verses 1 to 42):
    if (verseEnd > verseStart) {
      for (let v = verseStart; v <= verseEnd; v++) {
        let text = this.verseMap.get(`${bookId}-${chapter}-${v}`)?.text;
        if (!text) {
          const b = this.booksList.find((bk) => bk.id === bookId);
          text = b?.chapters?.[chapter]?.[v];
        }
        if (text) {
          items.push({
            verseNum: v,
            text,
            isActive: v === targetVerse
          });
        }
      }
      return items;
    }

    // Single verse mode requested
    if (mode === 'single') {
      let text = this.verseMap.get(`${bookId}-${chapter}-${targetVerse}`)?.text;
      if (!text) {
        const b = this.booksList.find((bk) => bk.id === bookId);
        text = b?.chapters?.[chapter]?.[targetVerse];
      }
      return text ? [{ verseNum: targetVerse, text, isActive: true }] : [];
    }

    // Whole Chapter Mode: All verses in the chapter
    if (mode === 'chapter-all') {
      const book = this.booksList.find((b) => b.id === bookId);
      const chapterObj = book?.chapters?.[chapter] || {};
      const verseNums = Object.keys(chapterObj).map(Number).sort((a, b) => a - b);
      const maxV = verseNums.length > 0 ? Math.max(...verseNums) : 150;

      for (let v = 1; v <= maxV; v++) {
        let text = this.verseMap.get(`${bookId}-${chapter}-${v}`)?.text;
        if (!text) {
          text = chapterObj[v];
        }
        if (text) {
          items.push({
            verseNum: v,
            text,
            isActive: v === targetVerse
          });
        }
      }
      if (items.length > 0) return items;
    }

    // Context-3 mode: prev, active, next
    const startV = Math.max(1, targetVerse - 1);
    const endV = targetVerse + 1;

    for (let v = startV; v <= endV; v++) {
      let text = this.verseMap.get(`${bookId}-${chapter}-${v}`)?.text;
      if (!text) {
        const b = this.booksList.find((bk) => bk.id === bookId);
        text = b?.chapters?.[chapter]?.[v];
      }
      if (text) {
        items.push({
          verseNum: v,
          text,
          isActive: v === targetVerse
        });
      }
    }

    // Fallback if no surrounding verses were found
    if (items.length === 0) {
      let text = this.verseMap.get(`${bookId}-${chapter}-${targetVerse}`)?.text;
      if (!text) {
        const b = this.booksList.find((bk) => bk.id === bookId);
        text = b?.chapters?.[chapter]?.[targetVerse];
      }
      if (text) {
        items.push({ verseNum: targetVerse, text, isActive: true });
      }
    }

    return items;
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

    const cleanText = verseText.replace(/[።፣፤፥፦፡?!,.\-–"'\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    this.verseMap.set(`${bookId}-${chapter}-${verseStart}`, {
      bookId,
      bookNameAm: canonical?.nameAm || bookNameAm,
      bookNameEn: canonical?.nameEn || bookNameEn,
      chapter,
      verse: verseStart,
      text: verseText,
      cleanText
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
      // Standard Amharic Bible JSON: { books: [ { id, name, title, chapters: [ { chapter, verses: [...] } ] } ] }
      for (let i = 0; i < rawJson.books.length; i++) {
        const b = rawJson.books[i];
        const bookId = b.id || i + 1;
        const nameAm = b.nameAm || b.name || b.title || `መጽሐፍ ${bookId}`;
        const nameEn = b.nameEn || '';
        if (Array.isArray(b.chapters)) {
          for (let chIdx = 0; chIdx < b.chapters.length; chIdx++) {
            const ch = b.chapters[chIdx];
            const chapNum = Number(ch.chapter || chIdx + 1);
            if (Array.isArray(ch.verses)) {
              for (let vIdx = 0; vIdx < ch.verses.length; vIdx++) {
                const v = ch.verses[vIdx];
                if (typeof v === 'string') {
                  mergeBookChapterVerse(bookId, nameAm, nameEn, chapNum, vIdx + 1, v);
                } else if (v && typeof v === 'object') {
                  mergeBookChapterVerse(bookId, nameAm, nameEn, chapNum, Number(v.verse || vIdx + 1), v.text || '');
                }
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
    } else if (rawJson && (rawJson.chapters || rawJson.title)) {
      // Single book JSON (e.g. from individual_books: { title, abbv, chapters: [...] })
      const b = rawJson;
      const canonical = CANONICAL_66_BOOKS.find(
        (c) => c.nameAm === b.title || c.aliases.includes(b.title) || c.nameAm === b.name
      );
      const bookId = canonical?.id || b.id || 1;
      const nameAm = b.title || b.nameAm || b.name || canonical?.nameAm || `መጽሐፍ ${bookId}`;
      const nameEn = b.nameEn || canonical?.nameEn || '';
      if (Array.isArray(b.chapters)) {
        for (let chIdx = 0; chIdx < b.chapters.length; chIdx++) {
          const ch = b.chapters[chIdx];
          const chapNum = Number(ch.chapter || chIdx + 1);
          if (Array.isArray(ch.verses)) {
            for (let vIdx = 0; vIdx < ch.verses.length; vIdx++) {
              const v = ch.verses[vIdx];
              if (typeof v === 'string') {
                mergeBookChapterVerse(bookId, nameAm, nameEn, chapNum, vIdx + 1, v);
              } else if (v && typeof v === 'object') {
                mergeBookChapterVerse(bookId, nameAm, nameEn, chapNum, Number(v.verse || vIdx + 1), v.text || '');
              }
            }
          }
        }
      }
    }

    this.indexBooksArray(convertedBooks);
    await this.saveToIndexedDB(this.booksList);
    return { books: [...this.booksList], totalVerses: this.verseMap.size };
  }

  /**
   * Loads pre-packaged full 66-book Amharic Bible from /amharic_bible.json
   */
  public async loadPrepackagedBible(): Promise<{ books: BookData[]; totalVerses: number }> {
    const res = await fetch('/amharic_bible.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching /amharic_bible.json`);
    const data = await res.json();
    return this.importCustomBibleJSON(data);
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
      const request = indexedDB.open(this.DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
        if (!db.objectStoreNames.contains('sessionsStore')) {
          db.createObjectStore('sessionsStore');
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
