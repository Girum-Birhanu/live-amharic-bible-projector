import { DetectedCitation, SessionSnapshot, ServiceSession, ProjectorTheme, DisplayMode } from '../types';
import {
  SESSION_STORAGE_KEY,
  LOCAL_STORAGE_PREFS_KEY,
  LOCAL_STORAGE_LAST_SESSION_KEY,
  SESSION_EXPIRY_MS,
  DB_NAME,
  DB_VERSION,
  SESSIONS_STORE_NAME
} from '../utils/constants';

/**
 * Service session and operator preferences manager
 * Coordinates persistence across sessionStorage, localStorage, and IndexedDB
 */
export class SessionManager {
  // Save current session snapshot to sessionStorage (survives refresh)
  saveSnapshot(snapshot: SessionSnapshot): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
      // Also mark last session in localStorage (survives tab close)
      if (snapshot.activeProjection) {
        localStorage.setItem(LOCAL_STORAGE_LAST_SESSION_KEY, JSON.stringify({
          timestamp: new Date().toISOString(),
          bookNameAm: snapshot.activeProjection.bookNameAm,
          chapter: snapshot.activeProjection.chapter,
          verseStart: snapshot.activeProjection.verseStart,
        }));
      }
    } catch (e) {
      console.warn('Failed to save session snapshot:', e);
    }
  }

  // Restore session snapshot from sessionStorage
  restoreSnapshot(): SessionSnapshot | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SessionSnapshot;
    } catch {
      return null;
    }
  }

  // Check if there's a resumable session (from localStorage)
  getLastSessionInfo(): { timestamp: string; bookNameAm: string; chapter: number; verseStart: number } | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_LAST_SESSION_KEY);
      if (!raw) return null;
      const info = JSON.parse(raw);
      const age = Date.now() - new Date(info.timestamp).getTime();
      if (age > SESSION_EXPIRY_MS) {
        localStorage.removeItem(LOCAL_STORAGE_LAST_SESSION_KEY);
        return null;
      }
      return info;
    } catch {
      return null;
    }
  }

  // Save operator preferences to localStorage (persists forever)
  savePreferences(prefs: { theme: ProjectorTheme; displayMode: DisplayMode; fontScale: number; autoProject: boolean }): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }

  // Restore operator preferences from localStorage
  restorePreferences(): { theme: ProjectorTheme; displayMode: DisplayMode; fontScale: number; autoProject: boolean } | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // Clear current session (called on 'End Service')
  clearSession(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  // Archive a completed service session to IndexedDB
  async archiveSession(session: ServiceSession): Promise<void> {
    try {
      const db = await this.openSessionsDB();
      const tx = db.transaction(SESSIONS_STORE_NAME, 'readwrite');
      tx.objectStore(SESSIONS_STORE_NAME).put(session, session.id);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Failed to archive session:', e);
    }
  }

  // Get all archived sessions from IndexedDB
  async getArchivedSessions(): Promise<ServiceSession[]> {
    try {
      const db = await this.openSessionsDB();
      return new Promise((resolve) => {
        const tx = db.transaction(SESSIONS_STORE_NAME, 'readonly');
        const req = tx.objectStore(SESSIONS_STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  private openSessionsDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('bibleStore')) {
          db.createObjectStore('bibleStore');
        }
        if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
          db.createObjectStore(SESSIONS_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const sessionManager = new SessionManager();
