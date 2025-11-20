const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

async function run() {
    const imageUrl = 'https://image-comic.pstatic.net/webtoon/837659/31/20250924100522_6bce857ed7ad1dcb7aa6adab5134477b_IMAG01_1.jpg';
    const referer = 'https://comic.naver.com/webtoon/detail?titleId=837659&no=31&week=mon';
    const filename = 'test_save_image.jpg';

    console.log('Testing save with:', imageUrl);

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'Referer': referer,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const downloadsDir = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const filePath = path.join(downloadsDir, filename);
        const fileStream = fs.createWriteStream(filePath);

        // @ts-ignore
        await pipeline(response.body, fileStream);

        console.log('Successfully saved to:', filePath);

        // Verify file size
        const stats = fs.statSync(filePath);
        console.log('File size:', stats.size, 'bytes');

    } catch (error) {
        console.error('Save error:', error);
    }
}

run();
