import { db } from '../firebase/index.js';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';

const ENROLLMENTS_COLLECTION = 'enrollments';

export const createEnrollment = async (enrollmentData) => {
  try {
    const colRef = collection(db, ENROLLMENTS_COLLECTION);
    const newEnrollment = {
      ...enrollmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(colRef, newEnrollment);
    return { id: docRef.id, ...newEnrollment };
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
};

export const getEnrollmentsByCourse = async (courseId) => {
  try {
    const colRef = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(colRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return enrollments.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error fetching enrollments by course:', error);
    throw error;
  }
};

export const getAllEnrollments = async () => {
  try {
    const colRef = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all enrollments:', error);
    throw error;
  }
};

export const getEnrollmentsByUser = async (userId) => {
  try {
    const colRef = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(colRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return enrollments.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error fetching enrollments by user:', error);
    throw error;
  }
};

export const getEnrollmentById = async (id) => {
  try {
    const docRef = doc(db, ENROLLMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching enrollment by ID:', error);
    throw error;
  }
};

export const updateEnrollmentStatus = async (id, status) => {
  try {
    const docRef = doc(db, ENROLLMENTS_COLLECTION, id);
    await updateDoc(docRef, { 
      enrollmentStatus: status,
      updatedAt: serverTimestamp() 
    });
    return { id, status };
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    throw error;
  }
};

export const checkDuplicateEnrollment = async (courseId, userId) => {
  try {
    const colRef = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(colRef, where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => doc.data().userId === userId);
    return !!existing;
  } catch (error) {
    console.error('Error checking duplicate enrollment:', error);
    throw error;
  }
};
