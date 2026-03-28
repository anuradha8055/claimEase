import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIAnalysisResult {
  extracted_amount?: number;
  extracted_date?: string;
  confidence_score: number;
  is_legible: boolean;
  potential_fraud_flags: string[];
  summary: string;
}

export const analyzeMedicalDocument = async (
  base64Data: string,
  mimeType: string,
  documentType: string
): Promise<AIAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this medical document (${documentType}). 
              Extract the following information if available:
              1. Total amount/bill value (numeric)
              2. Date of document (YYYY-MM-DD)
              3. A brief summary of the document content
              4. Check for any signs of tampering or inconsistencies (fraud flags)
              5. Determine if the document is legible.
              
              Return the result in JSON format.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted_amount: { type: Type.NUMBER },
            extracted_date: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            is_legible: { type: Type.BOOLEAN },
            potential_fraud_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            summary: { type: Type.STRING },
          },
          required: ["confidence_score", "is_legible", "potential_fraud_flags", "summary"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      confidence_score: 0,
      is_legible: false,
      potential_fraud_flags: ["Analysis failed due to technical error"],
      summary: "Could not analyze document.",
    };
  }
};
