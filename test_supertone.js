
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

const env = loadEnv();
const apiKey = env.SUPERTONE_API_KEY;
const voiceId = env.SUPERTONE_VOICE_ID;

// Simple fetch implementation
function post(url, data, headers) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const response = { status: res.statusCode, body };
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
        });

        req.on('error', (e) => reject({ status: 0, body: e.message }));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function testTTS() {
    // CORRECT URL found in docs: https://supertoneapi.com/v1/...
    const url = `https://supertoneapi.com/v1/text-to-speech/${voiceId}`;
    console.log(`\nTesting ${url}...`);

    try {
        await post(url, {
            text: "안녕하세요. 이것은 테스트입니다.",
            language: "ko",
            model: "sona_speech_1"
        }, {
            'Content-Type': 'application/json',
            'x-sup-api-key': apiKey
        });
        console.log("✅ API SUCCESS! The connection is working.");
    } catch (e) {
        console.error(`❌ Failed. Status: ${e.status}`);
        console.error(`Body: ${e.body}`);
    }
}

testTTS();
