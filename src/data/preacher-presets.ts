export interface PreacherPreset {
  label: string;
  category: string;
  utterance: string;
}

// ============================================================================
// 7. REALISTIC PREACHER VOICE SIMULATOR PRESETS
// ============================================================================

export const PREACHER_SIMULATION_PRESETS: PreacherPreset[] = [
  {
    label: "ኢሳያ ስምንት ሁለት (Isaiah 8:2)",
    category: "Fast Spoken • Isaiah",
    utterance: "ኢሳያ ስምንት ሁለት"
  },
  {
    label: "1ኛ ቆሮንቶስ 25 (Fused '2 5' Speech)",
    category: "Fused Number Auto-Split",
    utterance: "1ኛ ቆሮንቶስ 25"
  },
  {
    label: "1ኛ ዮሐንስ 2፥3 (መልእክት • 1st John)",
    category: "1 John Epistle",
    utterance: "1 ዮሐንስ ምዕራፍ 2 ከቁጥር 3 ያለውን የእግዚአብሔርን ቃል እናንብብ።"
  },
  {
    label: "1ኛ ዮሐንስ 4፥8 (ፍቅር • 1st John)",
    category: "1 John • Semantic",
    utterance: "ሰባኪው እንዳለው እግዚአብሔር ፍቅር ነው ይላል።"
  },
  {
    label: "የዮሐንስ ወንጌል 3፥16 (ወንጌል • John Gospel)",
    category: "John Gospel • O(1)",
    utterance: "እስቲ ሁላችንም መጽሐፍ ቅዱሳችንን እንክፈትና የዮሐንስ ወንጌል ምዕራፍ ሦስት ቁጥር አሥራ ስድስት ላይ ያለውን የእግዚአብሔርን ቃል እናንብብ።"
  },
  {
    label: "john 6 7 (No 'chapter/verse' words)",
    category: "English Fast Syntax",
    utterance: "john 6 7"
  },
  {
    label: "ዮሐንስ 6 7 (ያለ 'ምዕራፍ/ቁጥር' ቃላት)",
    category: "Amharic Fast Syntax",
    utterance: "ዮሐንስ 6 7"
  },
  {
    label: "የዮሐንስ ወንጌል 10፥1-42 (ሙሉ ምዕራፍ)",
    category: "John Gospel • 42 Verses",
    utterance: "የዮሐንስ ወንጌል ምዕራፍ 10 ከቁጥር 1 እስከ 42 ያለውን ሙሉውን ቃል እናንብብ።"
  },
  {
    label: "2ኛ ቆሮንቶስ 5፥17 (2nd Corinthians)",
    category: "2 Corinthians",
    utterance: "ሁለተኛ ቆሮንቶስ ምዕራፍ 5 ቁጥር 17 ማንም በክርስቶስ ቢሆን አዲስ ፍጥረት ነው ይላል።"
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
