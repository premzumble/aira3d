import { allowCors } from './utils/cors.js';

function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const fileId = extractDriveId(url);
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google Drive link format. Supported formats: https://drive.google.com/file/d/FILE_ID/view or direct FILE_ID.'
      });
    }

    // Return the sanitized file ID and standard preview URL
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    return res.status(200).json({
      success: true,
      fileId,
      previewUrl,
      message: 'Google Drive video link recognized successfully.'
    });
  } catch (error) {
    console.error('Error validating Drive video:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default allowCors(handler);
