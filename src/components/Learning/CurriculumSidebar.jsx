import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  PlayIcon, 
  LockClosedIcon,
  ClockIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

export default function CurriculumSidebar({ 
  modules = [], 
  lessons = [], 
  currentLesson, 
  onSelectLesson, 
  completedLessonIds = [],
  isEnrolled = false,
  isOpen = true,
  onClose
}) {
  const [expandedModules, setExpandedModules] = useState(() => {
    const map = {};
    modules.forEach(m => { map[m.id] = true; });
    return map;
  });

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const hasContent = modules.length > 0 && lessons.length > 0;

  return (
    <div className="h-full flex flex-col bg-[#1c1d1f] border-l border-[#2d2f31] text-[#d1d7dc] select-none">
      {/* Sidebar Header - Standard Udemy "Course content" Bar */}
      <div className="p-4 border-b border-[#3e4143] bg-[#2d2f31] flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-white text-sm sm:text-base tracking-tight">
            Course content
          </h3>
          <p className="text-xs text-[#9da3a8] mt-0.5 font-mono">
            {completedLessonIds.length} of {lessons.length} completed ({lessons.length > 0 ? Math.round((completedLessonIds.length / lessons.length) * 100) : 0}%)
          </p>
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 text-[#d1d7dc] hover:text-white rounded-xl hover:bg-[#3e4143] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modules List / Empty State */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#3e4143]/60 custom-scrollbar">
        {!hasContent ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 rounded-2xl bg-[#2d2f31] text-[#a435f0] flex items-center justify-center mb-3 ring-1 ring-[#3e4143]">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Curriculum In Preparation</h4>
            <p className="text-xs text-[#9da3a8] max-w-[220px] leading-relaxed">
              The instructor is organizing the lesson modules. Check back shortly!
            </p>
          </div>
        ) : (
          modules.map((mod, modIdx) => {
            const moduleLessons = lessons
              .filter(l => l.moduleId === mod.id && l.isPublished)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            const isExpanded = expandedModules[mod.id] !== false;
            const completedCount = moduleLessons.filter(l => completedLessonIds.includes(l.id)).length;

            return (
              <div key={mod.id} className="bg-[#1c1d1f]">
                {/* Module Accordion Header - Udemy Style Section Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="w-full p-4 flex items-center justify-between text-left bg-[#2d2f31] hover:bg-[#35373a] transition-colors group border-b border-[#3e4143]"
                >
                  <div className="flex-1 mr-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#a435f0] mb-0.5">
                      Section {modIdx + 1}
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm leading-snug group-hover:text-white transition-colors">
                      {mod.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9da3a8] font-mono">
                      <span>{moduleLessons.length} lectures</span>
                      <span>•</span>
                      <span className={completedCount === moduleLessons.length && moduleLessons.length > 0 ? "text-emerald-400 font-bold" : ""}>
                        {completedCount}/{moduleLessons.length} completed
                      </span>
                    </div>
                  </div>

                  <div className="text-[#9da3a8] group-hover:text-white transition-colors">
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Module Lessons List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[#1c1d1f] divide-y divide-[#2d2f31]"
                    >
                      {moduleLessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const isLocked = !isEnrolled && !lesson.isFreePreview;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            disabled={isLocked}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full p-3.5 pl-5 flex items-start gap-3 text-left transition-all relative ${
                              isCurrent 
                                ? 'bg-[#2d2f31] text-white font-bold border-l-4 border-[#a435f0]' 
                                : 'hover:bg-[#25272a] text-[#d1d7dc]'
                            } ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {/* Completion / Play Icon */}
                            <div className="pt-0.5 flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircleSolid className="w-4 h-4 text-emerald-400" />
                              ) : isCurrent ? (
                                <div className="w-4 h-4 rounded-full bg-[#a435f0] text-white flex items-center justify-center shadow-sm">
                                  <PlayIcon className="w-2.5 h-2.5 ml-0.5 fill-current" />
                                </div>
                              ) : isLocked ? (
                                <LockClosedIcon className="w-3.5 h-3.5 text-[#6a6f73]" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-[#6a6f73] mt-0.5" />
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs leading-relaxed truncate ${isCurrent ? 'font-bold text-white' : 'font-medium text-[#d1d7dc]'}`}>
                                {lesson.title}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                {lesson.duration && (
                                  <span className="flex items-center gap-1 text-[10px] text-[#9da3a8] font-mono">
                                    <ClockIcon className="w-3 h-3 text-[#6a6f73]" />
                                    {lesson.duration}
                                  </span>
                                )}

                                {lesson.isFreePreview && (
                                  <span className="px-1.5 py-0.5 bg-[#a435f0]/15 text-[#d8b4fe] border border-[#a435f0]/30 rounded text-[9px] font-bold">
                                    Free Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
