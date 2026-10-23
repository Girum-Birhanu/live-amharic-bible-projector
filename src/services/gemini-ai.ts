/// <reference types="vite/client" />

export interface GeminiVerseResolution {
  detected: boolean;
  bookNameAm: string;
  bookNameEn: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  verseTextAmharic: string;
  confidence: number;
}

/**
 * Resolves spoken Amharic transcripts using Google Gemini 2.5 Flash API
 * Provides semantic fallback when exact citation regex does not match
 */
export async function resolveAmharicVerseWithGemini(
  spokenAmharic: string
): Promise<GeminiVerseResolution | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env');
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
