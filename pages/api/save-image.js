import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, referer, filename, folderName } = req.body;

    if (!imageUrl || !filename) {
        return res.status(400).json({ error: 'Missing imageUrl or filename' });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'Referer': referer || 'https://comic.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Determine download directory: downloads/{folderName} or just downloads/
        const downloadsDir = path.join(process.cwd(), 'downloads', folderName || '');

        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, filename);
        const fileStream = fs.createWriteStream(filePath);

        // @ts-ignore - fetch response body is a stream
        await pipeline(response.body, fileStream);

        res.status(200).json({ success: true, path: filePath });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: error.message });
    }
}
