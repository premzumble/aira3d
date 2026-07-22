# Workshop Registration System Setup Guide

## Prerequisites

1. Firebase project created (aira3d)
2. Razorpay account (test mode recommended for development)
3. Google Cloud project with Sheets API enabled
4. Firebase CLI installed (`npm install -g firebase-tools`)

## 1. Razorpay Setup

1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys → Generate key pair
3. Save the Key ID and Key Secret

## 2. Firebase Functions Environment Variables

Set up the required environment variables for Cloud Functions:

```bash
# Razorpay credentials
firebase functions:config:set razorpay.key_id="rzp_test_YourRazorpayKey" razorpay.key_secret="YourRazorpaySecret"

# Google Sheets credentials
firebase functions:config:set google.client_email="your-service-account@project.iam.gserviceaccount.com" google.private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" google.sheet_id="your-google-sheet-id"
```

## 3. Google Sheets Setup

1. Create a new Google Sheet
2. Go to Extensions → Apps Script
3. Create a service account in Google Cloud Console
4. Download the service account JSON key
5. Share the Google Sheet with the service account email
6. Copy the Sheet ID from the URL (between /d/ and /edit)
7. Extract client_email and private_key from the JSON file

## 4. Firestore Database Setup

The workshop registrations collection rules are already configured in `firestore.rules`.

## 5. Frontend Setup

1. Update `.env` with your Razorpay key:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_YourRazorpayKey
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## 6. Cloud Functions Deployment

```bash
# Install functions dependencies
cd functions && npm install && cd ..

# Deploy functions
firebase deploy --only functions
```

## 7. Full Deployment

```bash
# Build the frontend
npm run build

# Deploy everything
firebase deploy
```

## Project Structure

```
aira3d/
├── src/
│   ├── pages/
│   │   ├── Workshop.jsx              # Workshop landing page
│   │   └── WorkshopRegistration.jsx  # Payment & registration form
│   └── firebase/
│       └── index.js                  # Firebase configuration
├── functions/
│   └── index.js                      # Cloud Functions (Razorpay + Sheets)
├── firebase.json                     # Firebase config
├── firestore.rules                   # Firestore security rules
└── package.json                      # Root package.json
```

## Workshop Details

- **Title**: 3D Printing Business Blueprint – Start Your 3D Printing Business with Zero Budget
- **Duration**: 90 Minutes
- **Fee**: ₹99
- **Schedule**: Every Sunday, 4:00 PM - 5:30 PM
- **Mode**: Live Online

## Topics Covered

1. Introduction to 3D Printing
2. How 3D Printing Works
3. Choosing the Right 3D Printer
4. Best Beginner Printer Recommendations
5. Types of 3D Printing Filaments
6. Bambu Studio Basics
7. Where to Download 3D Models (Free & Paid)
8. Preparing Models for Printing
9. Creating Custom Products
10. Pricing Your 3D Prints
11. Calculating Profit & Costs
12. Finding High-Paying Customers
13. Online Marketing Strategy
14. Offline Marketing Strategy
15. Instagram & Social Media Growth
16. How to Get Your First Orders
17. Building a 3D Printing Brand
18. Zero Budget Business Plan
19. 30-Day Action Plan
20. Live Q&A Session
