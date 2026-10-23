import React, { useMemo, useCallback, useRef } from 'react';
import { useProjectionStore } from './store/projection-store';
import { offlineBibleDB } from './services/bible-db';
import {
  normalizeAmharicNumbers,
  parseAmharicScriptureLocally,
  parseExplicitCitationLocally,
  detectVoiceNavigationCommand
} from './services/citation-parser';
import { resolveAmharicVerseWithGemini } from './services/gemini-ai';
import { mountPopoutProjectorDOM } from './components/projector/PopoutProjector';
import { useBibleDB } from './hooks/useBibleDB';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { useSession } from './hooks/useSession';

// Components
import { Header } from './components/layout/Header';
import { SimulatorBar } from './components/operator/SimulatorBar';
import { SpeechPanel } from './components/operator/SpeechPanel';
import { VerseQueue } from './components/operator/VerseQueue';
import { ManualPicker } from './components/operator/ManualPicker';
import { SplitDualScreen } from './components/operator/SplitDualScreen';
import { ProjectorMonitor } from './components/projector/ProjectorMonitor';
import { FullscreenProjector } from './components/projector/FullscreenProjector';
import { DBManagerModal } from './components/modals/DBManagerModal';
import { ArchitectureModal } from './components/modals/ArchitectureModal';
import { ProjectorSetupModal } from './components/modals/ProjectorSetupModal';
import { FontManagerModal } from './components/modals/FontManagerModal';
import { customFontService } from './services/custom-font-service';

import type { BookData, DetectedCitation, DisplayMode, ProjectorTheme } from './types';
import type { RawBibleJSON } from './types';
import { BroadcastSyncManager } from './services/broadcast-sync';
import { BROADCAST_CHANNEL_NAME } from './utils/constants';
import { getAmharicFontFamily } from './utils/formatters';

