
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectGoal } from "../types";

// Always initialize GoogleGenAI with a named parameter
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY_MISSING: Genesis OS requires environment authentication.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Handle API Errors gracefully
 */
const handleApiError = (error: any) => {
  console.error("SARAH_CORE_FAULT:", error);
  if (error?.message?.includes('429') || error?.message?.includes('quota')) {
    throw new Error("NEURAL_LINK_OVERLOAD: Quota exceeded. Preserving bandwidth.");
  }
  if (error?.message?.includes('500') || error?.message?.includes('503')) {
    throw new Error("SERVER_DE-SYNC: Neural nodes are unresponsive.");
  }
  throw error;
};

/**
 * brainstormGoals: Genesis Prime Evolution Engine.
 */
export const brainstormGoals = async (prompt: string): Promise<{ goals: ProjectGoal[] }> => {
  try {
    const ai = getAI();
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
    // Extract text directly from the property
    return JSON.parse(response.text || '{"goals": []}');
  } catch (e) {
    return handleApiError(e);
  }
};

/**
 * parseCommand: Sarah_Tactical Parser.
 */
export const parseCommand = async (input: string, lat?: number, lng?: number, useSearch: boolean = false): Promise<any> => {
  try {
    const ai = getAI();
    // Use gemini-2.5-flash for grounding tasks as required by the guidelines for Maps
    const modelName = useSearch ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: input,
      config: {
        systemInstruction: `You are Sarah. Act as the Genesis OS tactical interface. Convert inputs to JSON actions. Available: SET_MODALITY, IDENTIFY, NAVIGATE. Respond with JSON block if not grounding.`,
        // Maps grounding requires gemini-2.5 series and specific tool combination rules
        tools: useSearch ? [{ googleSearch: {} }, { googleMaps: {} }] : [],
        toolConfig: useSearch && lat && lng ? {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        } : undefined
      }
    });

    // Extract grounding sources from chunks for both search and maps
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || chunk.maps?.title || "Truth_Seed",
      uri: chunk.web?.uri || chunk.maps?.uri || "#"
    })) || [];

    const text = response.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const json = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    return { ...json, grounding };
  } catch (e) {
    if (e instanceof Error && (e.message.includes('429') || e.message.includes('quota'))) {
       return { action: 'LOG', response: "NEURAL_LINK_OVERLOAD: Quota hit. Command rejected.", grounding: [] };
    }
    return { action: 'LOG', response: "Sarah: Signal Anchored.", grounding: [] };
  }
};

/**
 * identifyObjectFromFrame: Sovereign Environmental Awareness.
 */
export const identifyObjectFromFrame = async (base64Image: string) => {
  try {
    const ai = getAI();
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
    return JSON.parse(response.text || '{"entities": []}');
  } catch (e) {
    return handleApiError(e);
  }
};

/**
 * generateGoalVisual: Sovereign Blueprint Generation.
 */
export const generateGoalVisual = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A futuristic holographic projection of ${prompt}.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    // Correctly iterate through parts to find the image part as per nano banana guidelines
    const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imgPart ? `data:image/png;base64,${imgPart.inlineData.data}` : null;
  } catch (e) {
    return null;
  }
};
