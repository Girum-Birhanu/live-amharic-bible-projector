import { CustomFontRecord } from '../types';

const FONTS_DB_NAME = 'kale_egziabher_fonts_db';
const FONTS_DB_VERSION = 1;
const FONTS_STORE_NAME = 'custom_fonts';

class CustomFontService {
  private registeredFontIds = new Set<string>();

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported'));
      }
      const request = indexedDB.open(FONTS_DB_NAME, FONTS_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FONTS_STORE_NAME)) {
          db.createObjectStore(FONTS_STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCustomFonts(): Promise<CustomFontRecord[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(FONTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(FONTS_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async loadAllCustomFonts(): Promise<CustomFontRecord[]> {
    const fonts = await this.getAllCustomFonts();
    for (const font of fonts) {
      await this.registerFontFaceInDocument(document, font).catch(() => {});
    }
    return fonts;
  }

  async registerFontFaceInDocument(doc: Document, font: CustomFontRecord): Promise<void> {
    if (this.registeredFontIds.has(font.id) && doc === document) return;

    if (font.sourceType === 'file' && font.dataUrl) {
      // 1. Browser FontFace API
      try {
        const res = await fetch(font.dataUrl);
        const buffer = await res.arrayBuffer();
        const fontFace = new FontFace(font.id, buffer);
        await fontFace.load();
        doc.fonts.add(fontFace);
        this.registeredFontIds.add(font.id);
      } catch {
        // Fallback: inject CSS @font-face style element
        this.injectFontFaceStyleTag(doc, font);
      }
    } else if (font.sourceType === 'file') {
      this.injectFontFaceStyleTag(doc, font);
    }
  }

  private injectFontFaceStyleTag(doc: Document, font: CustomFontRecord): void {
    const existing = doc.getElementById(`font-face-${font.id}`);
    if (existing) return;
    const style = doc.createElement('style');
    style.id = `font-face-${font.id}`;
    const formatStr = font.format ? `format('${font.format}')` : '';
    style.textContent = `
      @font-face {
        font-family: '${font.id}';
        src: url('${font.dataUrl}') ${formatStr};
        font-display: swap;
      }
    `;
    doc.head.appendChild(style);
    this.registeredFontIds.add(font.id);
  }

  async saveFontFile(displayName: string, file: File): Promise<CustomFontRecord> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'ttf';
    let format = 'truetype';
    if (ext === 'otf') format = 'opentype';
    else if (ext === 'woff') format = 'woff';
    else if (ext === 'woff2') format = 'woff2';

    const safeSlug = displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-');
    const id = `custom-${safeSlug || 'font'}-${Date.now().toString(36)}`;

    // Read as Data URL for storage & popout injection
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const record: CustomFontRecord = {
      id,
      name: displayName.trim() || file.name.replace(/\.[^/.]+$/, ''),
      family: `'${id}', 'Noto Serif Ethiopic', 'Nyala', serif`,
      sourceType: 'file',
      format,
      dataUrl,
      createdAt: Date.now()
    };

    // Register in current document
    await this.registerFontFaceInDocument(document, record);

    // Save in IndexedDB
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FONTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FONTS_STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return record;
  }

  async saveSystemFont(displayName: string, systemFamilyName: string): Promise<CustomFontRecord> {
    const cleanSysName = systemFamilyName.trim();
    const safeSlug = cleanSysName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const id = `sys-${safeSlug}-${Date.now().toString(36)}`;

    const record: CustomFontRecord = {
      id,
      name: displayName.trim() || cleanSysName,
      family: `'${cleanSysName}', 'Nyala', 'Noto Serif Ethiopic', serif`,
      sourceType: 'system',
      createdAt: Date.now()
    };

    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FONTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FONTS_STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return record;
  }

  async deleteCustomFont(id: string): Promise<void> {
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(FONTS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FONTS_STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    this.registeredFontIds.delete(id);
    const styleEl = document.getElementById(`font-face-${id}`);
    if (styleEl) styleEl.remove();
  }
}

export const customFontService = new CustomFontService();
