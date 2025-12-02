export default async function handler(req, res) {
    const { day } = req.query;

    if (!day) {
        return res.status(400).json({ error: 'Day parameter is required (e.g., mon, tue)' });
    }

    try {
        const apiUrl = `https://comic.naver.com/api/webtoon/titlelist/weekday?week=${day}`;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from Naver API: ${response.status}`);
        }

        const data = await response.json();

        // Simplify the data for the frontend
        const webtoons = data.titleList.map(item => ({
            titleId: item.titleId,
            title: item.titleName,
            author: item.author,
            thumbnail: item.thumbnailUrl,
            link: `https://comic.naver.com/webtoon/list?titleId=${item.titleId}`
        }));

        res.status(200).json({ webtoons });
    } catch (error) {
        console.error('Webtoon list fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch webtoon list' });
    }
}
