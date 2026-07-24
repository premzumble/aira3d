import admin from 'firebase-admin';

let db;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace literal \n with actual newlines for private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  db = admin.firestore();
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
}

export { db };
export default admin;
