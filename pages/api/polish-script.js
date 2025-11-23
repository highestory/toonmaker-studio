import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, type, context } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'No text provided' });
    }

    const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = "";

        if (type === 'opening') {
            prompt = `
            다음은 유튜브 쇼츠 영상의 오프닝 멘트 초안입니다.
            이 멘트를 더 시선을 확 끌고, 흥미진진하게 다듬어주세요.
            
            초안: "${text}"
            
            조건:
            1. 첫 문장에서 바로 호기심을 자극할 것.
            2. 구어체로 자연스럽게 (해요체).
            3. 너무 길지 않게 (2~3문장).
            4. 이모지 1~2개 사용.
            `;
        } else if (type === 'closing') {
            prompt = `
            다음은 유튜브 쇼츠 영상의 클로징 멘트 초안입니다.
            구독과 좋아요를 유도하고, 다음 영상도 기대하게 만들어주세요.
            
            초안: "${text}"
            
            조건:
            1. 깔끔하고 여운 있게 마무리.
            2. 구독/좋아요 요청은 자연스럽게.
            3. 구어체 (해요체).
            `;
        } else if (type === 'bridge') {
            prompt = `
            다음은 영상 중간에 들어갈 브릿지 멘트(빌드업)입니다.
            클라이맥스(AI 필살기)로 넘어가기 전에 기대감을 고조시켜주세요.
            
            초안: "${text}"
            
            조건:
            1. 긴장감이나 기대감 조성.
            2. "자, 이제..." 같은 접속사 활용.
            3. 짧고 강렬하게.
            `;
        } else {
            // General polishing for episode scripts
            prompt = `
            다음은 웹툰 리뷰 영상의 대본 일부입니다.
            내용을 더 매끄럽고 몰입감 있게 다듬어주세요.
            
            초안: "${text}"
            
            맥락: ${context || '웹툰 리뷰'}
            
            조건:
            1. 구어체로 자연스럽게 읽히도록 수정.
            2. 문장을 너무 길게 쓰지 말고 적당히 끊어주세요.
            3. 감정을 살려서 표현.
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const polishedText = response.text();

        res.status(200).json({ polishedText });

    } catch (error) {
        console.error('Polishing error:', error);
        res.status(500).json({ error: error.message || 'Failed to polish script' });
    }
}
