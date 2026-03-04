
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedMetadata {
    recipientName?: string;
    recipientId?: string;
    documentType?: string;
    documentDescription?: string;
    issuedAt?: number;
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
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Perform OCR and Data Extraction on this document.
        Extract the following fields in JSON format:
        - recipientName: The name of the owner/client (if present).
        - recipientId: The Serial Number or Unique ID of the item.
        - documentType: The Model Name or Item Type (e.g. "Rolex Submariner", "Birkin Bag").
        - documentDescription: Any extra details or specs listed.

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
            documentDescription: data.documentDescription
        };

    } catch (error) {
        console.error("Extraction AI Error:", error);
        throw new Error("Failed to extract metadata.");
    }
}
