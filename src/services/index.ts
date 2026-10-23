export { OfflineAmharicBibleDB, offlineBibleDB } from './bible-db';
export {
  GE_EZ_NUMERALS,
  AMHARIC_TENS,
  AMHARIC_UNITS,
  normalizeAmharicNumbers,
  detectVoiceNavigationCommand,
  parseExplicitCitationLocally,
  parseAmharicScriptureLocally,
  type ParsedScriptureResult
} from './citation-parser';
export { resolveAmharicVerseWithGemini, type GeminiVerseResolution } from './gemini-ai';
export { BroadcastSyncManager } from './broadcast-sync';
export { SessionManager, sessionManager } from './session-manager';
