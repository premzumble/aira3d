import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, serverTimestamp, addDoc, getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACwOhmhuKCgAYvY_M8c1dkaTZeAA4w2Uk",
  authDomain: "aira3d.firebaseapp.com",
  projectId: "aira3d",
  storageBucket: "aira3d.firebasestorage.app",
  messagingSenderId: "454155670700",
  appId: "1:454155670700:web:3c38b93c8468ac04323b09"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { onAuthStateChanged, signOut, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, fetchSignInMethodsForEmail, getAuth };
export { getFirestore, collection, getDocs, getDoc, doc, addDoc, query, where, orderBy, limit, serverTimestamp, updateDoc, deleteDoc };
export default app;