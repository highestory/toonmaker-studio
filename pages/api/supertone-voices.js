export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = 'db864bb10bcbf8e034c600b7485c455e'; // In production, use env var

    try {
        const response = await fetch('https://supertoneapi.com/v1/voices', {
            headers: {
                'x-sup-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch voices: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Supertone voices error:', error);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
}
