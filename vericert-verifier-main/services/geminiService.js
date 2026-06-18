
import { GoogleGenAI, Type } from "@google/genai";

export const analyzeCertificate = async (imageBase64) => {
  // Vite requires VITE_ prefix for environment variables to be exposed to the client
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not defined in the environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
        {
          text: `Act as a forensic document expert. Analyze this document to determine if it is an academic result sheet, degree certificate, or marks card.
          
          1. Document Type Verification:
             - Determine if the document is an academic credential. If it is an ID card (like Aadhaar, PAN, etc.), personal letter, or unrelated document, set isAcademicCertificate to false.
          
          2. OCR Extraction (STRICT RULES):
             - studentName: Full name as printed.
             - certificateId: The unique identifier (USN, Register Number, or Roll No). CRITICAL: Return ONLY the alphanumeric code. Do NOT include labels like "USN:", "Reg No:", or spaces. Example: "4MW22CS183".
             - institution: The university or college name.
             - graduationYear: The 4-digit year of examination or issue.
          
          3. Forensic Check:
             - Evaluate text alignment, font consistency, and potential image manipulation around the student name and USN.
          
          4. Return as a JSON object.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isAcademicCertificate: { type: Type.BOOLEAN, description: "True only if the document is an academic result/degree" },
          studentName: { type: Type.STRING },
          degreeName: { type: Type.STRING },
          institution: { type: Type.STRING },
          graduationYear: { type: Type.NUMBER },
          certificateId: { type: Type.STRING, description: "The clean alphanumeric USN or Register Number" },
          tamperingDetected: { type: Type.BOOLEAN },
          tamperingScore: { type: Type.NUMBER },
          forensicNotes: { type: Type.STRING }
        },
        required: ["isAcademicCertificate", "studentName", "certificateId"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};
