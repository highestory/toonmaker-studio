import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Metadata Extraction
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const thumbnail = $('meta[property="og:image"]').attr('content') || '';

        // Parse ogTitle: "이직로그 - 31화 blackOut" -> ["이직로그", "31", "blackOut"]
        // Regex to match: Title - No화 EpisodeTitle
        const titleMatch = ogTitle.match(/^(.*?) - (\d+)화\s*(.*)$/);

        let meta = {
            title: ogTitle,
            webtoonTitle: '',
            episodeNo: '',
            episodeTitle: '',
            thumbnail
        };

        if (titleMatch) {
            meta.webtoonTitle = titleMatch[1];
            meta.episodeNo = titleMatch[2];
            meta.episodeTitle = titleMatch[3];
        }

        const images = [];
        $('.wt_viewer img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) images.push(src);
        });

        res.status(200).json({ images, meta });
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}
