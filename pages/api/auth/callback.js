import { google } from 'googleapis';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Set the token in a cookie
    // In a production app, you should encrypt this or use a session ID
    // For this personal tool, we'll store the access token directly (it expires in 1h)
    // Ideally we'd also store the refresh token to get new access tokens
    
    const cookieValue = JSON.stringify(tokens);

    res.setHeader('Set-Cookie', serialize('google_auth_token', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    }));

    res.redirect('/');
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
}
