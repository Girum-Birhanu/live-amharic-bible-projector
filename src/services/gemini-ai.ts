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
 * Resolves spoken Amharic transcripts using Google Gemini Flash API
 * Provides semantic fallback when exact citation regex does not match
 */
export async function resolveAmharicVerseWithGemini(
  spokenAmharic: string
): Promise<GeminiVerseResolution | null> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env or Vercel Environment Variables.');
    return null;
  }

  // Use official stable Flash alias with 3.8 fallback
  const models = ['gemini-flash-latest', 'gemini-3.8-flash'];

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

  for (const model of models) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let delay = 600;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(9000)
        });
        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Gemini API quota exceeded (HTTP 429). Falling back to local 66-book scripture engine.');
            return null;
          }
          // If model not found or invalid argument, try next candidate model
          if (response.status === 404 || response.status === 400) break;
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          return JSON.parse(rawJson);
        }
        return null;
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
          break;
        }
        if (attempt === 1) break;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  return null;
}
