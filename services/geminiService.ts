import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  draftAnnouncement: async (topic: string, language: Language): Promise<{title: string, content: string}> => {
    // Basic check for development feedback, though env var is assumed valid per guidelines.
    if (!process.env.API_KEY) {
      console.warn("No API Key found");
      return { title: "Error", content: "AI Service Unavailable - Missing API Key" };
    }

    try {
      const prompt = `Write a formal school announcement about "${topic}". 
      Language: ${language}. 
      Keep it concise and professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ['title', 'content']
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { title: "Draft", content: `Failed to generate: ${topic}` };
    }
  }
};