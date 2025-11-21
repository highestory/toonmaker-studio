const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function debugDrive() {
    try {
        // Load env
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) process.env[key.trim()] = value.trim();
            });
        }

        const keyFilePath = path.join(process.cwd(), 'service-account.json');
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        console.log('Folder ID:', folderId);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 1. Check About (Storage Quota)
        console.log('Checking Storage Quota...');
        const about = await drive.about.get({
            fields: 'storageQuota,user'
        });
        console.log('User:', about.data.user.emailAddress);
        console.log('Storage:', about.data.storageQuota);

        // 2. Check Folder Access
        console.log('\nChecking Folder Access...');
        try {
            const folder = await drive.files.get({
                fileId: folderId,
                fields: 'name, capabilities'
            });
            console.log('Folder Name:', folder.data.name);
            console.log('Capabilities:', folder.data.capabilities);
            
            if (!folder.data.capabilities.canAddChildren) {
                console.error('ERROR: Cannot add children to this folder. Check permissions!');
            }
        } catch (e) {
            console.error('Failed to access folder:', e.message);
        }

        // 3. Try to create a small file
        console.log('\nTrying to create a test file...');
        const fileMetadata = {
            name: 'debug_test.txt',
            parents: [folderId]
        };
        const media = {
            mimeType: 'text/plain',
            body: 'Hello World'
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
        console.log('Success! File ID:', file.data.id);

        // Cleanup
        await drive.files.delete({ fileId: file.data.id });
        console.log('Test file deleted.');

    } catch (error) {
        console.error('Debug Error:', error);
    }
}

debugDrive();
