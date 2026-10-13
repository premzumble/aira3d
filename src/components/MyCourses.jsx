import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  CalendarIcon, 
  ClockIcon, 
  AcademicCapIcon, 
  MagnifyingGlassIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStudentProgress } from '../services/curriculumService';

export default function MyCourses({ currentUser }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        if (!currentUser?.uid) return;

        // Fetch enrollments by userId
        const enrollQuery = query(
          collection(db, 'enrollments'),
          where('userId', '==', currentUser.uid)
        );
        const enrollSnap = await getDocs(enrollQuery);
        let enrollList = enrollSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fallback: Check by email if userId returned 0 enrollments
        if (enrollList.length === 0 && currentUser.email) {
          const emailQuery = query(
            collection(db, 'enrollments'),
            where('email', '==', currentUser.email)
          );
          const emailSnap = await getDocs(emailQuery);
          enrollList = emailSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // STRICT PAYMENT ENFORCEMENT:
        // User will ONLY see content after successful payment.
        // Filter out all unpaid, pending, failed, or cancelled enrollments.
        const validPaidEnrollments = enrollList.filter(e => {
          const isPaid = e.paymentStatus === 'Paid' || e.paymentStatus === 'Captured' || e.paymentStatus === 'Success';
          const isConfirmed = e.enrollmentStatus === 'Confirmed';
          const isNotPendingOrFailed = 
            e.paymentStatus !== 'Pending' && 
            e.enrollmentStatus !== 'Pending' && 
            e.paymentStatus !== 'Failed' && 
            e.paymentStatus !== 'Created';

          return (isPaid || isConfirmed) && isNotPendingOrFailed;
        });

        // Fetch associated course details and student progress for all paid courses
        const enriched = await Promise.all(
          validPaidEnrollments.map(async (enroll) => {
            let courseDetails = null;
            let progress = null;

            if (enroll.courseId) {
              try {
                const [cDoc, prog] = await Promise.all([
                  getDoc(doc(db, 'courses', enroll.courseId)),
                  getStudentProgress(currentUser.uid, enroll.courseId)
                ]);

                if (cDoc.exists()) {
                  courseDetails = { id: cDoc.id, ...cDoc.data() };
                }
                progress = prog;
              } catch (err) {
                console.error("Error fetching course data:", err);
              }
            }

            // Determine status dynamically based on actual progress
            let computedStatus = 'Ongoing';
            if (progress?.progressPercent >= 100) {
              computedStatus = 'Completed';
            } else if (courseDetails?.startDate) {
              const start = new Date(courseDetails.startDate);
              const now = new Date();
              if (start > now) computedStatus = 'Upcoming';
            }

            return {
              ...enroll,
              courseDetails,
              progress,
              computedStatus
            };
          })
        );

        // Sort: newest enrollments first
        enriched.sort((a, b) => {
          const dA = a.createdAt?.seconds || 0;
          const dB = b.createdAt?.seconds || 0;
          return dB - dA;
        });

        setEnrollments(enriched);
      } catch (error) {
        console.error("Error fetching my courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) {
      fetchMyCourses();
    }
  }, [currentUser]);

  const filteredEnrollments = enrollments.filter(enroll => {
    const matchesFilter = filter === 'All' || enroll.computedStatus === filter;
    const matchesSearch = 
      enroll.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      enroll.courseDetails?.instructorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enroll.courseDetails?.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ongoing': return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {['All', 'Upcoming', 'Ongoing', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                filter === f 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search enrolled courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 animate-pulse flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-80 h-52 bg-gray-100 rounded-2xl flex-shrink-0" />
              <div className="flex-1 py-2 space-y-4">
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-7 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-50 rounded w-1/3" />
                <div className="h-10 bg-gray-50 rounded-2xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Enrolled Courses Found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Courses appear here immediately after successful payment and enrollment confirmation.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/20 transition-all hover:scale-105"
          >
            Browse Available Courses
          </Link>
        </div>
      ) : (
        /* Multi-Course Stack: Shows all courses in a spacious vertical sequence */
        <div className="space-y-6">
          <AnimatePresence>
            {filteredEnrollments.map((enroll, idx) => {
              const course = enroll.courseDetails;
              const isCompleted = enroll.computedStatus === 'Completed';
              const progressPercent = enroll.progress?.progressPercent || 0;
              const completedLessonsCount = enroll.progress?.completedLessonIds?.length || 0;

              return (
                <motion.div
                  key={enroll.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-stretch group"
                >
                  {/* Responsive Full-View Thumbnail Container */}
                  <div className="w-full md:w-72 lg:w-80 flex-shrink-0 self-center md:self-start">
                    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 bg-slate-900 group-hover:border-primary-300 transition-all">
                      {course?.thumbnailUrl ? (
                        <div className="relative w-full aspect-video md:aspect-[4/3] flex items-center justify-center overflow-hidden">
                          {/* Ambient fill to eliminate letterbox dead-space and make the thumbnail look rich and full */}
                          <img 
                            src={course.thumbnailUrl} 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-35" 
                          />
                          {/* Full crisp uncropped image, perfectly fitting and responsive */}
                          <img 
                            src={course.thumbnailUrl} 
                            alt={enroll.courseTitle} 
                            className={`relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isCompleted ? 'grayscale-[15%]' : ''}`}
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video md:aspect-[4/3] flex flex-col items-center justify-center text-gray-400 bg-gray-900">
                          <PlayCircleIcon className="w-12 h-12" />
                          <span className="text-xs text-gray-400 mt-2 font-medium">Aira3D Academy</span>
                        </div>
                      )}
                      
                      {/* Status Badge overlay */}
                      <div className="absolute top-3 left-3 z-20">
                        <span className={`px-3 py-1 text-xs font-bold rounded-xl shadow-md border ${getStatusColor(enroll.computedStatus)} backdrop-blur-md bg-opacity-95`}>
                          {enroll.computedStatus}
                        </span>
                      </div>

                      {/* Verified Paid Badge */}
                      <div className="absolute bottom-3 right-3 z-20">
                        <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Paid Access</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Details & Actions Column */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top Meta: Enrollment ID & Category */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                          ENROLLMENT #{enroll.id.substring(0, 8)}
                        </span>
                        {course?.category && (
                          <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold">
                            {course.category}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-gray-900 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                        {enroll.courseTitle}
                      </h3>

                      {/* Instructor */}
                      {course?.instructorName && (
                        <p className="text-sm font-medium text-gray-500 mb-4">
                          Taught by <strong className="text-gray-800">{course.instructorName}</strong>
                        </p>
                      )}

                      {/* Schedule & Duration Pills */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-5">
                        {course?.startDate && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {new Date(course.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {course?.duration && (
                          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                            <ClockIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{course.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Learning Progress Component */}
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 mb-5">
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="font-bold text-gray-700">Learning Progress</span>
                          <span className="font-mono font-bold text-primary-600 text-sm">
                            {progressPercent}% Completed
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-primary-600 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        {completedLessonsCount > 0 && (
                          <span className="text-[11px] text-gray-500 mt-1.5 block">
                            {completedLessonsCount} lectures completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row: Guaranteed unclipped, full responsive width */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                      <Link 
                        to={`/courses/${enroll.courseId}`}
                        className="px-5 py-3 border border-gray-200 hover:border-gray-800 text-gray-700 hover:text-gray-900 rounded-xl text-sm font-bold transition-all text-center"
                      >
                        Course Syllabus
                      </Link>
                      
                      <Link 
                        to={`/learn/${enroll.courseId}`}
                        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] text-center"
                      >
                        <PlayIcon className="w-4 h-4 fill-current" />
                        <span>{progressPercent > 0 ? 'Continue Learning' : 'Start Learning'}</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
