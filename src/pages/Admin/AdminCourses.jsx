import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, DocumentDuplicateIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import CourseWizard from '../../components/Admin/CourseWizard';
import { getAllCourses, createCourse, updateCourse, deleteCourse, duplicateCourse, togglePublish } from '../../services/courseService';
import { COURSE_CATEGORIES } from '../../utils/courseConstants';
import { formatPrice } from '../../utils/formatHelpers';
import toast from 'react-hot-toast';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to fetch courses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = (course = null) => {
    setEditingCourse(course);
    setIsWizardOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseWizard = () => {
    setEditingCourse(null);
    setIsWizardOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
        toast.success('Course updated successfully');
      } else {
        await createCourse(formData);
        toast.success('Course created successfully');
      }
      handleCloseWizard();
      fetchCourses();
    } catch (error) {
      toast.error('Error saving course');
      console.error(error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id);
        toast.success('Course deleted');
        fetchCourses();
      } catch (error) {
        toast.error('Failed to delete course');
        console.error(error);
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateCourse(id);
      toast.success('Course duplicated');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to duplicate course');
      console.error(error);
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await togglePublish(id, currentStatus);
      toast.success(currentStatus === 'Draft' ? 'Course published' : 'Course unpublished');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || course.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || course.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const publishedCount = courses.filter(c => c.status === 'Published').length;
  const draftCount = courses.filter(c => c.status !== 'Published').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
          Course Management
        </h1>
        <Button onClick={() => handleOpenWizard()} variant="primary" className="flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Courses', value: courses.length },
          { label: 'Published', value: publishedCount },
          { label: 'Draft', value: draftCount },
          { label: 'Students Enrolled', value: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0) }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className="text-3xl font-display font-bold text-gray-900 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="All">All Categories</option>
          {COURSE_CATEGORIES?.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Course List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredCourses.map(course => (
                    <motion.tr 
                      key={course.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-16 bg-gray-200 rounded overflow-hidden">
                            {course.thumbnailUrl ? (
                              <img src={course.thumbnailUrl} alt="" className="h-12 w-16 object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">No Img</div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{course.shortDesc}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{course.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={course.status === 'Published' ? 'success' : 'warning'}>
                          {course.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice ? formatPrice(course.price || 0) : `$${course.price || 0}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleTogglePublish(course.id, course.status)} className="text-gray-400 hover:text-orange-500" title={course.status === 'Published' ? 'Unpublish' : 'Publish'}>
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleOpenWizard(course)} className="text-gray-400 hover:text-blue-500" title="Edit">
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDuplicate(course.id)} className="text-gray-400 hover:text-green-500" title="Duplicate">
                            <DocumentDuplicateIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="text-gray-400 hover:text-red-500" title="Delete">
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isWizardOpen && (
          <CourseWizard
            course={editingCourse}
            onClose={handleCloseWizard}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCourses;
