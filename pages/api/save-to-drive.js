import { google } from 'googleapis';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        // 1. Authenticate using User Token
        const cookies = parse(req.headers.cookie || '');
        const tokenString = cookies.google_auth_token;

        if (!tokenString) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const tokens = JSON.parse(tokenString);

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials(tokens);

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!folderId) {
            throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in environment variables');
        }

        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // 2. Create File
        const fileMetadata = {
            name: title,
            parents: [folderId],
            mimeType: 'application/vnd.google-apps.document', // Create as Google Doc
        };

        const media = {
            mimeType: 'text/plain',
            body: content,
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        res.status(200).json({ 
            success: true, 
            fileId: file.data.id, 
            link: file.data.webViewLink 
        });

    } catch (error) {
        console.error('Drive upload error:', error);
        // If token expired or invalid, we might want to return 401 to trigger re-login
        if (error.code === 401 || (error.response && error.response.status === 401)) {
             return res.status(401).json({ error: 'Authentication expired' });
        }
        res.status(500).json({ error: error.message || 'Failed to upload to Drive' });
    }
}
