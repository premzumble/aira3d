import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACwOhmhuKCgAYvY_M8c1dkaTZeAA4w2Uk",
  authDomain: "aira3d.firebaseapp.com",
  projectId: "aira3d",
  storageBucket: "aira3d.firebasestorage.app",
  messagingSenderId: "454155670700",
  appId: "1:454155670700:web:3c38b93c8468ac04323b09"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch() {
  try {
    console.log("Fetching courses...");
    const coursesCol = collection(db, 'courses');
    const q = query(coursesCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    console.log(`Success! Fetched ${snapshot.docs.length} courses.`);
  } catch (error) {
    console.error("Firebase Error:");
    console.error(error.code);
    console.error(error.message);
  }
}

testFetch();
