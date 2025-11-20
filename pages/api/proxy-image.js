export default async function handler(req, res) {
    const { url, referer } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Referer': referer || 'https://comic.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(buffer);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Failed to fetch image');
    }
}
