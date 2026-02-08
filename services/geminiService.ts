import { GoogleGenAI, Type } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  console.log(apiKey);
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeDiff = async (original: string, changed: string): Promise<string> => {
  if (!original.trim() && !changed.trim()) return "Both inputs are empty.";
  
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are an expert code reviewer and technical editor.
      Compare the following two text blocks and provide a concise summary of the changes.
      
      --- ORIGINAL TEXT ---
      ${original.substring(0, 10000)}
      
      --- CHANGED TEXT ---
      ${changed.substring(0, 10000)}
      
      --- INSTRUCTIONS ---
      1. Summarize the high-level purpose of the changes (e.g., "Refactored authentication logic", "Fixed typo in header").
      2. If it is code, mention specific function changes or logic shifts.
      3. If it is plain text, mention content updates or tone shifts.
      4. Keep the response clean, professional, and under 200 words.
      5. Use Markdown for formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful diff analysis assistant. Also make sure to compare the content and check the both the content in very detail.",
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep reasoning for simple diffs
      }
    });

    return response.text || "No summary available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate summary. Please try again later or check your API key.";
  }
};
