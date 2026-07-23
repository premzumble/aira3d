import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatPrice, formatDate } from '../utils/formatHelpers.js';
import toast from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  UserGroupIcon as UsersIcon,
  ChevronDownIcon,
  PlayCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Dummy component to avoid missing import errors
const DocumentTextIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          setCourse(null);
        }
      } catch (error) {
        console.error("Error fetching course:", error);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleEnrollClick = () => {
    if (!currentUser) {
      toast('Please login to enroll in this course', { icon: '👋' });
      navigate('/login', { state: { from: `/courses/${id}/enroll` } });
      return;
    }
    navigate(`/courses/${id}/enroll`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 animate-pulse">
          <div className="h-[400px] bg-gray-200 rounded-3xl mb-8 w-full"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-64 bg-gray-200 rounded-3xl w-full mt-8"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-[500px] bg-gray-200 rounded-3xl w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col text-center px-4">
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Course Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md">The course you are looking for does not exist or has been removed.</p>
        <Link to="/courses" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
          Browse All Courses
        </Link>
      </div>
    );
  }

  const seatsLeft = course.maxStudents ? Math.max(0, course.maxStudents - (course.enrolledCount || 0)) : null;
  const seatsLeftPercentage = course.maxStudents ? (seatsLeft / course.maxStudents) * 100 : 100;
  const isSellingFast = seatsLeft !== null && seatsLeft <= 5;
  const modules = course.faqs && course.faqs.length > 0 ? course.faqs.map(f => ({ q: f.q || f.question, a: f.a || f.answer })) : [
    { q: "Introduction & Setup", a: "Learn the basics and set up your workspace." },
    { q: "Core Concepts", a: "Dive deep into the foundational theories and practical applications." },
    { q: "Advanced Techniques", a: "Master complex workflows and industry-standard practices." },
    { q: "Final Project", a: "Apply your knowledge to build a comprehensive real-world project." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Premium Hero Banner */}
      <div className="relative bg-[#0b1120] pt-28 pb-40 overflow-hidden">
        {course.bannerUrl && (
          <div className="absolute inset-0">
            <img src={course.bannerUrl} alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1120] via-[#0b1120]/80 to-transparent"></div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link to="/courses" className="hover:text-primary-400 transition-colors">Courses</Link>
              <span>/</span>
              <span className="text-gray-300">{course.category}</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                {course.category}
              </span>
              <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                {course.difficulty || course.difficultyLevel}
              </span>
              {course.featured && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                  <StarIconSolid className="w-3 h-3" /> Best Seller
                </span>
              )}
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-[1.1]"
            >
              {course.title}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl"
            >
              {course.shortDesc}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-6 text-sm text-gray-300"
            >
              <div className="flex items-center gap-2">
                <StarIconSolid className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">4.9</span>
                <span className="text-gray-400">(2.4k ratings)</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-gray-400" />
                <span>{course.enrolledCount || 0} students enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                <span>Taught by <strong className="text-white">{course.instructorName || 'Industry Experts'}</strong></span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column (Content) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Quick Stats Bar */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 flex flex-wrap gap-8 justify-between items-center backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-3 rounded-xl text-primary-600">
                  <VideoCameraIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Format</p>
                  <p className="font-bold text-gray-900">{course.isOnline ? '100% Online' : 'In-Person / Hybrid'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Duration</p>
                  <p className="font-bold text-gray-900">{course.duration || 'Flexible Schedule'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-3 rounded-xl text-green-600">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Certificate</p>
                  <p className="font-bold text-gray-900">{course.certificateAvailable ? 'Shareable Certificate' : 'Completion Badge'}</p>
                </div>
              </div>
            </div>

            {/* What you'll learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Description */}
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">About this course</h2>
              <div className="prose prose-lg prose-orange max-w-none text-gray-600">
                <p className="whitespace-pre-wrap">{course.longDesc || course.shortDesc}</p>
              </div>
            </div>

            {/* Syllabus / Modules (Coursera Style) */}
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Syllabus</h2>
              <div className="space-y-4">
                {modules.map((module, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-gray-300">
                    <button
                      onClick={() => setActiveModule(activeModule === idx ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between bg-white text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold font-display">
                          {idx + 1}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{module.q}</h3>
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${activeModule === idx ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {activeModule === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-2 pl-20 text-gray-600 border-t border-gray-100">
                            <p className="mb-4">{module.a}</p>
                            <div className="flex items-center gap-6 text-sm font-medium">
                              <span className="flex items-center gap-1.5"><PlayCircleIcon className="w-5 h-5 text-primary-500" /> 3 videos</span>
                              <span className="flex items-center gap-1.5"><DocumentTextIcon className="w-5 h-5 text-primary-500" /> 1 reading</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Profile */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Instructor</h2>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {course.instructorImageUrl ? (
                  <img src={course.instructorImageUrl} alt={course.instructorName} className="w-24 h-24 rounded-full object-cover shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-3xl font-bold font-display shadow-md">
                    {course.instructorName ? course.instructorName.charAt(0) : 'I'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{course.instructorName || 'Expert Instructor'}</h3>
                  <p className="text-primary-600 font-medium mb-4">Senior 3D Design Professional at Aira3D</p>
                  <p className="text-gray-600 leading-relaxed">
                    {course.instructorBio || `${course.instructorName || 'Our expert'} has over 10 years of experience in the 3D printing and design industry, working with top manufacturing firms and creative agencies across the globe. They are passionate about sharing their knowledge and helping the next generation of designers master the craft.`}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Sticky Sidebar) */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col">
                
                {/* Video Preview Area */}
                <div className="relative aspect-video bg-gray-900 group cursor-pointer overflow-hidden">
                  <img 
                    src={course.thumbnailUrl || course.bannerUrl} 
                    alt="Course Preview" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/40 shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <PlayCircleIcon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white font-medium text-sm drop-shadow-md">
                    Preview this course
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-6">
                    {course.discountPrice ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-display font-bold text-gray-900">
                          {formatPrice(course.discountPrice)}
                        </span>
                        <span className="text-lg text-gray-400 line-through font-medium">
                          {formatPrice(course.price)}
                        </span>
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                          Save {Math.round((1 - course.discountPrice / course.price) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-display font-bold text-gray-900">
                        {course.price > 0 ? formatPrice(course.price) : 'Free'}
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={handleEnrollClick}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/40 mb-4"
                  >
                    Enroll Now
                  </button>
                  <p className="text-center text-xs text-gray-500 mb-6">30-Day Money-Back Guarantee</p>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900">This course includes:</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-3">
                        <VideoCameraIcon className="w-5 h-5 text-gray-400" />
                        24 hours on-demand video
                      </li>
                      <li className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        12 downloadable resources
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                        Full lifetime access
                      </li>
                      <li className="flex items-center gap-3">
                        <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>

                  {course.maxStudents && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-600">Seats Available</span>
                        <span className="font-bold text-gray-900">{seatsLeft} / {course.maxStudents}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${isSellingFast ? 'bg-red-500' : 'bg-primary-500'}`}
                          style={{ width: `${100 - seatsLeftPercentage}%` }}
                        ></div>
                      </div>
                      {isSellingFast && (
                        <p className="text-red-500 text-xs font-bold mt-2 animate-pulse flex items-center justify-center gap-1">
                          <ClockIcon className="w-4 h-4" /> Selling fast! Only {seatsLeft} left.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
