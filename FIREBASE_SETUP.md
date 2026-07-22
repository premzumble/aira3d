# Firebase Setup Guide for Aira3D

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: **Aira3D**
4. Disable Google Analytics (optional) or enable it
5. Click **"Create project"**

## Step 2: Enable Authentication

1. In Firebase Console → **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click Email/Password
   - Toggle "Enable"
   - Save
5. Enable **Google**:
   - Click Google
   - Toggle "Enable"
   - Select support email from dropdown
   - Save

## Step 3: Create Firestore Database

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we have custom rules below)
4. Choose a location closest to you (e.g., asia-south1 for India)
5. Click **"Enable"**

## Step 4: Enable Firebase Storage

1. In Firebase Console → **Build** → **Storage**
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Click **"Next"** then **"Done"**

## Step 5: Get Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **Your apps** → **Web** (</>) icon
3. Register app name: **aira3d-web**
4. Copy the `firebaseConfig` object
5. Paste it into `aira3d/src/firebase/index.js` replacing the placeholder values

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aira3d.firebaseapp.com",
  projectId: "aira3d",
  storageBucket: "aira3d.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 6: Deploy Security Rules

### Firestore Rules (firestore.rules)

See `firestore.rules` file in this folder. Deploy with:

```bash
firebase deploy --only firestore:rules
```

### Storage Rules (storage.rules)

See `storage.rules` file in this folder. Deploy with:

```bash
firebase deploy --only storage
```

## Step 7: Create Admin User

1. Go to Firebase Console → **Authentication** → **Users**
2. Click **"Add user"**
3. Enter your email and a password
4. This user will be the admin. Make sure the email matches `ADMIN_EMAIL` in `src/utils/constants.js`

## Step 8: Seed Initial Data (Optional)

Run the seed script to populate sample products:

```bash
node seed-data.js
```

## Firestore Collections Structure

| Collection | Fields | Description |
|-----------|--------|-------------|
| `products` | name, category, price, description, imageUrl, material, size, featured, createdAt | Product catalog |
| `orders` | orderId, customerInfo {name, phone, email, address, city, state, pincode}, items [], totalAmount, gst, paymentMethod, status, date | Customer orders |
| `customOrders` | customerInfo {name, phone, email, address, city, state, pincode}, productType, quantity, description, stlFileUrl, referenceImageUrl, additionalMessage, status, date | Custom requests |
| `gallery` | imageUrl, title, category, description, beforeImageUrl, createdAt | Gallery items |
| `contactMessages` | name, phone, email, message, date, status | Contact form submissions |

## Environment Variables (Optional)

Create `.env` in project root for sensitive data:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting` (select existing project, set `aira3d/dist` as public directory)
4. Build: `npm run build`
5. Deploy: `firebase deploy`
