import { db, adminAuth } from './utils/firebaseAdmin.js';
import { allowCors } from './utils/cors.js';

const ADMIN_EMAILS = [
  'kraut9011@gmail.com',
  'premzumble@gmail.com'
];

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { courseId, lessonId } = req.body || {};
    if (!courseId || !lessonId) {
      return res.status(400).json({ success: false, error: 'courseId and lessonId are required' });
    }

    // 1. Fetch the lesson doc
    const lessonRef = db.collection('courses').doc(courseId).collection('lessons').doc(lessonId);
    const lessonSnap = await lessonRef.get();

    if (!lessonSnap.exists) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const lessonData = lessonSnap.data();

    // 2. If it's a free preview lesson, grant access immediately
    if (lessonData.isFreePreview) {
      const fileId = lessonData.driveFileId;
      const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : (lessonData.directVideoUrl || '');
      return res.status(200).json({
        success: true,
        authorized: true,
        isFreePreview: true,
        previewUrl,
        protectionLevel: lessonData.protectionLevel || 'standard',
        watermark: null
      });
    }

    // 3. Authenticate the student from Authorization header or body token
    let userEmail = null;
    let userId = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userEmail = decoded.email?.toLowerCase();
        userId = decoded.uid;
      } catch (authErr) {
        console.warn('ID Token verification warning:', authErr.message);
      }
    }

    // Fallback if client sends userId & userEmail in request body
    if (!userId && req.body.userId) {
      userId = req.body.userId;
      userEmail = req.body.userEmail?.toLowerCase();
    }

    if (!userId && !userEmail) {
      return res.status(401).json({
        success: false,
        authorized: false,
        error: 'Authentication required. Please sign in to access this lesson.'
      });
    }

    // 4. Admin override
    const isAdmin = ADMIN_EMAILS.includes(userEmail);
    let isEnrolled = false;

    if (!isAdmin) {
      // 5. Verify enrollment in Firestore
      const enrollmentsSnap = await db.collection('enrollments')
        .where('courseId', '==', courseId)
        .where('userId', '==', userId)
        .get();

      if (!enrollmentsSnap.empty) {
        for (const doc of enrollmentsSnap.docs) {
          const data = doc.data();
          if (data.enrollmentStatus === 'Confirmed' || data.paymentStatus === 'Paid') {
            isEnrolled = true;
            break;
          }
        }
      }

      // Also check by email if userId didn't match
      if (!isEnrolled && userEmail) {
        const emailEnrollSnap = await db.collection('enrollments')
          .where('courseId', '==', courseId)
          .where('email', '==', userEmail)
          .get();

        if (!emailEnrollSnap.empty) {
          for (const doc of emailEnrollSnap.docs) {
            const data = doc.data();
            if (data.enrollmentStatus === 'Confirmed' || data.paymentStatus === 'Paid') {
              isEnrolled = true;
              break;
            }
          }
        }
      }
    }

    if (!isAdmin && !isEnrolled) {
      return res.status(403).json({
        success: false,
        authorized: false,
        error: 'Access denied: You must be enrolled in this course to watch this lesson.'
      });
    }

    // 6. Authorized: Build response with playback token & watermark metadata
    const fileId = lessonData.driveFileId;
    const previewUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : (lessonData.directVideoUrl || '');

    return res.status(200).json({
      success: true,
      authorized: true,
      isFreePreview: false,
      previewUrl,
      protectionLevel: lessonData.protectionLevel || 'standard',
      watermark: {
        text: `${userEmail || 'Enrolled Student'} • Aira3D`,
        timestamp: new Date().toLocaleDateString()
      }
    });

  } catch (error) {
    console.error('Error in courseVideoAccess:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default allowCors(handler);
