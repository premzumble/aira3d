import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dotenvContent = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

let projectId = env.FIREBASE_PROJECT_ID;
let clientEmail = env.FIREBASE_CLIENT_EMAIL;
let privateKey = env.FIREBASE_PRIVATE_KEY;

if (projectId) projectId = projectId.replace(/^"|"$/g, '');
if (clientEmail) clientEmail = clientEmail.replace(/^"|"$/g, '');
if (privateKey) privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

try {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  
  const db = getFirestore();
  db.collection('orders').doc('hKxfOkChxY2AkdUh1Ovu').get().then(docSnap => {
    if (docSnap.exists) {
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("Not found");
    }
  });
} catch (e) {
  console.error("FAIL:", e.message);
}
