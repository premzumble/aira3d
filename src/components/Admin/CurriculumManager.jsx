import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderPlusIcon,
  DocumentDuplicateIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LessonModal from './LessonModal';
import { 
  getCourseModules, 
  createModule, 
  updateModule, 
  deleteModule,
  getCourseLessons, 
  createLesson, 
  updateLesson, 
  deleteLesson,
  reorderLessonsBatch,
  getGoogleDrivePreviewUrl
} from '../../services/curriculumService';
import toast from 'react-hot-toast';

export default function CurriculumManager({ courseId, courseTitle }) {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleForNewLesson, setSelectedModuleForNewLesson] = useState(null);

  // New module input state
  const [showNewModuleInput, setShowNewModuleInput] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');

  // Preview modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadCurriculum();
    }
  }, [courseId]);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const [fetchedModules, fetchedLessons] = await Promise.all([
        getCourseModules(courseId),
        getCourseLessons(courseId)
      ]);

      // If course has no modules yet, create a default one
      if (fetchedModules.length === 0) {
        const defaultMod = await createModule(courseId, { title: 'Module 1: Introduction & Fundamentals', order: 1 });
        setModules([defaultMod]);
      } else {
        setModules(fetchedModules);
      }

      setLessons(fetchedLessons);
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  // Module Actions
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      const order = modules.length + 1;
      const created = await createModule(courseId, { title: newModuleTitle.trim(), order });
      setModules(prev => [...prev, created]);
      setNewModuleTitle('');
      setShowNewModuleInput(false);
      toast.success('Module created');
    } catch (error) {
      toast.error('Failed to create module');
    }
  };

  const handleUpdateModule = async (moduleId) => {
    if (!editingModuleTitle.trim()) return;
    try {
      await updateModule(courseId, moduleId, { title: editingModuleTitle.trim() });
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, title: editingModuleTitle.trim() } : m));
      setEditingModuleId(null);
      toast.success('Module title updated');
    } catch (error) {
      toast.error('Failed to update module');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const attachedLessons = lessons.filter(l => l.moduleId === moduleId);
    const confirmMessage = attachedLessons.length > 0 
      ? `This module contains ${attachedLessons.length} lessons. Deleting the module will delete its attached lessons. Continue?`
      : 'Are you sure you want to delete this module?';

    if (window.confirm(confirmMessage)) {
      try {
        await deleteModule(courseId, moduleId);
        // Delete attached lessons as well
        for (const les of attachedLessons) {
          await deleteLesson(courseId, les.id);
        }
        setModules(prev => prev.filter(m => m.id !== moduleId));
        setLessons(prev => prev.filter(l => l.moduleId !== moduleId));
        toast.success('Module deleted');
      } catch (error) {
        toast.error('Failed to delete module');
      }
    }
  };

  // Lesson Actions
  const handleOpenAddLesson = (moduleId) => {
    setEditingLesson(null);
    setSelectedModuleForNewLesson(moduleId);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleForNewLesson(lesson.moduleId);
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (lessonFormData) => {
    try {
      if (editingLesson) {
        const updated = await updateLesson(courseId, editingLesson.id, lessonFormData);
        setLessons(prev => prev.map(l => l.id === editingLesson.id ? { ...l, ...updated } : l));
        toast.success('Lesson updated');
      } else {
        const moduleLessons = lessons.filter(l => l.moduleId === lessonFormData.moduleId);
        const order = moduleLessons.length + 1;
        const created = await createLesson(courseId, { ...lessonFormData, order });
        setLessons(prev => [...prev, created]);
        toast.success('Lesson added');
      }
      setIsLessonModalOpen(false);
      setEditingLesson(null);
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson? (Note: The course and student enrollments will NOT be affected.)')) {
      try {
        await deleteLesson(courseId, lessonId);
        setLessons(prev => prev.filter(l => l.id !== lessonId));
        toast.success('Lesson deleted');
      } catch (error) {
        toast.error('Failed to delete lesson');
      }
    }
  };

  const handleTogglePublishLesson = async (lesson) => {
    try {
      const updatedStatus = !lesson.isPublished;
      await updateLesson(courseId, lesson.id, { isPublished: updatedStatus });
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, isPublished: updatedStatus } : l));
      toast.success(updatedStatus ? 'Lesson published' : 'Lesson set to draft');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleMoveLessonOrder = async (lesson, direction, moduleLessons) => {
    const currentIndex = moduleLessons.findIndex(l => l.id === lesson.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= moduleLessons.length) return;

    const swapped = [...moduleLessons];
    const temp = swapped[currentIndex];
    swapped[currentIndex] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    // Update orders sequentially
    const updatedWithOrder = swapped.map((item, idx) => ({ ...item, order: idx + 1 }));

    try {
      await reorderLessonsBatch(courseId, updatedWithOrder);
      setLessons(prev => {
        const otherLessons = prev.filter(l => l.moduleId !== lesson.moduleId);
        return [...otherLessons, ...updatedWithOrder];
      });
      toast.success('Lesson reordered');
    } catch (error) {
      toast.error('Failed to reorder lessons');
    }
  };

  // Preview video
  const handlePreviewVideo = (lesson) => {
    if (lesson.driveFileId) {
      setPreviewVideoUrl(getGoogleDrivePreviewUrl(lesson.driveFileId));
    } else if (lesson.directVideoUrl) {
      setPreviewVideoUrl(lesson.directVideoUrl);
    } else {
      toast.error('No video URL configured for this lesson');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-500">Loading course curriculum...</p>
      </div>
    );
  }

  const totalLessons = lessons.length;
  const publishedLessons = lessons.filter(l => l.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold text-gray-900">Course Curriculum</h2>
            <Badge variant="primary" size="sm">{modules.length} Modules</Badge>
            <Badge variant="success" size="sm">{publishedLessons}/{totalLessons} Published</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Organize modules, add Google Drive video lessons, reorder lectures, and set free previews.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowNewModuleInput(true)}
          className="flex items-center gap-1.5 shadow-sm"
        >
          <FolderPlusIcon className="w-4 h-4" /> Add Module
        </Button>
      </div>

      {/* New Module Input Row */}
      {showNewModuleInput && (
        <form onSubmit={handleCreateModule} className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl flex gap-3 items-center">
          <input
            type="text"
            placeholder="New Module Title (e.g. Module 2: Advanced Slicing Techniques)"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            autoFocus
            className="flex-1 px-4 py-2.5 rounded-xl border border-orange-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium bg-white"
          />
          <Button type="submit" variant="primary" size="sm">Create Module</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowNewModuleInput(false)}>Cancel</Button>
        </form>
      )}

      {/* Module List */}
      <div className="space-y-6">
        {modules.map((mod, modIdx) => {
          const moduleLessons = lessons
            .filter(l => l.moduleId === mod.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div key={mod.id} className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="p-5 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <span className="w-7 h-7 rounded-xl bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {modIdx + 1}
                  </span>

                  {editingModuleId === mod.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingModuleTitle}
                        onChange={(e) => setEditingModuleTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateModule(mod.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingModuleId(null)}
                        className="px-2 py-1.5 text-gray-500 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-display font-bold text-gray-900 text-base">{mod.title}</h3>
                      <span className="text-[11px] text-gray-500">
                        {moduleLessons.length} {moduleLessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModuleId(mod.id);
                      setEditingModuleTitle(mod.title);
                    }}
                    title="Rename Module"
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteModule(mod.id)}
                    title="Delete Module"
                    className="p-1.5 text-red-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenAddLesson(mod.id)}
                    className="ml-2 text-xs py-1.5 px-3"
                  >
                    <PlusIcon className="w-3.5 h-3.5 mr-1" /> Add Lesson
                  </Button>
                </div>
              </div>

              {/* Module Lessons */}
              {moduleLessons.length === 0 ? (
                <div className="p-8 text-center bg-gray-50/20">
                  <VideoCameraIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-3">No video lessons added to this module yet.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAddLesson(mod.id)}
                  >
                    Add Lesson to {mod.title}
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {moduleLessons.map((les, lesIdx) => (
                    <div 
                      key={les.id} 
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors ${
                        !les.isPublished ? 'opacity-60 bg-gray-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {/* Reorder Arrows */}
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          <button
                            type="button"
                            disabled={lesIdx === 0}
                            onClick={() => handleMoveLessonOrder(les, 'up', moduleLessons)}
                            className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ChevronUpIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={lesIdx === moduleLessons.length - 1}
                            onClick={() => handleMoveLessonOrder(les, 'down', moduleLessons)}
                            className="p-1 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Lesson Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-gray-400">#{lesIdx + 1}</span>
                            <h4 className="font-bold text-gray-900 text-sm">{les.title}</h4>
                            
                            {les.duration && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-600">
                                {les.duration}
                              </span>
                            )}

                            {les.isFreePreview && (
                              <Badge variant="info" size="sm">Free Preview</Badge>
                            )}

                            {les.protectionLevel === 'enhanced' && (
                              <Badge variant="warning" size="sm">Watermarked</Badge>
                            )}

                            {!les.isPublished && (
                              <Badge variant="danger" size="sm">Draft</Badge>
                            )}
                          </div>

                          {les.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{les.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handlePreviewVideo(les)}
                          title="Preview Video"
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                          <PlayCircleIcon className="w-5 h-5" />
                          <span className="hidden md:inline">Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePublishLesson(les)}
                          title={les.isPublished ? "Set to Draft" : "Publish"}
                          className={`p-2 rounded-xl transition-colors ${
                            les.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {les.isPublished ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditLesson(les)}
                          title="Edit Lesson"
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(les.id)}
                          title="Delete Lesson"
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lesson Add/Edit Modal */}
      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setEditingLesson(null);
        }}
        onSave={handleSaveLesson}
        lesson={editingLesson}
        modules={modules}
        defaultModuleId={selectedModuleForNewLesson}
      />

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
              <span className="font-bold text-sm">Admin Video Preview</span>
              <button onClick={() => setPreviewVideoUrl(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={previewVideoUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                title="Admin Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
