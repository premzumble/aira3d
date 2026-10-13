import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACwOhmhuKCgAYvY_M8c1dkaTZeAA4w2Uk",
  authDomain: "aira3d.firebaseapp.com",
  projectId: "aira3d",
  storageBucket: "aira3d.firebasestorage.app",
  messagingSenderId: "454155670700",
  appId: "1:454155670700:web:3c38b93c8468ac04323b09"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const EMAIL = "premzumble@gmail.com";
const PASSWORD = "Prem@1221!";

async function createAdmin() {
  try {
    // Try to create the account
    const res = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log("SUCCESS: Account created for", res.user.email);
    console.log("UID:", res.user.uid);
    process.exit(0);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("Account already exists. Trying to sign in...");
      try {
        const res = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        console.log("SUCCESS: Signed in as", res.user.email);
        console.log("UID:", res.user.uid);
        process.exit(0);
      } catch (signInErr) {
        console.error("Sign-in failed:", signInErr.code);
        console.log("Account exists but password is different. Use Reset Password on the login page.");
        process.exit(1);
      }
    } else {
      console.error("Failed:", err.code, err.message);
      process.exit(1);
    }
  }
}

createAdmin();
