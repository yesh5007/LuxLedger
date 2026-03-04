
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ForgeryAnalysisResult {
    isForged: boolean;
    confidenceScore: number;
    reason: string;
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

/**
 * STRICTLY detects digital forgery in a certificate image.
 * 
 * @param file The uploaded certificate image/PDF
 * @returns { isForged, confidenceScore, reason }
 */
export async function detectForgery(file: File): Promise<ForgeryAnalysisResult> {
    try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            console.warn("Gemini API Key is missing. Returning mock data.");
            return {
                isForged: false,
                confidenceScore: 0.98,
                reason: "Mock Analysis: No visual anomalies detected."
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
        Analyze this image strictly for signs of digital forgery or manipulation.
        Focus on:
        1. Inconsistent fonts or typefaces.
        2. Pixelation artifacts around text (indicates copy-paste).
        3. Alignment issues or unnatural spacing.
        4. Color inconsistencies in the background pattern.

        Do NOT extract the text content (OCR). Your job is only to judge authenticity.

        Return a JSON object with:
        - isForged: boolean (true if tampered).
        - confidenceScore: number (0.0 to 1.0, where 1.0 is highest confidence in your assessment).
        - reason: string (Brief explanation of your finding).
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
            isForged: data.isForged,
            confidenceScore: data.confidenceScore,
            reason: data.reason || "Analysis completed."
        };

    } catch (error) {
        console.error("Forgery AI Error:", error);
        // Fail-safe: In a real system, you might want to return 'true' (forged/suspicious) on error or retry.
        // For prototype, we'll throw to alert the user.
        throw new Error("Failed to perform forgery analysis.");
    }
}
