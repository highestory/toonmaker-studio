import { serialize } from 'cookie';

export default function handler(req, res) {
    // Clear the cookie by setting it to expire in the past
    res.setHeader('Set-Cookie', serialize('google_auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: -1, // Expire immediately
        sameSite: 'lax',
    }));

    res.redirect('/');
}
