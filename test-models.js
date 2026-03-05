const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function run() {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API key found");
            return;
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        // Fetch using fetch directly since SDK doesn't have listModels in all versions
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        console.log("AVAILABLE MODELS:");
        data.models.forEach(m => console.log(m.name, "-", m.supportedGenerationMethods.join(", ")));
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
