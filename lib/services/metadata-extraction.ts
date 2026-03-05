
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedMetadata {
    recipientName?: string;
    recipientId?: string;
    documentType?: string;
    documentDescription?: string;
    issuedAt?: number;
    ocrConfidence?: number;
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

/**
 * Parses a PDF/Image for DATA only.
 * This is NOT treated as "AI Verification" but as "Metadata Extraction (OCR)".
 * 
 * @param file The uploaded certificate image/PDF
 * @returns { recipientName, recipientId, documentType, etc. }
 */
export async function extractMetadata(file: File): Promise<ExtractedMetadata> {
    try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            console.warn("Gemini API Key is missing. Returning mock data.");
            return {
                recipientName: "John Doe (Extract)",
                recipientId: "SN-12345-LUX",
                documentType: "Platinum Chronograph",
                documentDescription: "Oystersteel, Ceramic Bezel, 2024 Model"
            };
        }

        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

        const base64Content = base64Data.split(',')[1];

        const jsonSchema = {
            "type": "object",
            "properties": {
                "recipientName": { "type": "string" },
                "recipientId": { "type": "string" },
                "documentType": { "type": "string" },
                "documentDescription": { "type": "string" },
                "ocrConfidence": {
                    "type": "number",
                    "description": "A percentage from 0 to 100 estimating how confident you are in the extraction accuracy."
                }
            },
            "required": ["recipientName", "recipientId", "documentType", "documentDescription", "ocrConfidence"]
        };

        // Note: The correct property name for the config is generationConfig
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                // @ts-ignore - The types for responseSchema might be slightly different in older versions, but this structure works
                responseSchema: jsonSchema
            }
        });

        const prompt = `
        Perform OCR and Data Extraction on this document.
        Extract the following fields in JSON format:
        - recipientName: The name of the owner/client (if present).
        - recipientId: The Serial Number or Unique ID of the item.
        - documentType: The Model Name or Item Type (e.g. "Rolex Submariner", "Birkin Bag").
        - documentDescription: Any extra details or specs listed.
        - ocrConfidence: A number between 0 and 100 representing your confidence in the OCR accuracy.

        Do NOT analyze for fraud. Just extract the text.

        Return ONLY the JSON object.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Content,
                    mimeType: file.type,
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean up markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(text);

        return {
            recipientName: data.recipientName,
            recipientId: data.recipientId,
            documentType: data.documentType,
            documentDescription: data.documentDescription,
            ocrConfidence: typeof data.ocrConfidence === 'number' ? data.ocrConfidence : 90
        };

    } catch (error: any) {
        console.error("Extraction AI Error:", error);
        console.dir(error, { depth: null });
        throw new Error(`Failed to extract metadata: ${error.message}`);
    }
}
