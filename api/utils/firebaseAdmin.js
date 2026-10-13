import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let db;
let adminAuth;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  if (getApps().length === 0) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID ? process.env.FIREBASE_PROJECT_ID.replace(/^"|"$/g, '') : undefined,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? process.env.FIREBASE_CLIENT_EMAIL.replace(/^"|"$/g, '') : undefined,
          // Strip quotes if present, then replace literal \n with actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
            : undefined,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  db = getFirestore();
  adminAuth = getAuth();
} else {
  console.warn("Firebase Admin credentials missing. Database operations on the backend will be disabled.");
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false }),
        update: async () => {}
      })
    }),
    batch: () => ({
      update: () => {},
      commit: async () => {}
    })
  };
  adminAuth = {
    verifyIdToken: async () => { throw new Error("Firebase Admin not configured"); }
  };
}
export { db, adminAuth, FieldValue };

