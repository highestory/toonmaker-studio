export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, voiceId } = req.body;

    if (!text || !voiceId) {
        return res.status(400).json({ error: 'Text and Voice ID are required' });
    }

    const apiKey = 'db864bb10bcbf8e034c600b7485c455e'; // In production, use env var

    try {
        // Docs say POST /v1/text-to-speech/{voice_id}
        const response = await fetch(`https://supertoneapi.com/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-sup-api-key': apiKey
            },
            body: JSON.stringify({
                text,
                language: 'ko', // Default to Korean
                style: 'neutral', // Default style
                model: 'sona_speech_1' // Default model, might need to be dynamic later
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`TTS generation failed: ${response.status} ${JSON.stringify(errorData)}`);
        }

        // Get the audio data as an array buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Set headers for audio response
        res.setHeader('Content-Type', 'audio/wav'); // Assuming WAV, check docs if MP3
        res.setHeader('Content-Disposition', 'attachment; filename="generated_audio.wav"');
        res.send(buffer);

    } catch (error) {
        console.error('TTS generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate audio' });
    }
}
