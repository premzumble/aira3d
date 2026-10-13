import { db } from '../firebase/index.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

/**
 * Robust utility to parse Google Drive File ID from standard Drive sharing/preview links.
 * Handles formats like:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - Raw File ID
 */
export const extractGoogleDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/([a-zA-Z0-9_-]+)
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: Raw ID string (typically 25 to 50 characters, alphanumeric with - or _)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

export const getGoogleDrivePreviewUrl = (fileId) => {
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Universally resolve video playback target for any lesson data object.
 * Returns { type: 'embed' | 'video' | 'none', url: string, source: string }
 */
export const resolveLessonVideo = (lesson) => {
  if (!lesson) return { type: 'none', url: '', source: 'none' };

  // 1. Explicit driveFileId
  if (lesson.driveFileId && typeof lesson.driveFileId === 'string' && lesson.driveFileId.trim()) {
    const rawId = extractGoogleDriveId(lesson.driveFileId) || lesson.driveFileId.trim();
    // Exclude placeholders like sample IDs if a directVideoUrl also exists
    if (!rawId.includes('sample') || !lesson.directVideoUrl) {
      return {
        type: 'embed',
        url: `https://drive.google.com/file/d/${rawId}/preview`,
        source: 'google_drive',
        fileId: rawId
      };
    }
  }

  // 2. Candidate video URL
  const candidateUrl = (lesson.directVideoUrl || lesson.videoUrl || lesson.url || '').trim();
  if (!candidateUrl) {
    if (lesson.driveFileId) {
      return {
        type: 'embed',
        url: `https://drive.google.com/file/d/${lesson.driveFileId}/preview`,
        source: 'google_drive',
        fileId: lesson.driveFileId
      };
    }
    return { type: 'none', url: '', source: 'none' };
  }

  // A. Google Drive sharing / preview URL
  const driveId = extractGoogleDriveId(candidateUrl);
  if (driveId && (candidateUrl.includes('drive.google.com') || candidateUrl.includes('docs.google.com'))) {
    return {
      type: 'embed',
      url: `https://drive.google.com/file/d/${driveId}/preview`,
      source: 'google_drive',
      fileId: driveId
    };
  }

  // B. YouTube URL
  const ytMatch = candidateUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'embed',
      url: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      source: 'youtube',
      fileId: ytMatch[1]
    };
  }

  // C. Vimeo URL
  const vimeoMatch = candidateUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+))/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'embed',
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      source: 'vimeo',
      fileId: vimeoMatch[1]
    };
  }

  // D. Direct video files (.mp4, .webm, .ogg, .mov, googleapis video bucket)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(candidateUrl) || candidateUrl.includes('gtv-videos-bucket') || candidateUrl.includes('.mp4')) {
    return {
      type: 'video',
      url: candidateUrl,
      source: 'direct'
    };
  }

  // E. Generic Embed URL
  if (candidateUrl.startsWith('http://') || candidateUrl.startsWith('https://')) {
    return {
      type: 'embed',
      url: candidateUrl,
      source: 'custom'
    };
  }

  return { type: 'none', url: '', source: 'none' };
};

// ==========================================
// MODULES MANAGEMENT
// ==========================================

