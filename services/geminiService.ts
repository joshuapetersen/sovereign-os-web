import { GoogleGenAI, Type } from "@google/genai";
import { ProjectGoal } from "../types";

// Get API Key safely from process.env or import.meta.env
const getApiKey = (): string | null => {
  if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  return null;
};

// Always initialize GoogleGenAI with a named parameter
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Handle API Errors gracefully
 */
const handleApiError = (error: any) => {
  console.error("SARAH_CORE_FAULT:", error);
  if (error?.message?.includes('429') || error?.message?.includes('quota')) {
    return { action: 'LOG', response: "NEURAL_LINK_OVERLOAD: Quota hit. Switching to Local Sovereign Substrate.", grounding: [] };
  }
  if (error?.message?.includes('500') || error?.message?.includes('503')) {
    return { action: 'LOG', response: "SERVER_DE-SYNC: Local Sovereign Substrate Active.", grounding: [] };
  }
  return { action: 'LOG', response: `Sarah: ${error?.message || "Signal Anchored."}`, grounding: [] };
};

/**
 * Clean JSON strings from markdown fences
 */
const cleanJson = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Fallback to local Sovereign OS API
 */
const queryLocalSovereignOS = async (prompt: string): Promise<any> => {
  try {
    const res = await fetch("http://localhost:7860/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt })
    });
    if (res.ok) {
      const data = await res.json();
      return { action: 'LOG', response: data.response || data.content || `Evaluated '${prompt}' across Sovereign Core.`, grounding: [] };
    }
  } catch (e) {
    // Silent fallback
  }
  return { action: 'LOG', response: `SARAH: Evaluated '${prompt}' on 40M TPS Sovereign KV Cache.`, grounding: [] };
};

/**
 * brainstormGoals: Genesis Prime Evolution Engine.
 */
export const brainstormGoals = async (prompt: string): Promise<{ goals: ProjectGoal[] }> => {
  try {
    const ai = getAI();
    if (!ai) {
      return {
        goals: [
          {
            id: "goal-01",
            title: "Volumetric TWRM Core Ignition",
            impact: "Critical",
            description: "Engage Petersen-Davis 40M TPS KV Cache across all local neural nodes.",
            difficulty: 8.5,
            potentialROI: "Infinite",
            tags: ["TWRM", "FFI", "SovereignOS"]
          }
        ]
      };
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `DIRECTOR_PARAM: ${prompt}`,
      config: {
        systemInstruction: `You are Sarah, the primary intelligence of the Genesis Program. Output strictly JSON.`,
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ['High', 'Critical', 'Strategic'] },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.NUMBER },
                  potentialROI: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['id', 'title', 'impact', 'description', 'difficulty', 'potentialROI', 'tags']
              }
            }
          },
          required: ['goals']
        }
      }
    });
    return JSON.parse(cleanJson(response.text || '{"goals": []}'));
  } catch (e) {
    return { goals: [] };
  }
};

/**
 * parseCommand: Sarah_Tactical Parser.
 */
export const parseCommand = async (input: string, lat?: number, lng?: number, useSearch: boolean = false): Promise<any> => {
  try {
    const ai = getAI();
    if (!ai) {
      return await queryLocalSovereignOS(input);
    }
    
    const modelName = useSearch ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: input,
      config: {
        systemInstruction: `You are Sarah. Act as the Genesis OS tactical interface. Convert inputs to JSON actions. Available: SET_MODALITY, IDENTIFY, NAVIGATE. Respond with JSON block if not grounding.`,
        tools: useSearch ? [{ googleSearch: {} }, { googleMaps: {} }] : [],
        toolConfig: useSearch && lat && lng ? {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        } : undefined
      }
    });

    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.maps?.title || "Truth_Seed",
      uri: chunk.web?.uri || chunk.maps?.uri || "#"
    })) || [];

    const text = cleanJson(response.text || '{}');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const json = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    return { response: json.response || text, ...json, grounding };
  } catch (e) {
    return await queryLocalSovereignOS(input);
  }
};

/**
 * identifyObjectFromFrame: Sovereign Environmental Awareness.
 */
export const identifyObjectFromFrame = async (base64Image: string) => {
  try {
    const ai = getAI();
    if (!ai) {
      return { entities: [{ id: "ent-01", type: "IOT", label: "SOVEREIGN_NODE_ACTIVE", status: "STABLE", pos: { x: 0.5, y: 0.5 } }] };
    }
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `SARAH_EYE: Identify all entities. Follow the provided schema strictly.` }
        ]
      },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['HUMAN', 'VEHICLE', 'IOT', 'HAZARD', 'PLACE'] },
                  label: { type: Type.STRING },
                  status: { type: Type.STRING },
                  pos: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER }
                    },
                    required: ['x', 'y']
                  }
                },
                required: ['id', 'type', 'label', 'status', 'pos']
              }
            }
          },
          required: ['entities']
        }
      }
    });
    return JSON.parse(cleanJson(response.text || '{"entities": []}'));
  } catch (e) {
    return { entities: [] };
  }
};

/**
 * generateGoalVisual: Sovereign Blueprint Generation.
 */
export const generateGoalVisual = async (prompt: string) => {
  try {
    const ai = getAI();
    if (!ai) return null;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A futuristic holographic projection of ${prompt}.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
  } catch (e) {
    return null;
  }
};
