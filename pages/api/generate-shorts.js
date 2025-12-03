import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
    maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { summary, selectedImages, referer, type, context } = req.body;

    const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    try {
        // 1. Fetch selected images (limit to 10 to prevent timeout)
        let validParts = [];
        if (selectedImages && selectedImages.length > 0) {
            const imagesToProcess = selectedImages.slice(0, 10);
            const imageParts = await Promise.all(imagesToProcess.map(async (url) => {
                try {
                    // Use the proxy URL logic if needed, or fetch directly with headers
                    // Since we are on server side, we can fetch directly but need headers for Naver
                    const response = await fetch(url, {
                        headers: {
                            'Referer': referer || 'https://comic.naver.com/',
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    if (!response.ok) return null;
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Check if buffer is valid image
                    if (buffer.length === 0) return null;

                    return {
                        inlineData: {
                            data: buffer.toString('base64'),
                            mimeType: response.headers.get('content-type') || 'image/jpeg'
                        }
                    };
                } catch (e) {
                    console.error('Image fetch failed', e);
                    return null;
                }
            }));
            validParts = imageParts.filter(part => part !== null);
        }

        // 2. Call Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use latest Gemini Flash (points to gemini-2.5-flash-preview-09-2025)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = '';

        if (type) {
            // Special Segment Generation (No images required)
            const basePrompt = `당신은 수백만 구독자를 보유한 웹툰 리뷰 유튜버입니다.`;
            
            if (type === 'opening') {
                prompt = `
                ${basePrompt}
                시청자의 이목을 단번에 사로잡을 수 있는 **오프닝 멘트**를 작성해주세요.

                **요구사항:**
                1. **길이**: 40자 ~ 60자 사이.
                2. **톤앤매너**: ${context || '활기차고 기대감을 주는 톤'}.
                3. **내용**: 채널 인사와 함께 오늘 소개할 웹툰에 대한 기대감을 높이는 멘트.
                4. **말투**: "~니다"체 사용.
                `;
            } else if (type === 'special') {
                prompt = `
                ${basePrompt}
                웹툰의 가장 강력한 한 방, **필살기(하이라이트) 장면**을 소개하는 멘트를 작성해주세요.

                **요구사항:**
                1. **길이**: 50자 ~ 70자 사이.
                2. **톤앤매너**: ${context || '긴박하고 웅장한 톤'}.
                3. **내용**: 주인공의 각성이나 충격적인 반전을 예고하는 멘트.
                4. **말투**: "~니다"체 사용.
                `;
            } else if (type === 'closing') {
                prompt = `
                ${basePrompt}
                영상을 마무리하는 **클로징 멘트**를 작성해주세요.

                **요구사항:**
                1. **길이**: 40자 ~ 60자 사이.
                2. **톤앤매너**: ${context || '여운을 남기며 정중한 톤'}.
                3. **내용**: 시청 감사 인사, 구독/좋아요 요청, 다음 영상 예고.
                4. **말투**: "~니다"체 사용.
                `;
            }
        } else {
            // Standard Shorts Generation (With images)
            prompt = `
            당신은 수백만 구독자를 보유한 웹툰 리뷰 유튜버입니다.
            제공된 '웹툰 줄거리 요약'과 '주요 장면(이미지)'을 바탕으로, 시청자를 사로잡을 수 있는 15초 분량의 **쇼츠(Shorts) 대본**을 작성해주세요.
    
            **입력 정보:**
            - 줄거리 및 분석:
            ${summary}
    
            **요구사항:**
            1. **길이 필수**: **공백 포함 65자 ~ 75자 사이**로 맞춰주세요. (너무 짧으면 안 됩니다!)
            2. **말투**: **반드시 "~니다."체**를 사용하세요. (예: "놀라운 반전이 기다립니다.", "꼭 확인해보시길 바랍니다.")
            3. **구성**: [후킹 멘트] + [핵심 내용] + [마무리] 구조로 꽉 채워주세요.
            4. **스타일**: 정중하면서도 기대감을 주는 리뷰어 톤으로 작성하세요.
    
            **출력 형식:**
            (65자~75자 사이의 대본 텍스트만 출력)
            `;
        }

        const parts = [prompt, ...validParts];
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ script: text });

    } catch (error) {
        console.error('Script generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate script' });
    }
}
