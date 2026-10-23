import { UiLanguage } from '../types';

export const TRANSLATIONS = {
  am: {
    // Header
    headerTitle: 'ቃለ እግዚአብሔር • የቀጥታ አማርኛ መጽሐፍ ቅዱስ ፕሮጀክተር',
    headerSubtitle: (verses: number) =>
      `የከመስመር ውጭ 66ቱ መጻሕፍት ማውጫ (${verses.toLocaleString()} ጥቅሶች • ~0.01ms ፈጣን O(1)) + ሁለት ስክሪን ማስተላለፊያ`,
    syncedBadge: (count: number, ms: number) =>
      `ሁለት ስክሪን ተገናኝቷል (${count} HDMI መስኮት • ${ms}ms)`,
    splitActiveBadge: 'ሁለት ስክሪን ክፍፍል በርቷል (<1ms ማስተላለፊያ)',
    broadcastReadyBadge: 'ስክሪን ማስተላለፊያ ዝግጁ ነው',
    onlineBadge: 'ኦንላይን (ማይክ ዝግጁ)',
    offlineBadge: 'ከመስመር ውጭ (የውስጥ ዳታቤዝ)',
    offlineDbBtn: (verses: number) => `ከመስመር ውጭ ዳታቤዝ (${verses})`,
    autoLiveOn: 'ቀጥታ ማሳያ: በርቷል',
    manualQueueMode: 'በእጅ ማፅደቂያ ሁነታ',
    popoutHdmi: 'ሁለተኛ HDMI መስኮት',
    splitDualScreen: 'ሁለት ስክሪን ክፈል',
    exitSplitView: 'ከክፍፍል ውጣ',
    fullscreen: 'ሙሉ ስክሪን',
    dayMode: 'የቀን ሁነታ (Day Mode)',
    nightMode: 'የማታ ሁነታ (Night Mode)',
    switchToEnglish: 'English',
    switchToAmharic: 'አማርኛ',

    // Simulator Bar
    simulatorTitle: 'የሰባኪው ድምፅ መሞከሪያ (በአንድ ጠቅታ የተነገሩ ቁጥሮች፣ ክልሎች፣ የድምፅ ትዕዛዛትና AI አገላለጾች):',
    viewArchitecture: 'አርክቴክቸር ይመልከቱ',

    // Speech Panel
    speechTitle: '1. የአማርኛ ንግግር መቀበያ (am-ET)',
    speechMapReady: 'O(1) ማውጫ: ~0.01ms • ዳታቤዝ ዝግጁ',
    startMic: 'ማይክራፎን ጀምር',
    stopMic: 'ማይክራፎን አቁም',
    audioSource: 'የድምፅ ግቤት ምንጭ:',
    rescan: 'እንደገና ፈልግ',
    mixerGuide: 'የሚክሰር አገናኝ መመሪያ',
    hideMixerGuide: 'መመሪያውን ደብቅ',
    defaultMic: 'መደበኛ የማይክራፎን ድምፅ (Windows Default)',
    mixerTag: ' [ሚክሰር / USB ድምፅ]',
    preacherTranscript: 'የሰባኪው የቀጥታ ድምፅ ጽሑፍ (የሰባኪው ድምፅ):',
    aiResolving: 'Gemini AI በመፈለግና በማስቀመጥ ላይ...',
    micPromptHint: 'ከላይ ያለውን መሞከሪያ ይጫኑ ወይም በአማርኛ ይናገሩ (ለምሳሌ፦ "የዮሐንስ ወንጌል ምዕራፍ 3 ቁጥር 16")...',
    normalizerLabel: 'የቁጥር ማስተካከያ (Normalizer):',
    inputPlaceholder: 'የተነገረውን ጥቅስ ወይም አገላለጽ እዚህ ይጻፉ (ለምሳሌ፦ 1ኛ ቆሮንቶስ 13 4)...',
    detectBtn: 'ጥቅስ ፈልግ',

    // Verse Queue
    queueTitle: (count: number) => `2. የተገኙ ጥቅሶች ቅደም-ተከተል (${count})`,
    queueAutoProjecting: 'ቀጥታ እየታየ ነው',
    queueManualApproval: 'በእጅ የማፅደቅ ሁነታ',
    queueEmpty: 'እስካሁን ምንም ጥቅስ አልተገኘም። ከላይ ያሉትን የሰባኪ መሞከሪያ አዝራሮች በመጫን ይሞክሩ!',
    onAir: 'በቀጥታ (ON AIR)',
    goLive: 'አሳይ ▶',
    projected: 'እየታየ ነው',
    heard: 'የተሰማው:',

    // Manual Picker
    manualTitle: '4. 66ቱ መጻሕፍት መምረጫ እና ምዕራፍ ማሰሻ',
    searchAllIndexed: 'ሁሉንም ጥቅሶች ፈልግ',
    bookLabel: 'መጽሐፍ:',
    chapterLabel: 'ምዕራፍ:',
    verseLabel: 'ቁጥር:',
    chapterPrefix: 'ምዕራፍ',
    versePrefix: 'ቁጥር',
    context3Verses: '3 ቁጥሮች (ከነአውዱ)',
    wholeChapter: 'ሙሉ ምዕራፍ',
    projectNow: 'በቀጥታ አሳይ ▶',
    chapterVersesHeader: (chap: number, count: number) =>
      `የምዕራፍ ${chap} ጥቅሶች ዝርዝር (${count} ቁጥሮች - ጠቅ በማድረግ ያሳዩ):`,

    // Projector Monitor
    monitorTitle: '3. የቀጥታ 16:9 ፕሮጀክተር መቆጣጠሪያ',
    blackoutActive: 'ስክሪን አብራ (Resume)',
    blackoutInactive: 'ስክሪን አጥቁር (Blackout)',
    displayModeLabel: 'አቀራረብ:',
    passageSpanLabel: 'ክልል:',
    singleVerse: 'ነጠላ ቁጥር',
    context3: '3 ቁጥሮች (ከነአውዱ)',
    chapterAll: 'ሙሉ ምዕራፍ',
    fullscreenSlide: 'ሙሉ ስላይድ',
    obsLowerThird: 'የታችኛው ጽሑፍ (OBS)',
    prevVerse: '◀ ቀዳሚ ቁጥር',
    nextVerse: 'ቀጣይ ቁጥር ▶',
    themeLabel: 'ቀለም (Theme):',
    fontLabel: 'ፊደል (Font):',
    addFontBtn: '➕ ፊደል ጨምር',
    fontScaleLabel: 'መጠን (Scale):',
    followScrollLabel: 'ስክሪን ተከተል (Auto-Follow)',
    tipConnected: (count: number) =>
      `✅ ከቤተክርስቲያን ፕሮጀክተር ጋር ተገናኝቷል (${count} ስክሪን በርቷል • <1ms ማስተላለፊያ)`,
    tipExtend: '💡 የቤተክርስቲያን ፕሮጀክተር ምክር: Win + P ተጭነው "Extend" ይምረጡ፤ የመቆጣጠሪያው ገጽ እንዳይጋለጥ ሁለተኛውን ስክሪን ይጠቀሙ።',
    setupGuideBtn: 'የ3-ደረጃ መመሪያ ይመልከቱ →',
    bibleEditionTag: 'መጽሐፍ ቅዱስ (1954 ዕትም)',

    // Common
    close: 'ዝጋ',
    save: 'አስቀምጥ',
    cancel: 'ይቅር',
  },

  en: {
    // Header
    headerTitle: 'Kale Egziabher • Live Amharic Bible Projector',
    headerSubtitle: (verses: number) =>
      `IndexedDB Offline 66-Book Engine (${verses.toLocaleString()} Verses • ~0.01ms O(1) Map) + Dual-Monitor Sync`,
    syncedBadge: (count: number, ms: number) =>
      `Dual-Monitor Synced (${count} HDMI Window • ${ms}ms)`,
    splitActiveBadge: 'Dual-Screen Split Active (<1ms Sync)',
    broadcastReadyBadge: 'BroadcastChannel Ready',
    onlineBadge: 'Online (Mic Ready)',
    offlineBadge: 'Offline (Local DB Ready)',
    offlineDbBtn: (verses: number) => `Offline DB (${verses})`,
    autoLiveOn: 'Auto-Live: ON',
    manualQueueMode: 'Manual Queue Mode',
    popoutHdmi: 'Pop-Out HDMI Window',
    splitDualScreen: 'Split Dual-Screen',
    exitSplitView: 'Exit Split View',
    fullscreen: 'Fullscreen',
    dayMode: 'Day Mode (Light)',
    nightMode: 'Night Mode (Dark)',
    switchToEnglish: 'English',
    switchToAmharic: 'አማርኛ',

    // Simulator Bar
    simulatorTitle: 'One-Click Preacher Voice Simulator (Test Spoken Amharic Numbers, Ranges, Voice Nav & AI Paraphrases):',
    viewArchitecture: 'View Architecture',

    // Speech Panel
    speechTitle: '1. Amharic Speech Stream (am-ET)',
    speechMapReady: 'O(1) Map: ~0.01ms • IDB Ready',
    startMic: 'Start Amharic Mic',
    stopMic: 'Stop Listening',
    audioSource: 'Audio Input Source:',
    rescan: 'Rescan',
    mixerGuide: 'Mixer Setup Guide',
    hideMixerGuide: 'Hide Mixer Guide',
    defaultMic: 'Default System Microphone (Windows Default)',
    mixerTag: ' [Mixer / USB Audio]',
    preacherTranscript: 'PREACHER LIVE TRANSCRIPT (የሰባኪው ድምፅ):',
    aiResolving: 'Gemini AI Resolving & Saving to IndexedDB...',
    micPromptHint: 'Click a simulator button above or speak in Amharic (e.g. "ዮሐንስ ምዕራፍ 3 ቁጥር 16")...',
    normalizerLabel: 'Engine 1 Normalizer:',
    inputPlaceholder: 'Type any Amharic citation or paraphrase (e.g. 1ኛ ቆሮንቶስ 13 4)...',
    detectBtn: 'Detect',

    // Verse Queue
    queueTitle: (count: number) => `2. Detected Verse Queue (${count})`,
    queueAutoProjecting: 'Auto-Projecting Live',
    queueManualApproval: 'Manual Approval Mode',
    queueEmpty: 'No verses queued yet. Click any Preacher Simulator button at the top to test real-time detection!',
    onAir: 'ON AIR',
    goLive: 'Go Live ▶',
    projected: 'Projected',
    heard: 'Heard:',

    // Manual Picker
    manualTitle: '4. 66-Book Manual Picker & Local Chapter Browser',
    searchAllIndexed: 'Search All Indexed Verses',
    bookLabel: 'መጽሐፍ (Book):',
    chapterLabel: 'ምዕራፍ (Chapter):',
    verseLabel: 'ቁጥር (Verse):',
    chapterPrefix: 'Chapter',
    versePrefix: 'Verse',
    context3Verses: '3 Verses (With Context)',
    wholeChapter: 'Whole Chapter',
    projectNow: 'Project Live ▶',
    chapterVersesHeader: (chap: number, count: number) =>
      `Chapter ${chap} Verses List (${count} verses - click to project):`,

    // Projector Monitor
    monitorTitle: '3. Live 16:9 Projector Stage',
    blackoutActive: 'Resume Screen',
    blackoutInactive: 'Blackout Screen',
    displayModeLabel: 'Display Mode:',
    passageSpanLabel: 'Span:',
    singleVerse: 'Single Verse',
    context3: '3 Verses (Context)',
    chapterAll: 'All Chapter',
    fullscreenSlide: 'Fullscreen Slide',
    obsLowerThird: 'Lower-Third (OBS)',
    prevVerse: '◀ Prev Verse',
    nextVerse: 'Next Verse ▶',
    themeLabel: 'Theme:',
    fontLabel: 'Font:',
    addFontBtn: '➕ Add Font',
    fontScaleLabel: 'Scale:',
    followScrollLabel: 'Auto-Follow Scroll',
    tipConnected: (count: number) =>
      `✅ Connected to Sanctuary Projector Screen (${count} Display Active • <1ms Sync)`,
    tipExtend: '💡 Church Projection Tip: Press Win + P → select "Extend", then click "Project to Wall" to keep controls private.',
    setupGuideBtn: 'View 3-Step Setup Guide →',
    bibleEditionTag: 'Holy Bible (1954 Amharic Edition)',

    // Common
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
  }
} as const;

export function useTranslation(lang: UiLanguage) {
  return TRANSLATIONS[lang] || TRANSLATIONS.am;
}
