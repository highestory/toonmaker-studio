export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { projectTitle, episodes } = req.body;

    // Basic FCPXML 1.9 Template (Compatible with Premiere Pro)
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>
    </resources>
    <library location="file:///Users/ktw/Movies/ToonJigiLibrary.fcpbundle">
        <event name="${projectTitle || 'Webtoon Project'}">
            <project name="${projectTitle || 'Webtoon Project'}">
                <sequence format="r1" duration="10s" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
                    <spine>
                        <gap name="Gap" offset="0s" duration="5s" start="0s"/>
                        <!-- Placeholder for clips -->
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=${projectTitle || 'project'}.xml`);
    res.status(200).send(xmlContent);
}
