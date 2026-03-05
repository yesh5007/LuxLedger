
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Analyze this document image strictly for signs of MALICIOUS digital forgery or manipulation.
        
        CRITICAL CONTEXT: This is likely a digital certificate (e.g., from an online course) or an invoice. 
        It is extremely common and perfectly normal for the recipient's name, serial number, or date to be 
        superimposed/rendered onto a static background template by software. 
        DO NOT flag the document as forged simply because the text anti-aliasing, font, or pixel crispness of 
        the specific data fields (like Name or Course Title) differs slightly from the background template.

        Only flag as forged if you see:
        1. Obvious, sloppy copy-paste boxes (mismatched background colors behind text).
        2. Signs that existing text was erased/cloned over and replaced.
        3. Severe visual anomalies that clearly indicate malicious human tampering rather than standard software PDF generation.

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
