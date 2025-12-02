import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Increase limit for image URLs list
        },
    },
    maxDuration: 60, // Increase timeout for AI processing
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrls, referer } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
    }

    const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    try {
        // 1. Fetch images and convert to base64
        // Limit to first 30 images to avoid payload limits/timeouts for now
        // Webtoon episodes can be very long.
        const imagesToAnalyze = imageUrls.slice(0, 30);

        const imageParts = await Promise.all(imagesToAnalyze.map(async (url) => {
            const response = await fetch(url, {
                headers: {
                    'Referer': referer || 'https://comic.naver.com/',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.warn(`Failed to fetch image: ${url}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            return {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: response.headers.get('content-type') || 'image/jpeg'
                }
            };
        }));

        // Filter out failed downloads
        const validParts = imageParts.filter(part => part !== null);

        if (validParts.length === 0) {
            return res.status(500).json({ error: 'Failed to fetch any images for analysis' });
        }

        // 2. Call Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        이것은 웹툰의 한 회차 이미지들입니다. 순서대로 나열되어 있습니다.
        이 회차의 전체적인 줄거리를 요약해주고, 주요 사건이나 감정선의 변화를 분석해주세요.
        또한, 이미지에 포함된 모든 대사를 추출하여 스크립트 형식으로 정리해주세요.

        형식:
        1. **줄거리 요약**: (3~4문장)
        2. **주요 포인트**: (글머리 기호로 3개)
        3. **분위기/감정**: (키워드 위주)
        
        ---
        **📜 전체 대사 스크립트**
        (등장인물 이름): 대사 내용
        (상황 묘사)
        ...
        `;

        const result = await model.generateContent([prompt, ...validParts]);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ analysis: text });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze episode' });
    }
}
