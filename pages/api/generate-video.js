
import Replicate from "replicate";

export const config = {
    maxDuration: 300, // 5 minutes (video generation can be slow)
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageUrl, prompt } = req.body;
    const apiKey = process.env.REPLICATE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Replicate API key not configured on server' });
    }

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        console.log('1. Fetching image to bypass 403...');
        // Fetch image locally with headers to bypass Naver's hotlink protection
        const imageRes = await fetch(imageUrl, {
            headers: {
                'Referer': 'https://comic.naver.com/',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!imageRes.ok) {
            throw new Error(`Failed to fetch source image: ${imageRes.statusText}`);
        }

        const arrayBuffer = await imageRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Image}`;

        console.log('2. Starting Real-ification (SDXL)...');

        const replicate = new Replicate({
            auth: apiKey,
        });

        // Step 1: Real-ify (Guidance via z-image-turbo T2I)
        // User requested z-image-turbo (Text-to-Image only)
        // VERIFIED VERSION ID: d20db133dcacc395a3097f8003ee43e947f74bff6acbe6f235d0a99af3ad1e68
        const output1 = await replicate.run(
            "prunaai/z-image-turbo:d20db133dcacc395a3097f8003ee43e947f74bff6acbe6f235d0a99af3ad1e68",
            {
                input: {
                    // T2I Only. Relying on Gemini's detailed prompt.
                    prompt: "A PHOTOGRAPH of " + (prompt || "cinematic scene") + ", Korean K-pop idol aesthetic, beautiful face, highly detailed skin texture, pores, dslr, raw style, f/1.8",
                    num_inference_steps: 4, // 4-8 steps for Turbo
                    guidance_scale: 0.0, // Turbo uses 0 guidance
                    width: 1024,
                    height: 1024, // Standard aspect for T2I
                    seed: Math.floor(Math.random() * 1000000)
                }
            }
        );

        let realisticImageUrl = Array.isArray(output1) ? output1[0] : output1;

        // Replicate SDK might return a FileOutput object instead of a string
        if (typeof realisticImageUrl !== 'string') {
            realisticImageUrl = String(realisticImageUrl);
        }

        console.log('Real-ified Image:', realisticImageUrl);

        if (!realisticImageUrl) {
            throw new Error('Failed to generate realistic image');
        }

        console.log('2. Animation (SVD) Skipped per user request.');

        /* 
        // Step 2: Animate (Image-to-Video)
        // Using Stable Video Diffusion (SVD-XT)
        console.log('3. Starting Animation (SVD)...');
        const output2 = await replicate.run(
            "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            {
                input: {
                    input_image: realisticImageUrl, 
                    video_length: "25_frames_with_svd_xt",
                    sizing_strategy: "maintain_aspect_ratio",
                    frames_per_second: 24,
                    motion_bucket_id: 127,
                    cond_aug: 0.02
                }
            }
        );
        console.log('Video Output:', output2); 
        let videoUrl = Array.isArray(output2) ? output2[0] : output2;
        if (typeof videoUrl !== 'string') {
            videoUrl = String(videoUrl);
        }
        */

        res.status(200).json({
            videoUrl: null, // No video generated
            realisticImageUrl
        });

    } catch (error) {
        console.error('Video generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate video' });
    }
}
