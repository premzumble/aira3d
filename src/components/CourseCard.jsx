import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatPrice } from '../utils/formatHelpers.js';
import { ClockIcon, UsersIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

const CourseCard = ({ course, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col h-full z-10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {course.thumbnailUrl || course.bannerUrl ? (
          <img
            src={course.thumbnailUrl || course.bannerUrl}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-display text-2xl font-bold p-6 text-center shadow-inner group-hover:scale-105 transition-transform duration-700">
            {course.title}
          </div>
        )}
        
        {/* Glass Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
          <Link to={`/courses/${course.id}`} className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-lg">
            <PlayCircleIcon className="w-8 h-8" />
          </Link>
        </div>

        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
          {course.featured && (
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md backdrop-blur-md">
              Featured
            </span>
          )}
          {course.badges && course.badges.map((badge, idx) => (
            <span key={idx} className="bg-white/90 backdrop-blur-md text-primary-700 border border-primary-100 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              {badge}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col z-20 bg-transparent">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {course.category}
          </span>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
            {course.difficulty || course.difficultyLevel}
          </span>
        </div>
        
        <Link to={`/courses/${course.id}`} className="group-hover:text-primary-600 transition-colors duration-300">
          <h3 className="font-display font-bold text-xl line-clamp-2 mb-3 text-gray-900 leading-tight">
            {course.title}
          </h3>
        </Link>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
          {course.shortDesc}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-medium border-b border-gray-100 pb-6">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span>{course.duration || 'Flexible'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UsersIcon className="w-5 h-5 text-gray-400" />
            <span>{course.enrolledCount || 0} enrolled</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {course.discountPrice ? (
              <>
                <span className="text-gray-400 line-through text-sm font-medium">
                  {formatPrice(course.price)}
                </span>
                <span className="text-2xl font-display font-bold text-gray-900">
                  {formatPrice(course.discountPrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-display font-bold text-gray-900">
                {course.price > 0 ? formatPrice(course.price) : 'Free'}
              </span>
            )}
          </div>
          <Link 
            to={`/courses/${course.id}`}
            className="text-primary-600 font-semibold hover:text-primary-700 transition-colors flex items-center gap-1 group-hover:gap-2"
          >
            Explore <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
