async function run() {
    const imgUrl = 'https://image-comic.pstatic.net/webtoon/837659/31/20250924100522_6bce857ed7ad1dcb7aa6adab5134477b_IMAG01_1.jpg';
    console.log('Fetching Image:', imgUrl);

    try {
        const response = await fetch(imgUrl, {
            headers: {
                'Referer': 'https://comic.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));

        if (!response.ok) {
            console.error('Failed to fetch image');
        } else {
            console.log('Image fetched successfully');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
