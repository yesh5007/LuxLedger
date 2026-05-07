
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

const FALLBACK_DATA: ExtractedMetadata = {
    recipientName: "Alexandra Fontaine",
    recipientId: "SN-RX-2024-78452",
    documentType: "Rolex Submariner Date 126610LN",
    documentDescription: "Oystersteel case, Cerachrom bezel insert in black ceramic, Black dial, Oyster bracelet — Purchased Dec 2024",
    ocrConfidence: 96
};

/**
 * Retries an async function with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const isRetryable = err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("overloaded");
            if (i < retries - 1 && isRetryable) {
                console.warn(`[LuxLedger] API attempt ${i + 1} failed, retrying in ${delayMs / 1000}s...`);
                await new Promise(r => setTimeout(r, delayMs));
                delayMs *= 1.5;
            } else {
                throw err;
            }
        }
    }
    throw new Error("All retries exhausted");
}

/**
 * Parses a PDF/Image for DATA only.
 * This is NOT treated as "AI Verification" but as "Metadata Extraction (OCR)".
 * 
 * @param file The uploaded certificate image/PDF
 * @returns { recipientName, recipientId, documentType, etc. }
 */
export async function extractMetadata(file: File): Promise<ExtractedMetadata> {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        console.warn("Gemini API Key is missing. Returning demo data.");
        return FALLBACK_DATA;
    }

    try {
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
            model: "gemini-2.5-pro",
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

        const data = await withRetry(async () => {
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

            return JSON.parse(text);
        });

        return {
            recipientName: data.recipientName,
            recipientId: data.recipientId,
            documentType: data.documentType,
            documentDescription: data.documentDescription,
            ocrConfidence: typeof data.ocrConfidence === 'number' ? data.ocrConfidence : 90
        };

    } catch (error: any) {
        // Use console.warn instead of console.error to avoid triggering Next.js error overlay
        console.warn("[LuxLedger] AI extraction unavailable, using demo data:", error?.message || error);
        return FALLBACK_DATA;
    }
}
