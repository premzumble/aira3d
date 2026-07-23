import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

async function testCreate() {
  try {
    console.log("Simulating createCourse payload...");
    const coursesCol = collection(db, 'courses');
    
    // Simulate what the UI sends when no optional fields are filled.
    // The UI does this: 
    // Object.keys(submissionData).forEach(key => { if (submissionData[key] === undefined || submissionData[key] === '') delete submissionData[key]; });
    
    let submissionData = {
      title: '3D Printing Masterclass Test',
      category: '3D Printing',
      difficulty: 'Beginner',
      courseType: 'Online',
      language: 'English',
      isOnline: true,
      price: '2999',
      status: 'Published',
      badges: [],
      galleryUrls: [],
      learningOutcomes: [],
      requirements: [],
      targetAudience: [],
      toolsRequired: [],
      courseHighlights: [],
      faqs: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log("Adding doc...");
    const docRef = await addDoc(coursesCol, submissionData);
    console.log("Success! ID:", docRef.id);

  } catch (error) {
    console.error("FIREBASE ERROR:", error.code);
    console.error(error.message);
  }
}

testCreate();
