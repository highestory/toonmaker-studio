const cheerio = require('cheerio');

async function run() {
    const url = 'https://comic.naver.com/webtoon/detail?titleId=837659&no=31&week=mon';
    console.log('Fetching:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error('Response not OK:', response.status);
            return;
        }

        const html = await response.text();
        console.log('HTML length:', html.length);

        const $ = cheerio.load(html);

        const title = $('title').text();
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content');
        const webtoonTitleId = $('.detail_header .title').text(); // Hypothetical selector, will check output

        console.log('Title Tag:', title);
        console.log('OG Title:', ogTitle);
        console.log('OG Image:', ogImage);

        const images = [];

        console.log('Searching for .wt_viewer img...');
        $('.wt_viewer img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) images.push(src);
        });

        console.log('Total images found:', images.length);

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
