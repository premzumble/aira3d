import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  Bars3Icon, 
  ShareIcon,
  AcademicCapIcon,
  LockClosedIcon,
  FolderArrowDownIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { getCourseById } from '../services/courseService';
import { 
  getCourseModules, 
  getCourseLessons, 
  getStudentProgress, 
  toggleLessonCompletion, 
  saveLastAccessedLesson,
  getGoogleDrivePreviewUrl,
  resolveLessonVideo
} from '../services/curriculumService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import VideoPlayer from '../components/Learning/VideoPlayer';
import CurriculumSidebar from '../components/Learning/CurriculumSidebar';
import LessonComments from '../components/Learning/LessonComments';
import LessonResources, { isVideoResource } from '../components/Learning/LessonResources';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  
  // Enrollment & Authorization
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Student Progress
  const [progressData, setProgressData] = useState({
    completedLessonIds: [],
    progressPercent: 0,
    lastAccessedLessonId: null
  });
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // UI tabs & responsive sidebar
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'discussion' | 'resources'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = currentUser?.email === 'kraut9011@gmail.com' || currentUser?.email === 'premzumble@gmail.com';

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      navigate('/login', { state: { from: `/learn/${courseId}` } });
      return;
    }

    loadCourseAndCurriculum();
  }, [courseId, currentUser, authLoading]);

  const loadCourseAndCurriculum = async () => {
    try {
      setCheckingAccess(true);

      // 1. Fetch Course details
      const courseDoc = await getCourseById(courseId);
      if (!courseDoc) {
        toast.error('Course not found');
        navigate('/courses');
        return;
      }
      setCourse(courseDoc);

      // 2. Verify Enrollment (or Admin)
      let enrolled = isAdmin;
      if (!enrolled) {
        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('courseId', '==', courseId),
          where('userId', '==', currentUser.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        if (!enrollSnap.empty) {
          const userEnroll = enrollSnap.docs.map(d => d.data());
          enrolled = userEnroll.some(e => e.enrollmentStatus === 'Confirmed' || e.paymentStatus === 'Paid');
        }

        // Email fallback check
        if (!enrolled && currentUser.email) {
          const emailQuery = query(
            collection(db, 'enrollments'),
            where('courseId', '==', courseId),
            where('email', '==', currentUser.email)
          );
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            enrolled = emailSnap.docs.map(d => d.data()).some(e => e.enrollmentStatus === 'Confirmed' || e.paymentStatus === 'Paid');
          }
        }
      }
      setIsEnrolled(enrolled);

      // 3. Fetch Modules & Lessons
      const [fetchedModules, fetchedLessons] = await Promise.all([
        getCourseModules(courseId),
        getCourseLessons(courseId)
      ]);

      const publishedLessons = fetchedLessons.filter(l => l.isPublished);
      setModules(fetchedModules);
      setLessons(publishedLessons);

      // 4. Fetch Progress
      const progress = await getStudentProgress(currentUser.uid, courseId);
      if (progress) {
        setProgressData({
          completedLessonIds: progress.completedLessonIds || [],
          progressPercent: progress.progressPercent || 0,
          lastAccessedLessonId: progress.lastAccessedLessonId || null
        });
      }

      // 5. Select active lesson
      if (publishedLessons.length > 0) {
        const resumeLesson = publishedLessons.find(l => l.id === progress?.lastAccessedLessonId);
        if (resumeLesson && (enrolled || resumeLesson.isFreePreview)) {
          setCurrentLesson(resumeLesson);
        } else {
          // Find first accessible lesson
          const firstPlayable = publishedLessons.find(l => enrolled || l.isFreePreview) || publishedLessons[0];
          setCurrentLesson(firstPlayable);
        }
      }

    } catch (error) {
      console.error('Error loading course learning page:', error);
      toast.error('Failed to load course content');
    } finally {
      setCheckingAccess(false);
    }
  };

  const handleSelectLesson = (lesson) => {
    if (!isEnrolled && !lesson.isFreePreview) {
      toast.error('Enroll in this course to unlock this lecture');
      return;
    }
    setCurrentLesson(lesson);
    saveLastAccessedLesson(currentUser.uid, courseId, lesson.id);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleComplete = async () => {
    if (!currentLesson || !isEnrolled) return;
    try {
      setUpdatingProgress(true);
      const updated = await toggleLessonCompletion(
        currentUser.uid,
        courseId,
        currentLesson.id,
        lessons.length
      );
      if (updated) {
        setProgressData(prev => ({
          ...prev,
          completedLessonIds: updated.completedLessonIds,
          progressPercent: updated.progressPercent
        }));

        if (updated.completedLessonIds.includes(currentLesson.id)) {
          toast.success('Lecture marked as completed!');
          // Auto-advance to next lesson if available
          handleNextLesson(false);
        } else {
          toast.success('Lecture marked as incomplete');
        }
      }
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const currentIndex = lessons.findIndex(l => l.id === currentLesson?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < lessons.length - 1;

  const handlePrevLesson = () => {
    if (hasPrev) {
      handleSelectLesson(lessons[currentIndex - 1]);
    }
  };

  const handleNextLesson = (notify = true) => {
    if (hasNext) {
      handleSelectLesson(lessons[currentIndex + 1]);
    } else if (notify) {
      toast.success('🎉 You have reached the end of the course!');
    }
  };

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-[#1c1d1f] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#a435f0]/30 border-t-[#a435f0] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#d1d7dc]">Loading classroom workspace...</p>
      </div>
    );
  }

  // Strict Payment Enforcement: Unpaid users cannot access non-free content
  if (!isEnrolled && (!currentLesson || !currentLesson.isFreePreview)) {
    return (
      <div className="min-h-screen bg-[#1c1d1f] flex items-center justify-center p-4 text-white">
        <div className="max-w-lg w-full bg-[#2d2f31] p-8 sm:p-10 rounded-3xl shadow-2xl border border-[#3e4143] text-center">
          <div className="w-16 h-16 bg-[#a435f0]/15 text-[#a435f0] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#a435f0]/30">
            <LockClosedIcon className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 bg-[#0056d2]/20 text-[#60a5fa] border border-[#0056d2]/30 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-3">
            Coursera & Udemy Verified Access
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
            Enrollment & Payment Required
          </h2>
          <p className="text-sm text-[#d1d7dc] mb-6 leading-relaxed">
            Content for <span className="font-bold text-white">{course?.title || 'this course'}</span> is reserved exclusively for enrolled students with confirmed payment. Complete your enrollment to unlock full access to all video lectures, 3D design files, discussions, and completion certificates.
          </p>

          <div className="bg-[#1c1d1f] p-4 rounded-2xl border border-[#3e4143] mb-6 text-left space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#d1d7dc]">
              <CheckCircleSolid className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full lifetime access to all HD video lectures</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#d1d7dc]">
              <CheckCircleSolid className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Downloadable 3D project files & CAD models</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#d1d7dc]">
              <CheckCircleSolid className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Direct instructor Q&A and student discussions</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#d1d7dc]">
              <CheckCircleSolid className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Verified Certificate of Completion</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link to={`/courses/${courseId}/enroll`} className="block">
              <button className="w-full py-3.5 bg-gradient-to-r from-[#a435f0] to-[#0056d2] hover:from-[#8710d8] hover:to-[#00419e] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#a435f0]/25 transition-all hover:scale-[1.02]">
                Enroll Now • {course?.price ? `₹${course.price}` : 'Get Full Access'}
              </button>
            </Link>
            <Link to={`/courses/${courseId}`} className="block">
              <button className="w-full py-3 bg-[#1c1d1f] hover:bg-[#25272a] text-[#d1d7dc] hover:text-white rounded-xl text-xs font-semibold border border-[#3e4143] transition-colors">
                View Full Course Syllabus
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = progressData.completedLessonIds.includes(currentLesson?.id);
  const videoTarget = resolveLessonVideo(currentLesson);
  const validResources = (currentLesson?.resources || []).filter(res => !isVideoResource(res, currentLesson));

  return (
    <div className="min-h-screen bg-[#1c1d1f] text-white flex flex-col font-sans">
      {/* Top Learning Navigation Bar - Mobile-Optimized Standard Dark Classroom Header */}
      <header className="h-14 sm:h-16 bg-[#1c1d1f] border-b border-[#2d2f31] shadow-md flex items-center justify-between px-3 sm:px-6 z-40 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            to="/profile?tab=courses"
            className="p-1.5 sm:p-2 rounded-xl text-[#d1d7dc] hover:text-white hover:bg-[#2d2f31] transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Back to My Courses"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden md:inline">My Courses</span>
          </Link>

          <div className="h-5 w-px bg-[#3e4143] hidden sm:block" />

          {/* Official Aira3D Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#a435f0] to-[#0056d2] rounded-lg flex items-center justify-center text-white font-display font-bold text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-display font-bold text-white text-base sm:text-lg hidden md:inline tracking-tight">
              Aira3D
            </span>
          </Link>

          <div className="h-5 w-px bg-[#3e4143] hidden md:block" />

          {/* Dynamic Course Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 bg-[#a435f0]/20 text-[#d8b4fe] border border-[#a435f0]/30 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hidden xs:inline-block">
                Course
              </span>
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg">
                {course?.title || 'Course Classroom'}
              </h1>
            </div>
          </div>
        </div>

        {/* Dynamic Progress & Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {lessons.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#d1d7dc]">
                  <span className="text-[#9da3a8] font-normal">Progress:</span>
                  <span className="text-[#a435f0] font-mono font-bold">{progressData.progressPercent}%</span>
                </div>
                <div className="w-24 md:w-36 h-2 bg-[#2d2f31] border border-[#3e4143] rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-gradient-to-r from-[#a435f0] to-[#0056d2] rounded-full transition-all duration-500" 
                    style={{ width: `${progressData.progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="sm:hidden px-2 py-0.5 bg-[#a435f0]/20 text-[#d8b4fe] border border-[#a435f0]/30 font-mono font-bold text-[11px] rounded-md">
                {progressData.progressPercent}%
              </span>
            </div>
          )}

          {/* User Profile avatar pill */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#3e4143]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a435f0] to-[#0056d2] text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[#d1d7dc] max-w-[110px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
            </div>
          )}

          {/* Mobile Curriculum Toggle with icon & label */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 px-2.5 sm:px-3 text-white rounded-xl bg-[#2d2f31] hover:bg-[#35373a] lg:hidden border border-[#3e4143] flex items-center gap-1.5 text-xs font-bold transition-colors"
            title="Toggle Curriculum Syllabus"
          >
            <Bars3Icon className="w-4 h-4 text-[#a435f0]" />
            <span className="hidden xs:inline">Curriculum</span>
          </button>
        </div>
      </header>

      {/* Main Learning Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#1c1d1f]">
        {/* Stage: Video Player & Lecture Notes - Responsive mobile padding */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-6">
          {lessons.length === 0 ? (
            <div className="max-w-3xl mx-auto py-12 text-center">
              <div className="p-8 sm:p-10 bg-[#2d2f31] rounded-3xl border border-[#3e4143] shadow-2xl backdrop-blur-sm">
                <div className="w-16 h-16 rounded-2xl bg-[#a435f0]/15 text-[#a435f0] flex items-center justify-center mx-auto mb-4 ring-1 ring-[#a435f0]/30">
                  <AcademicCapIcon className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#a435f0] block mb-2">
                  Curriculum In Preparation
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Course Lectures Coming Soon
                </h2>
                <p className="text-xs sm:text-sm text-[#d1d7dc] max-w-md mx-auto leading-relaxed mb-6">
                  The instructor is currently preparing the high-definition video lessons and downloadable project files for <span className="text-white font-semibold">{course?.title}</span>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to={`/courses/${courseId}`}>
                    <button className="px-4 py-2 bg-[#1c1d1f] border border-[#3e4143] text-[#d1d7dc] hover:text-white hover:bg-[#25272a] text-xs font-semibold rounded-xl">
                      View Course Details
                    </button>
                  </Link>
                  <Link to="/profile?tab=courses">
                    <button className="px-4 py-2 bg-[#a435f0] hover:bg-[#8710d8] text-white text-xs font-bold rounded-xl shadow-md shadow-[#a435f0]/20">
                      Back to My Courses
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
              {/* REMOUNT KEY: Guarantees old video iframe & audio instantly stop on lesson switch */}
              <VideoPlayer
                key={currentLesson?.id || 'classroom-stage'}
                lesson={currentLesson}
                videoTarget={videoTarget}
                previewUrl={videoTarget.url}
                userEmail={currentUser?.email}
                userId={currentUser?.uid}
                onNextLesson={hasNext ? () => handleNextLesson(true) : null}
                onOpenOverview={() => setActiveTab('overview')}
                isFreePreview={currentLesson?.isFreePreview}
                protectionLevel={currentLesson?.protectionLevel}
              />

              {/* Lecture Controls & Completion Bar - Fully Responsive Mobile Grid */}
              <div className="bg-[#2d2f31] p-3.5 sm:p-5 rounded-2xl border border-[#3e4143] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-lg font-bold text-white">
                      {currentLesson?.title}
                    </h2>
                    {currentLesson?.isFreePreview && (
                      <span className="px-2 py-0.5 bg-[#a435f0]/20 text-[#d8b4fe] border border-[#a435f0]/30 rounded-md text-[10px] font-bold">
                        Free Preview
                      </span>
                    )}
                  </div>
                  {currentLesson?.duration && (
                    <span className="text-[11px] sm:text-xs text-[#9da3a8] font-mono mt-0.5 block">
                      Duration: {currentLesson.duration}
                    </span>
                  )}
                </div>

                {/* Mobile 3-Column Equal Grid vs Desktop Row */}
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-3 pt-2.5 sm:pt-0 border-t border-[#3e4143] sm:border-0">
                  <button
                    disabled={!hasPrev}
                    onClick={handlePrevLesson}
                    className="w-full sm:w-auto px-2.5 sm:px-4 py-2 bg-[#1c1d1f] border border-[#3e4143] text-[#d1d7dc] hover:text-white hover:bg-[#35373a] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" /> <span>Prev</span>
                  </button>

                  {isEnrolled ? (
                    <button
                      disabled={updatingProgress}
                      onClick={handleToggleComplete}
                      className={`w-full sm:w-auto px-2.5 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isCurrentCompleted 
                          ? 'border border-emerald-500/40 text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50' 
                          : 'bg-[#a435f0] hover:bg-[#8710d8] text-white shadow-md shadow-[#a435f0]/20'
                      }`}
                    >
                      {isCurrentCompleted ? (
                        <>
                          <CheckCircleSolid className="w-4 h-4 text-emerald-400" />
                          <span className="hidden xs:inline">Completed</span>
                          <span className="xs:hidden">Done</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Complete</span>
                        </>
                      )}
                    </button>
                  ) : <div className="sm:hidden" />}

                  <button
                    disabled={!hasNext}
                    onClick={() => handleNextLesson(true)}
                    className="w-full sm:w-auto px-2.5 sm:px-4 py-2 bg-[#1c1d1f] border border-[#3e4143] text-[#d1d7dc] hover:text-white hover:bg-[#35373a] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Next</span> <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Tabs (Overview, Discussion, Resources) - Udemy / Coursera Standard */}
              <div className="bg-[#2d2f31] rounded-2xl border border-[#3e4143] overflow-hidden shadow-sm">
                <div className="flex border-b border-[#3e4143] px-3 sm:px-6 pt-3 gap-3 sm:gap-6 bg-[#25272a] overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'overview'
                        ? 'border-[#a435f0] text-white'
                        : 'border-transparent text-[#9da3a8] hover:text-[#d1d7dc]'
                    }`}
                  >
                    <DocumentTextIcon className="w-4 h-4 flex-shrink-0" /> Overview
                  </button>

                  <button
                    onClick={() => setActiveTab('discussion')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'discussion'
                        ? 'border-[#a435f0] text-white'
                        : 'border-transparent text-[#9da3a8] hover:text-[#d1d7dc]'
                    }`}
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0" /> Discussion & Q&A
                  </button>

                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all whitespace-nowrap ${
                      activeTab === 'resources'
                        ? 'border-[#a435f0] text-white'
                        : 'border-transparent text-[#9da3a8] hover:text-[#d1d7dc]'
                    }`}
                  >
                    <FolderArrowDownIcon className="w-4 h-4 flex-shrink-0" /> Resources ({validResources.length})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="p-6 text-[#d1d7dc] text-sm">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-bold text-white mb-2">About this lecture</h3>
                        <p className="text-[#d1d7dc] leading-relaxed whitespace-pre-line text-sm">
                          {currentLesson?.description || (currentLesson?.title ? `In this lecture, the instructor presents key workflows and demonstrations for ${currentLesson.title}. Use the discussion tab to ask questions or share your progress.` : 'No detailed lecture notes provided.')}
                        </p>
                      </div>

                      {course?.instructorName && (
                        <div className="pt-5 border-t border-[#3e4143] flex items-center gap-4 bg-[#1c1d1f] p-4 rounded-xl border border-[#3e4143]">
                          {course.instructorImageUrl ? (
                            <img src={course.instructorImageUrl} alt={course.instructorName} className="w-12 h-12 rounded-xl object-cover shadow-md" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#a435f0] to-[#0056d2] text-white font-bold flex items-center justify-center text-lg shadow-md">
                              {course.instructorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9da3a8] block">Instructor</span>
                            <h4 className="font-bold text-white text-sm">{course.instructorName}</h4>
                            {course.instructorBio && (
                              <p className="text-xs text-[#9da3a8] line-clamp-1 mt-0.5">{course.instructorBio}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'discussion' && (
                    <LessonComments
                      courseId={courseId}
                      lessonId={currentLesson?.id}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === 'resources' && (
                    <LessonResources lesson={currentLesson} resources={validResources} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 shadow-2xl">
          <CurriculumSidebar
            modules={modules}
            lessons={lessons}
            currentLesson={currentLesson}
            onSelectLesson={handleSelectLesson}
            completedLessonIds={progressData.completedLessonIds}
            isEnrolled={isEnrolled}
          />
        </aside>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-[#1c1d1f] border-l border-[#3e4143] shadow-2xl"
              >
                <CurriculumSidebar
                  modules={modules}
                  lessons={lessons}
                  currentLesson={currentLesson}
                  onSelectLesson={handleSelectLesson}
                  completedLessonIds={progressData.completedLessonIds}
                  isEnrolled={isEnrolled}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
