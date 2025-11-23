
// Mock environment variables
process.env.GOOGLE_CLIENT_ID = 'mock_client_id';
process.env.GOOGLE_CLIENT_SECRET = 'mock_client_secret';
process.env.GOOGLE_REDIRECT_URI = 'mock_redirect_uri';
process.env.NODE_ENV = 'development';

async function runTests() {
    console.log('Starting Auth Callback Tests...');

    let currentMockEmail = '';

    // --- Mock Setup ---
    const google = {
        auth: {
            OAuth2: class {
                getToken(code) { return Promise.resolve({ tokens: { access_token: 'mock_token' } }); }
                setCredentials(tokens) { }
            }
        },
        oauth2: () => ({
            userinfo: {
                get: () => Promise.resolve({ data: { email: currentMockEmail } })
            }
        })
    };

    const fs = await import('fs');
    const path = await import('path');
    const handlerPath = path.resolve('pages/api/auth/callback.js');
    let handlerCode = fs.readFileSync(handlerPath, 'utf8');

    // Remove imports and export default
    handlerCode = handlerCode.replace(/import .* from .*/g, '');
    handlerCode = handlerCode.replace('export default', 'const handler =');

    // Wrap in a function that provides the mocks
    const runHandler = async (req, res, email) => {
        currentMockEmail = email;

        // Define mocks in scope
        const process = { env: { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', GOOGLE_REDIRECT_URI: 'uri', NODE_ENV: 'dev' } };
        const serialize = (name, val, opts) => `${name}=${val}`;

        // Eval the code
        // We append "; return handler(req, res);" to execute it
        const func = new Function('req', 'res', 'google', 'serialize', 'process', 'currentMockEmail', handlerCode + '; return handler(req, res);');

        await func(req, res, google, serialize, process, email);
    };

    // --- Test 1: Unauthorized Email ---
    console.log('\nTest 1: Unauthorized Email (other@gmail.com)');
    let req = { query: { code: 'auth_code' } };
    let res = {
        status: (code) => ({
            send: (msg) => console.log(`[Response] Status: ${code}, Message: ${msg}`),
            json: (obj) => console.log(`[Response] Status: ${code}, JSON: ${JSON.stringify(obj)}`)
        }),
        setHeader: (key, val) => console.log(`[Header] ${key}: ${val}`),
        redirect: (url) => console.log(`[Redirect] -> ${url}`)
    };

    try {
        await runHandler(req, res, 'other@gmail.com');
    } catch (e) {
        console.error('Test 1 Failed:', e);
    }

    // --- Test 2: Authorized Email ---
    console.log('\nTest 2: Authorized Email (corecore.dev@gmail.com)');
    req = { query: { code: 'auth_code' } };
    res = {
        status: (code) => ({
            send: (msg) => console.log(`[Response] Status: ${code}, Message: ${msg}`),
            json: (obj) => console.log(`[Response] Status: ${code}, JSON: ${JSON.stringify(obj)}`)
        }),
        setHeader: (key, val) => console.log(`[Header] ${key}: ${val}`),
        redirect: (url) => console.log(`[Redirect] -> ${url}`)
    };

    try {
        await runHandler(req, res, 'corecore.dev@gmail.com');
    } catch (e) {
        console.error('Test 2 Failed:', e);
    }
}

runTests();
