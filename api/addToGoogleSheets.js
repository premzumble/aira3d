import { google } from 'googleapis';
import { allowCors } from './utils/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const registration = req.body;
    
    // We expect FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY for Google API Auth
    // Also GOOGLE_SHEET_ID needs to be set in Vercel
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn("Google Sheets credentials not provided.");
      return res.status(200).json({ success: true, warning: 'Google Sheets integration not configured.' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const values = [
      [
        registration.name,
        registration.email,
        registration.phone,
        registration.city,
        registration.experience,
        registration.workshopDate,
        registration.workshopTime,
        `₹${registration.amount}`,
        registration.status || 'Paid',
        new Date().toLocaleString()
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });

    res.status(200).json({ success: true, message: 'Added to sheets' });
  } catch (error) {
    console.error('Error adding to Google Sheets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export default allowCors(handler);
