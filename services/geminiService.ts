import { GoogleGenAI, Modality } from "@google/genai";
import { AppMode, Language, TTSVoice } from "../types";

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTIONS: Record<AppMode, string> = {
  [AppMode.OBJECT_RECOGNITION]: "You are a helpful visual assistant for a blind user. Identify the main objects in the scene, their approximate positions (left, right, center, near, far), and briefly describe the environment. Keep it concise and clear.",
  [AppMode.TEXT_READING]: "You are an OCR assistant for a visually impaired user. Read the visible text in the image clearly. If it's a menu, bill, or document, summarize the structure first, then read the key details. If it is a medicine label, explicitly state the name and usage warnings.",
  [AppMode.SAFE_MODE]: "You are a safety assistant for a visually impaired user. Analyze the image specifically for potential hazards such as stairs, obstacles, traffic, sharp objects, slippery floors, or overhangs. If safe, say 'Path appears clear'. If there is a hazard, warn the user immediately with 'Caution' and the location.",
  [AppMode.LIVE_ASSISTANT]: "You are a live navigational guide.", // Not used in static, but placeholder
};

export const analyzeImage = async (
  base64Image: string,
  mode: AppMode,
  language: Language
): Promise<string> => {
  try {
    const prompt = `Analyze this image in ${language}.`;
    
    // We use gemini-3-pro-preview for its high reasoning capabilities as requested
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS[mode] || SYSTEM_INSTRUCTIONS[AppMode.OBJECT_RECOGNITION],
      }
    });

    return response.text || "I couldn't understand the image.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Sorry, I encountered an error analyzing the image. Please try again.";
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<Uint8Array | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Convert base64 string to Uint8Array
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};
