import { db, storage } from '../firebase/index.js';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const COURSES_COLLECTION = 'courses';

export const getAllCourses = async () => {
  try {
    const coursesCol = collection(db, COURSES_COLLECTION);
    const q = query(coursesCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw error;
  }
};

export const getPublishedCourses = async () => {
  try {
    const coursesCol = collection(db, COURSES_COLLECTION);
    const q = query(coursesCol, where('status', '==', 'Published'));
    const snapshot = await getDocs(q);
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return courses.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (error) {
    console.error('Error fetching published courses:', error);
    throw error;
  }
};

export const getCourseById = async (id) => {
  try {
    const docRef = doc(db, COURSES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    throw error;
  }
};

export const createCourse = async (courseData) => {
  try {
    const coursesCol = collection(db, COURSES_COLLECTION);
    const newCourse = {
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(coursesCol, newCourse);
    return { id: docRef.id, ...newCourse };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (id, courseData) => {
  try {
    const docRef = doc(db, COURSES_COLLECTION, id);
    const updatedData = {
      ...courseData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updatedData);
    return { id, ...updatedData };
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (id) => {
  try {
    const docRef = doc(db, COURSES_COLLECTION, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const duplicateCourse = async (id) => {
  try {
    const course = await getCourseById(id);
    if (!course) throw new Error('Course not found');
    
    const { id: _, createdAt, updatedAt, ...restData } = course;
    const duplicatedData = {
      ...restData,
      title: `${course.title} (Copy)`,
      status: 'Draft'
    };
    return await createCourse(duplicatedData);
  } catch (error) {
    console.error('Error duplicating course:', error);
    throw error;
  }
};

export const togglePublish = async (id, currentStatus) => {
  try {
    const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';
    await updateCourse(id, { status: newStatus });
    return newStatus;
  } catch (error) {
    console.error('Error toggling publish status:', error);
    throw error;
  }
};

export const uploadCourseImage = async (file, folder) => {
  try {
    const timestamp = Date.now();
    const filename = file.name;
    const storageRef = ref(storage, `courses/${folder}/${timestamp}_${filename}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading course image:', error);
    throw error;
  }
};

export const decrementSeat = async (id) => {
  try {
    const docRef = doc(db, COURSES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentSeats = docSnap.data().availableSeats || 0;
      if (currentSeats > 0) {
        await updateDoc(docRef, { availableSeats: currentSeats - 1, updatedAt: serverTimestamp() });
        return currentSeats - 1;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error decrementing seat:', error);
    throw error;
  }
};