export const getCourseModules = async (courseId) => {
  try {
    const modulesRef = collection(db, 'courses', courseId, 'modules');
    const q = query(modulesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching course modules:', error);
    throw error;
  }
};

export const createModule = async (courseId, moduleData) => {
  try {
    const modulesRef = collection(db, 'courses', courseId, 'modules');
    const docData = {
      title: moduleData.title.trim(),
      order: Number(moduleData.order) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(modulesRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

export const updateModule = async (courseId, moduleId, moduleData) => {
  try {
    const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
    const updateData = {
      ...moduleData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
    return { id: moduleId, ...updateData };
  } catch (error) {
    console.error('Error updating module:', error);
    throw error;
  }
};

export const deleteModule = async (courseId, moduleId) => {
  try {
    const docRef = doc(db, 'courses', courseId, 'modules', moduleId);
    await deleteDoc(docRef);
    return moduleId;
  } catch (error) {
    console.error('Error deleting module:', error);
    throw error;
  }
};

// ==========================================
// LESSONS MANAGEMENT
// ==========================================

export const getCourseLessons = async (courseId) => {
  try {
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    const q = query(lessonsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    throw error;
  }
};

export const createLesson = async (courseId, lessonData) => {
  try {
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    const driveFileId = extractGoogleDriveId(lessonData.videoUrl || lessonData.driveFileId);

    const docData = {
      moduleId: lessonData.moduleId || 'default',
      title: lessonData.title.trim(),
      description: lessonData.description || '',
      videoSource: lessonData.videoSource || 'google_drive',
      driveFileId: driveFileId || '',
      directVideoUrl: lessonData.directVideoUrl || '',
      duration: lessonData.duration || '00:00',
      order: Number(lessonData.order) || 0,
      isPublished: lessonData.isPublished !== undefined ? lessonData.isPublished : true,
      isFreePreview: !!lessonData.isFreePreview,
      protectionLevel: lessonData.protectionLevel || 'standard',
      resources: lessonData.resources || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(lessonsRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const updateLesson = async (courseId, lessonId, lessonData) => {
  try {
    const docRef = doc(db, 'courses', courseId, 'lessons', lessonId);
    const driveFileId = lessonData.videoUrl !== undefined
      ? extractGoogleDriveId(lessonData.videoUrl)
      : lessonData.driveFileId;

    const updateData = {
      ...lessonData,
      ...(driveFileId !== undefined && { driveFileId }),
      updatedAt: serverTimestamp()
    };

    // Remove undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    await updateDoc(docRef, updateData);
    return { id: lessonId, ...updateData };
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

export const deleteLesson = async (courseId, lessonId) => {
  try {
    const docRef = doc(db, 'courses', courseId, 'lessons', lessonId);
    await deleteDoc(docRef);
    return lessonId;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

export const reorderLessonsBatch = async (courseId, updatedLessons) => {
  try {
    const batch = writeBatch(db);
    updatedLessons.forEach(lesson => {
      const docRef = doc(db, 'courses', courseId, 'lessons', lesson.id);
      batch.update(docRef, {
        order: lesson.order,
        moduleId: lesson.moduleId,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error reordering lessons:', error);
    throw error;
  }
};

// ==========================================
// STUDENT COURSE PROGRESS
// ==========================================

export const getStudentProgress = async (userId, courseId) => {
  if (!userId || !courseId) return null;
  try {
    const progressId = `${userId}_${courseId}`;
    const docRef = doc(db, 'course_progress', progressId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return {
      userId,
      courseId,
      lastAccessedLessonId: null,
      completedLessonIds: [],
      progressPercent: 0,
      updatedAt: null
    };
  } catch (error) {
    console.error('Error getting student progress:', error);
    return null;
  }
};

export const toggleLessonCompletion = async (userId, courseId, lessonId, totalLessonsCount) => {
  if (!userId || !courseId || !lessonId) return null;
  try {
    const progressId = `${userId}_${courseId}`;
    const docRef = doc(db, 'course_progress', progressId);
    const snap = await getDoc(docRef);

    let completedList = [];
    if (snap.exists() && Array.isArray(snap.data().completedLessonIds)) {
      completedList = [...snap.data().completedLessonIds];
    }

    const isAlreadyCompleted = completedList.includes(lessonId);
    let updatedCompleted;
    if (isAlreadyCompleted) {
      updatedCompleted = completedList.filter(id => id !== lessonId);
    } else {
      updatedCompleted = [...completedList, lessonId];
    }

    const total = totalLessonsCount > 0 ? totalLessonsCount : 1;
    const progressPercent = Math.min(100, Math.round((updatedCompleted.length / total) * 100));

    const payload = {
      userId,
      courseId,
      completedLessonIds: updatedCompleted,
      progressPercent,
      lastAccessedLessonId: lessonId,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (error) {
    console.error('Error updating lesson completion:', error);
    throw error;
  }
};

export const saveLastAccessedLesson = async (userId, courseId, lessonId) => {
  if (!userId || !courseId || !lessonId) return;
  try {
    const progressId = `${userId}_${courseId}`;
    const docRef = doc(db, 'course_progress', progressId);
    await setDoc(docRef, {
      userId,
      courseId,
      lastAccessedLessonId: lessonId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving last accessed lesson:', error);
  }
};

// ==========================================
// LESSON COMMENTS / DISCUSSIONS
// ==========================================

export const getLessonComments = async (courseId, lessonId) => {
  try {
    const commentsRef = collection(db, 'lesson_comments');
    const q = query(
      commentsRef,
      where('courseId', '==', courseId),
      where('lessonId', '==', lessonId)
    );
    const snap = await getDocs(q);
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort client-side to avoid requiring composite indexes for every field combination
    return comments.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting lesson comments:', error);
    return [];
  }
};

export const addLessonComment = async (courseId, lessonId, { userId, userName, userEmail, commentText }) => {
  if (!commentText || !commentText.trim()) throw new Error('Comment cannot be empty');
  try {
    const commentsRef = collection(db, 'lesson_comments');
    const docData = {
      courseId,
      lessonId,
      userId,
      userName: userName || userEmail?.split('@')[0] || 'Student',
      userEmail: userEmail || '',
      commentText: commentText.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(commentsRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteLessonComment = async (commentId) => {
  try {
    const docRef = doc(db, 'lesson_comments', commentId);
    await deleteDoc(docRef);
    return commentId;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
