import { GoogleGenAI, Type } from "@google/genai";

const getGeminiClient = () => {
  // Standard Vite way - do not use as any or dynamic access
  // This allows Vite's static analyzer to replace it at build time
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please ensure VITE_GEMINI_API_KEY is defined in your .env file.");
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
      model: 'gemini-3.1-flash-lite-preview',
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

export const resolveMerge = async (
  current: string, 
  incoming: string, 
  userPrompt: string, 
  systemPrompt?: string
): Promise<string> => {
  if (!current.trim() && !incoming.trim()) return "Both inputs are empty.";
  
  try {
    const ai = getGeminiClient();
    const finalSystemPrompt = systemPrompt || "You are an expert at resolving code merge conflicts. Combine the 'current' (left) and 'incoming' (right) content intelligently based on the user's instructions.";
    
    const prompt = `
      --- CURRENT CONTENT (LEFT) ---
      ${current.substring(0, 10000)}
      
      --- INCOMING CONTENT (RIGHT) ---
      ${incoming.substring(0, 10000)}
      
      --- USER MERGE INSTRUCTIONS ---
      ${userPrompt || "Merge the changes intelligently, preferring the most up-to-date and robust implementation."}
      
      --- TASK ---
      Return the final merged version of the content. ONLY return the merged content, no explanations or markdown blocks (unless they are part of the content).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        systemInstruction: finalSystemPrompt,
      }
    });

    return response.text || "Failed to generate merge.";
  } catch (error) {
    console.error("Gemini Merge Error:", error);
    return "Failed to resolve merge. Please check your API key.";
  }
};
