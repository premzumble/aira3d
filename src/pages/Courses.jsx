import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/index.js';
import CourseCard from '../components/CourseCard.jsx';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { COURSE_CATEGORIES, COURSE_DIFFICULTIES } from '../utils/courseConstants.js';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          where('status', '==', 'Published')
        );
        const snapshot = await getDocs(q);
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    let result = [...courses];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(lowerTerm) || 
        (c.shortDesc && c.shortDesc.toLowerCase().includes(lowerTerm)) ||
        (c.tags && c.tags.some(tag => tag.toLowerCase().includes(lowerTerm)))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    if (selectedDifficulty !== 'All') {
      result = result.filter(c => c.difficultyLevel === selectedDifficulty);
    }

    switch (sortBy) {
      case 'Price Low-High':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'Price High-Low':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'Popular':
        result.sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0));
        break;
      case 'Newest':
      default:
        result.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        break;
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedCategory, selectedDifficulty, sortBy, courses]);

  const featuredCourses = courses.filter(c => c.featured);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-gray-900 mix-blend-multiply" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6"
          >
            Learn with <span className="text-primary-500">Aira3D</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10"
          >
            Master 3D printing and design with our industry-leading courses. From beginners to advanced professionals.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto relative"
          >
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4" />
              <input
                type="text"
                placeholder="Search courses, skills, or software..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 backdrop-blur-sm transition-all"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full md:w-auto">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Filters:</span>
            </div>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 text-sm"
            >
              <option value="All">All Categories</option>
              {COURSE_CATEGORIES?.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select 
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 text-sm"
            >
              <option value="All">All Levels</option>
              {COURSE_DIFFICULTIES?.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-sm text-gray-500 font-medium">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-gray-900 font-semibold focus:ring-0 cursor-pointer p-0"
            >
              <option value="Newest">Newest</option>
              <option value="Popular">Popular</option>
              <option value="Price Low-High">Price: Low to High</option>
              <option value="Price High-Low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Featured Courses (if any and no filters active) */}
        {!searchTerm && selectedCategory === 'All' && featuredCourses.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Featured Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.slice(0, 3).map((course, index) => (
                <CourseCard key={`featured-${course.id}`} course={course} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* All Courses Grid */}
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            {searchTerm || selectedCategory !== 'All' ? 'Search Results' : 'All Courses'}
            <span className="text-gray-400 text-lg font-normal ml-2">({filteredCourses.length})</span>
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-96 border border-gray-100 flex flex-col">
                  <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-6 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    <div className="mt-auto h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-gray-100"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any courses matching your current filters. Try adjusting your search or category selection.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                }}
                className="mt-6 text-primary-600 font-semibold hover:text-primary-700"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Courses;