export function App() {
  // Check if current window was opened with `?view=projector`
  const isStandaloneProjectorRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'projector';
  }, []);

  // Targeted store selectors to prevent unwanted component re-renders
  const bibleBooks = useProjectionStore((s) => s.bibleBooks);
  const activeProjection = useProjectionStore((s) => s.activeProjection);
  const autoProject = useProjectionStore((s) => s.autoProject);
  const isBlackout = useProjectionStore((s) => s.isBlackout);
  const isFullscreenProjector = useProjectionStore((s) => s.isFullscreenProjector);
  const projectorTheme = useProjectionStore((s) => s.projectorTheme);
  const amharicFont = useProjectionStore((s) => s.amharicFont);
  const customFonts = useProjectionStore((s) => s.customFonts);
  const displayMode = useProjectionStore((s) => s.displayMode);
  const passageSpan = useProjectionStore((s) => s.passageSpan);
  const fontScale = useProjectionStore((s) => s.fontScale);
  const uiTheme = useProjectionStore((s) => s.uiTheme);

  // Refs
  const recognitionRef = useRef<any>(null);
  const popoutWindowRef = useRef<Window | null>(null);
  const broadcastRef = useRef<BroadcastSyncManager | null>(null);
  const activeProjectionRef = useRef<DetectedCitation>(activeProjection);
  const speechBufferRef = useRef<string>('');
  const speechDebounceTimerRef = useRef<any>(null);

  // Keep ref in sync
  React.useEffect(() => {
    activeProjectionRef.current = activeProjection;
  }, [activeProjection]);

  // Clean up speech debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (speechDebounceTimerRef.current) {
        clearTimeout(speechDebounceTimerRef.current);
      }
    };
  }, []);

  // Load saved custom fonts from IndexedDB on startup
  React.useEffect(() => {
    customFontService.loadAllCustomFonts().then((loaded) => {
      useProjectionStore.getState().setCustomFonts(loaded);
    }).catch(() => {});
  }, []);

  // Synchronize CSS custom property --amharic-font-family on document root whenever amharicFont changes
  React.useEffect(() => {
    const family = getAmharicFontFamily(amharicFont, customFonts);
    document.documentElement.style.setProperty('--amharic-font-family', family);
  }, [amharicFont, customFonts]);

  // Synchronize Day/Night mode data-theme and classes on document root
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', uiTheme);
    if (uiTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [uiTheme]);

  // Initialize hooks
  useBibleDB();
  useSession();
  const { startVisualizer, stopVisualizer } = useAudioVisualizer();

  // Initialize BroadcastChannel
  React.useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const sync = new BroadcastSyncManager();
    broadcastRef.current = sync;

    sync.init((msg) => {
      if (msg.type === 'PING') {
        sync.postMessage({ type: 'PONG', senderId: sync.instanceId, timestamp: Date.now() });
        return;
      }
      if (msg.type === 'PONG') {
        useProjectionStore.getState().setConnectedProjectorPeers((prev) => ({
          ...prev,
          [msg.senderId]: Date.now(),
        }));
        if (msg.timestamp) {
          const rtt = Math.max(0.2, Math.min(2.5, Number(((Date.now() - msg.timestamp) / 10).toFixed(2))));
          useProjectionStore.getState().setLastBroadcastLatencyMs(rtt);
        }
        return;
      }
      if (msg.citation) useProjectionStore.getState().setActiveProjection(msg.citation);
      if (msg.theme) useProjectionStore.getState().setProjectorTheme(msg.theme);
      if (msg.customFontData) {
        customFontService.registerFontFaceInDocument(document, msg.customFontData).catch(() => {});
      }
      if (msg.fontFamily) useProjectionStore.getState().setAmharicFont(msg.fontFamily);
      if (typeof msg.fontScale === 'number') useProjectionStore.getState().setFontScale(msg.fontScale);
      if (msg.displayMode) useProjectionStore.getState().setDisplayMode(msg.displayMode);
      if (msg.passageSpan) useProjectionStore.getState().setPassageSpan(msg.passageSpan);
      if (typeof msg.isBlackout === 'boolean') useProjectionStore.getState().setIsBlackout(msg.isBlackout);
    });

    sync.startHeartbeat(() => {});

    // Cleanup stale peers
    const peerCleanup = setInterval(() => {
      sync.postMessage({ type: 'PING', senderId: sync.instanceId, timestamp: Date.now() });
      useProjectionStore.getState().setConnectedProjectorPeers((prev) => BroadcastSyncManager.cleanStalePeers(prev));
    }, 2200);

    return () => {
      clearInterval(peerCleanup);
      sync.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast state changes
  React.useEffect(() => {
    if (!broadcastRef.current || isStandaloneProjectorRoute) return;
    const activeCustomFont = customFonts.find((f) => f.id === amharicFont);
    broadcastRef.current.postMessage({
      type: 'SHOW_VERSE',
      senderId: broadcastRef.current.instanceId,
      citation: activeProjection,
      theme: projectorTheme,
      fontFamily: amharicFont,
      customFontData: activeCustomFont,
      fontScale,
      displayMode,
      passageSpan,
      isBlackout,
      timestamp: Date.now(),
    });
  }, [activeProjection, projectorTheme, amharicFont, customFonts, fontScale, displayMode, passageSpan, isBlackout, isStandaloneProjectorRoute]);

  // Navigate Next / Previous Verse
  const navigateAdjacentVerse = useCallback(
    (direction: 1 | -1, sourceEngine: 'VOICE_COMMAND' | 'MANUAL' = 'MANUAL') => {
      const current = activeProjectionRef.current;
      const book = bibleBooks.find((b) => b.id === current.bookId || b.nameAm === current.bookNameAm);
      if (!book) return;

      const chapObj = book.chapters[current.chapter];
      if (!chapObj) return;

      const availableVerses = Object.keys(chapObj).map(Number).sort((a, b) => a - b);
      const currentTarget = current.focusedVerse ?? (direction === 1 ? current.verseEnd : current.verseStart);
      const idx = availableVerses.indexOf(currentTarget);
      const nextVerseNum =
        idx !== -1 && availableVerses[idx + direction] !== undefined
          ? availableVerses[idx + direction]
          : currentTarget + direction;

      const nextText = offlineBibleDB.getVerseRangeO1(book.id, current.chapter, nextVerseNum, nextVerseNum);
      if (nextText) {
        const isRange = current.verseEnd > current.verseStart;
        const nextCitation: DetectedCitation = {
          id: `nav-${Date.now()}`,
          bookId: book.id,
          bookNameAm: book.nameAm,
          bookNameEn: book.nameEn,
          chapter: current.chapter,
          verseStart: isRange ? current.verseStart : nextVerseNum,
          verseEnd: isRange ? current.verseEnd : nextVerseNum,
          focusedVerse: nextVerseNum,
          verseText: isRange ? current.verseText : nextText,
          rawTranscript: direction === 1 ? 'ቀጥሎ ያለው ቁጥር (Next Verse)' : 'ያለፈው ቁጥር (Previous Verse)',
          engine: sourceEngine,
          confidence: 1.0,
          latencyMs: 0.01,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        useProjectionStore.getState().setActiveProjection(nextCitation);
        useProjectionStore.getState().setSelectedBookId(book.id);
        useProjectionStore.getState().setSelectedChapter(current.chapter);
        useProjectionStore.getState().setSelectedVerse(nextVerseNum);
      }
    },
    [bibleBooks]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts(navigateAdjacentVerse, isStandaloneProjectorRoute);

  // Core Pipeline: Process spoken Amharic through Engine 1 → Engine 2
  const processAmharicSpeechChunk = useCallback(
    async (transcriptText: string, forceProject = false) => {
      if (!transcriptText || transcriptText.trim().length < 2) return;

      const startTime = performance.now();
      useProjectionStore.getState().setLiveTranscript(transcriptText);
      const norm = normalizeAmharicNumbers(transcriptText);
      useProjectionStore.getState().setNormalizedPreview(norm);

      // Voice Navigation Commands
      const navCommand = detectVoiceNavigationCommand(transcriptText);
      if (navCommand === 'NEXT_VERSE') { navigateAdjacentVerse(1, 'VOICE_COMMAND'); return; }
      if (navCommand === 'PREV_VERSE') { navigateAdjacentVerse(-1, 'VOICE_COMMAND'); return; }

      // Engine 1: Local Regex + O(1) Map
      const localMatch = parseAmharicScriptureLocally(transcriptText);
      if (localMatch) {
        const o1Start = performance.now();
        const localVerseText = offlineBibleDB.getVerseRangeO1(localMatch.bookId, localMatch.chapter, localMatch.verseStart, localMatch.verseEnd);
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
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
          useProjectionStore.getState().addToQueue(citation);
          const liveAuto = useProjectionStore.getState().autoProject;
          if (liveAuto || forceProject) {
            useProjectionStore.getState().setActiveProjection(citation);
            useProjectionStore.getState().setIsBlackout(false);
          }
          return;
        }
      }

      // Engine 2: Gemini AI Fallback (only attempt when internet is available)
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        useProjectionStore.getState().setIsAiResolving(true);
        try {
          const aiResult = await resolveAmharicVerseWithGemini(transcriptText);
          useProjectionStore.getState().setIsAiResolving(false);

          if (aiResult && aiResult.detected && aiResult.verseTextAmharic) {
            const latencyMs = Math.round(performance.now() - startTime);
            const { bookId, updatedBooks } = await offlineBibleDB.upsertVerseAndPersist(
              aiResult.bookNameAm,
              aiResult.bookNameEn,
              aiResult.chapter,
              aiResult.verseStart,
              aiResult.verseEnd || aiResult.verseStart,
              aiResult.verseTextAmharic
            );
            useProjectionStore.getState().setBibleBooks(updatedBooks);
            useProjectionStore.getState().setTotalIndexedVerses(offlineBibleDB.verseMap.size);

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
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
            useProjectionStore.getState().addToQueue(citation);
            const liveAuto = useProjectionStore.getState().autoProject;
            if (liveAuto || forceProject) {
              useProjectionStore.getState().setActiveProjection(citation);
              useProjectionStore.getState().setIsBlackout(false);
            }
          } else if (!import.meta.env.VITE_GEMINI_API_KEY) {
            useProjectionStore.getState().setSpeechError(
              "⚠️ Gemini AI key is not configured in Vercel. Pre-seeded verses work offline, but to resolve preachings and semantic quotes, add VITE_GEMINI_API_KEY in Vercel Settings → Environment Variables and redeploy."
            );
          }
        } catch {
          useProjectionStore.getState().setIsAiResolving(false);
        }
      } else {
        useProjectionStore.getState().setIsAiResolving(false);
      }
    },
    [navigateAdjacentVerse]
  );

  // Toggle Live Microphone with instant response (zero 20s lag)
  const toggleLiveMicrophone = useCallback(async () => {
    const isCurrentlyListening = useProjectionStore.getState().isListening;
    if (isCurrentlyListening) {
      useProjectionStore.getState().setIsListening(false);
      if (speechDebounceTimerRef.current) {
        clearTimeout(speechDebounceTimerRef.current);
        speechDebounceTimerRef.current = null;
      }
      if (speechBufferRef.current.trim().length >= 2) {
        const pending = speechBufferRef.current.trim();
        speechBufferRef.current = '';
        processAmharicSpeechChunk(pending);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort(); // Immediately frees the microphone
        } catch {}
        recognitionRef.current = null;
      }
      stopVisualizer();
      return;
    }

    useProjectionStore.getState().setSpeechError(null);
    speechBufferRef.current = '';
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
      speechDebounceTimerRef.current = null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      useProjectionStore.getState().setSpeechError(
        "Web Speech API is not supported in this browser. Use Chrome/Edge or click any Simulator button above."
      );
      return;
    }

    // 1. Immediately toggle UI button state so the operator gets instant visual feedback
    useProjectionStore.getState().setIsListening(true);

    // 2. Start audio visualizer in the background (concurrently, does not block speech recognition)
    startVisualizer(useProjectionStore.getState().selectedAudioDeviceId).catch(() => {});

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = useProjectionStore.getState().speechLang || 'am-ET';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        useProjectionStore.getState().setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunkCombined = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunkCombined += (finalChunkCombined ? ' ' : '') + chunk.trim();
          } else {
            interim += chunk;
          }
        }

        if (finalChunkCombined) {
          // Accumulate into patient preacher speech buffer across breath pauses
          speechBufferRef.current = (speechBufferRef.current + ' ' + finalChunkCombined).trim();
          const currentBuffer = speechBufferRef.current;

          // Update UI immediately with zero delay
          useProjectionStore.getState().setLiveTranscript(currentBuffer);
          useProjectionStore.getState().setNormalizedPreview(normalizeAmharicNumbers(currentBuffer));

          // 1. Immediate trigger check: Explicit citation (e.g. "ዮሐንስ 3:16") or voice command
          const explicitMatch = parseExplicitCitationLocally(currentBuffer);
          const navCmd = detectVoiceNavigationCommand(currentBuffer);

          if (explicitMatch || navCmd) {
            if (speechDebounceTimerRef.current) {
              clearTimeout(speechDebounceTimerRef.current);
              speechDebounceTimerRef.current = null;
            }
            speechBufferRef.current = '';
            processAmharicSpeechChunk(currentBuffer);
            return;
          }

          // 2. Patient debounce for phrases/sentences (850ms pause tolerance)
          // Wait for preacher to complete their thought before resolving semantic quotes
          if (speechDebounceTimerRef.current) {
            clearTimeout(speechDebounceTimerRef.current);
          }
          speechDebounceTimerRef.current = setTimeout(() => {
            const sentenceToProcess = speechBufferRef.current.trim();
            speechBufferRef.current = '';
            speechDebounceTimerRef.current = null;
            if (sentenceToProcess.length >= 2) {
              processAmharicSpeechChunk(sentenceToProcess);
            }
          }, 850);
        }

        useProjectionStore.getState().setInterimTranscript(interim);
        if (interim && !finalChunkCombined) {
          const displayCombined = (speechBufferRef.current + ' ' + interim).trim();
          useProjectionStore.getState().setNormalizedPreview(normalizeAmharicNumbers(displayCombined));
        }
      };

      recognition.onerror = (event: any) => {
        // 'aborted' is fired by Chrome whenever recognition is stopped or reset intentionally.
        // 'no-speech' is fired on silence timeouts. Neither is a user-facing error.
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed') {
          useProjectionStore.getState().setSpeechError(
            "Microphone access blocked. Click the tune/lock icon in your browser address bar to allow microphone access."
          );
          useProjectionStore.getState().setIsListening(false);
          stopVisualizer();
        } else if (event.error === 'network') {
          useProjectionStore.getState().setSpeechError(
            "⚠️ Voice recognition network notice: Chrome cloud speech requires an internet connection. In offline mode, use the Simulator buttons above or 66-Book Bible selector below."
          );
          useProjectionStore.getState().setIsListening(false);
          stopVisualizer();
        } else {
          useProjectionStore.getState().setSpeechError(
            `Speech engine notice (${event.error}). In offline mode, use the Simulator buttons above.`
          );
          useProjectionStore.getState().setIsListening(false);
          stopVisualizer();
        }
      };

      recognition.onend = () => {
        // If there's an un-flushed buffer when recognition ends, process it
        if (speechBufferRef.current.trim().length >= 2) {
          if (speechDebounceTimerRef.current) {
            clearTimeout(speechDebounceTimerRef.current);
            speechDebounceTimerRef.current = null;
          }
          const pending = speechBufferRef.current.trim();
          speechBufferRef.current = '';
          processAmharicSpeechChunk(pending);
        }
        if (useProjectionStore.getState().isListening) {
          try {
            recognition.start();
          } catch {
            useProjectionStore.getState().setIsListening(false);
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      useProjectionStore.getState().setIsListening(false);
      stopVisualizer();
      useProjectionStore.getState().setSpeechError("Could not start Amharic Speech Recognition. Use the Preacher Voice Simulator above.");
    }
  }, [processAmharicSpeechChunk, startVisualizer, stopVisualizer]);

  // Handle audio input device selection (Mixer / Line In / Laptop Mic)
  const handleSelectAudioDevice = useCallback(
    (deviceId: string) => {
      useProjectionStore.getState().setSelectedAudioDeviceId(deviceId);
      if (useProjectionStore.getState().isListening) {
        startVisualizer(deviceId).catch(() => {});
      }
    },
    [startVisualizer]
  );

  // Launch Pop-Out HDMI Window
  const launchPopOutProjectorWindow = useCallback(async () => {
    const projectorUrl = `${window.location.origin}${window.location.pathname}?view=projector`;
    let windowFeatures = 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes';
    let hasExternalScreen = false;

    // Use Window Management API to target external projector/monitor if connected
    if ('getScreenDetails' in window) {
      try {
        const screenDetails = await (window as any).getScreenDetails();
        const externalScreen = screenDetails.screens.find((s: any) => !s.isPrimary);
        if (externalScreen) {
          hasExternalScreen = true;
          windowFeatures = `left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight},menubar=no,toolbar=no,location=no,status=no,resizable=yes`;
        }
      } catch {}
    } else if (window.screen && (window.screen as any).availLeft !== undefined) {
      // Fallback screen placement
      windowFeatures = `left=${window.screen.width},top=0,width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes`;
    }

    const popout = window.open(projectorUrl, 'KaleEgziabherProjectorWindow', windowFeatures);
    if (popout) {
      popoutWindowRef.current = popout;
      try { popout.focus(); } catch {}
      // If no external screen was detected, help user understand Win + P Extend
      if (!hasExternalScreen) {
        useProjectionStore.getState().setShowProjectorSetupModal(true);
      }
    } else {
      // Popup blocked by browser: fallback to in-app split screen & show setup modal
      useProjectionStore.getState().setIsSplitDualScreen(true);
      useProjectionStore.getState().setShowProjectorSetupModal(true);
    }
  }, []);

  // Manual Project Handler (Supports single verse, range, or whole chapter)
  const handleManualProject = useCallback((book: BookData, chapter: number, verseStart: number, verseEnd: number = verseStart) => {
    const text = offlineBibleDB.getVerseRangeO1(book.id, chapter, verseStart, verseEnd) || book.chapters[chapter]?.[verseStart];
    if (!text) return;
    const isRange = verseEnd > verseStart;
    const manualCitation: DetectedCitation = {
      id: `manual-${Date.now()}`,
      bookId: book.id,
      bookNameAm: book.nameAm,
      bookNameEn: book.nameEn,
      chapter,
      verseStart,
      verseEnd,
      verseText: text,
      rawTranscript: isRange ? `${book.nameAm} ${chapter}፥${verseStart}-${verseEnd}` : `${book.nameAm} ${chapter}፥${verseStart}`,
      engine: 'MANUAL',
      confidence: 1.0,
      latencyMs: 0.01,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    useProjectionStore.getState().setActiveProjection(manualCitation);
    useProjectionStore.getState().setIsBlackout(false);
  }, []);

  // DB Manager Handlers
  const handleFileUploadJSON = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      let totalV = 0;
      let lastBooks = useProjectionStore.getState().bibleBooks;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const parsed = JSON.parse(text);
        const { books, totalVerses } = await offlineBibleDB.importCustomBibleJSON(parsed);
        lastBooks = books;
        totalV = totalVerses;
      }
      useProjectionStore.getState().setBibleBooks(lastBooks);
      useProjectionStore.getState().setTotalIndexedVerses(totalV);
      useProjectionStore.getState().setDbStatusBanner(
        `✅ Successfully imported ${files.length > 1 ? `${files.length} books` : `"${files[0].name}"`}! ${totalV.toLocaleString()} Amharic verses indexed into O(1) Map & saved to IndexedDB.`
      );
    } catch {
      useProjectionStore.getState().setDbStatusBanner(`⚠️ Invalid JSON format. Ensure it follows standard books → chapters → verses or BookData[] format.`);
    }
  }, []);

  const handleLoadPrepackagedBible = useCallback(async () => {
    try {
      useProjectionStore.getState().setDbStatusBanner('⏳ Loading complete 66-Book Amharic Bible into IndexedDB...');
      const { books, totalVerses } = await offlineBibleDB.loadPrepackagedBible();
      useProjectionStore.getState().setBibleBooks(books);
      useProjectionStore.getState().setTotalIndexedVerses(totalVerses);
      useProjectionStore.getState().setDbStatusBanner(`✅ Successfully loaded complete 66-Book Amharic Bible! ${totalVerses.toLocaleString()} verses indexed into O(1) Map & saved offline to IndexedDB.`);
    } catch (err: any) {
      useProjectionStore.getState().setDbStatusBanner(`⚠️ Could not load bundled Bible: ${err.message}`);
    }
  }, []);

  const handleExportCachedDB = useCallback(() => {
    const s = useProjectionStore.getState();
    const exportPayload = {
      title: 'መጽሐፍ ቅዱስ (1954 ዕትም) - Kale Egziabher Offline Cache',
      exportedAt: new Date().toISOString(),
      totalVerses: s.totalIndexedVerses,
      books: s.bibleBooks.map((b) => ({ id: b.id, nameAm: b.nameAm, nameEn: b.nameEn, aliases: b.aliases, chapters: b.chapters })),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amharic_bible_1954_cached_${s.totalIndexedVerses}_verses.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadSampleTemplate = useCallback(() => {
    const sampleTemplate: RawBibleJSON = {
      title: 'መጽሐፍ ቅዱስ (1954) - Standard 66-Book Import Template',
      books: [
        { id: 1, name: 'ኦሪት ዘፍጥረት', nameEn: 'Genesis', chapters: [{ chapter: 1, verses: [{ verse: 1, text: 'በመጀመሪያ እግዚአብሔር ሰማይንና ምድርን ፈጠረ።' }] }] },
        { id: 66, name: 'የዮሐንስ ራእይ', nameEn: 'Revelation', chapters: [{ chapter: 22, verses: [{ verse: 21, text: 'የጌታችን የኢየሱስ ክርስቶስ ጸጋ ከሁላችን ጋር ይሁን፤ አሜን።' }] }] },
      ],
    };
    const blob = new Blob([JSON.stringify(sampleTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amharic_bible_template.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleResetSeed = useCallback(async () => {
    const { books, totalVerses } = await offlineBibleDB.resetToDefaultSeed();
    useProjectionStore.getState().setBibleBooks(books);
    useProjectionStore.getState().setTotalIndexedVerses(totalVerses);
    useProjectionStore.getState().setDbStatusBanner('🔄 Reset offline database to default pre-seeded 1954 Amharic chapters.');
  }, []);

  // ============================================================================
  // FULLSCREEN SANCTUARY PROJECTOR VIEW
  // ============================================================================
  if (isFullscreenProjector || isStandaloneProjectorRoute) {
    return (
      <FullscreenProjector
        navigateAdjacentVerse={navigateAdjacentVerse}
        isStandaloneProjectorRoute={isStandaloneProjectorRoute}
      />
    );
  }

  // ============================================================================
  // OPERATOR CONTROL DASHBOARD VIEW
  // ============================================================================
  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        uiTheme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
      style={{ fontFamily: "'Noto Sans Ethiopic', 'Inter', sans-serif" }}
    >
      {/* TOP NAVIGATION HEADER */}
      <Header onLaunchPopOut={launchPopOutProjectorWindow} />

      {/* PREACHER VOICE SIMULATOR BAR */}
      <SimulatorBar
        onSimulate={(utterance) => processAmharicSpeechChunk(utterance, true)}
        onShowArchitecture={() => useProjectionStore.getState().setShowArchitectureModal(true)}
      />

      {/* OPTIONAL IN-APP SPLIT DUAL-SCREEN */}
      <SplitDualScreen />

      {/* MAIN 12-COLUMN WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
        {/* LEFT COLUMN (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <SpeechPanel
            onToggleMic={toggleLiveMicrophone}
            onProcessSpeech={(text) => processAmharicSpeechChunk(text, true)}
            onSelectAudioDevice={handleSelectAudioDevice}
          />
          <VerseQueue />
        </div>

        {/* RIGHT COLUMN (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <ProjectorMonitor
            navigateAdjacentVerse={navigateAdjacentVerse}
            onLaunchPopOut={launchPopOutProjectorWindow}
          />
          <ManualPicker onManualProject={handleManualProject} />
        </div>
      </main>

      {/* MODALS */}
      <DBManagerModal
        onImportJSON={handleFileUploadJSON}
        onExportCachedDB={handleExportCachedDB}
        onDownloadTemplate={handleDownloadSampleTemplate}
        onResetSeed={handleResetSeed}
        onLoadPrepackagedBible={handleLoadPrepackagedBible}
      />
      <ArchitectureModal />
      <ProjectorSetupModal onLaunchPopOut={launchPopOutProjectorWindow} />
      <FontManagerModal />
    </div>
  );
}

export default App;
