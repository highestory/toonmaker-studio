
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

    const { text } = req.body;

    // Get environment variables directly from process.env
    // User stated these are in .env.local
    const apiKey = process.env.SUPERTONE_API_KEY;
    const voiceId = process.env.SUPERTONE_VOICE_ID;

    if (!apiKey || !voiceId) {
        return res.status(500).json({ error: 'Supertone API credentials not configured' });
    }

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        // CORRECT URL: https://supertoneapi.com/v1/...
        const url = `https://supertoneapi.com/v1/text-to-speech/${voiceId}`;
        console.log(`Generating speech via Supertone at ${url}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-sup-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                language: 'ko', // Defaulting to Korean as per context
                model: 'sona_speech_1' // Default model
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supertone API Error:', errorText);
            throw new Error(`Supertone API failed: ${response.status} ${errorText}`);
        }

        // Get the audio array buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Set headers for audio response
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', buffer.length);

        // Return audio data
        res.status(200).send(buffer);

    } catch (error) {
        console.error('Speech generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
}
