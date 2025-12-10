
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl } = req.body;
    const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        // 1. Fetch image locally with headers to bypass Naver's hotlink protection
        const imageRes = await fetch(imageUrl, {
            headers: {
                'Referer': 'https://comic.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!imageRes.ok) {
            throw new Error(`Failed to fetch source image: ${imageRes.statusText}`);
        }

        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Prepare for Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const imagePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: imageRes.headers.get('content-type') || 'image/jpeg'
            }
        };

        const prompt = `
        Describe this webtoon panel as a highly detailed, photorealistic image generation prompt for an AI model (like Stable Diffusion).
        
        Focus on:
        - **Characters via K-pop Aesthetic**: Describe characters as "Beautiful Korean K-pop idol style", "Korean actor/actress".
        - Subject appearance (lighting, texture, realistic skin/clothing)
        - Environment and Atmosphere (cinematic lighting, depth of field)
        - Mood (dramatic, intense, emotional)

        Requirements:
        - Output ONLY the prompt text in English.
        - Keep it concise but descriptive (under 50 words preferably).
        - Start with "cinematic photo of..."
        - Use comma-separated keywords style effectively.
        - Ensure "Korean" is mentioned for characters.
        - NO conversational text, just the raw prompt.
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ prompt: text.trim() });

    } catch (error) {
        console.error('Prompt generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate prompt' });
    }
}
