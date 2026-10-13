import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getAllEnrollments, updateEnrollmentStatus } from '../../services/enrollmentService';
import { getAllCourses } from '../../services/courseService';
import { exportEnrollmentsToExcel, exportEnrollmentsToCSV } from '../../utils/enrollmentExport';
import { formatPrice } from '../../utils/formatHelpers';
import toast from 'react-hot-toast';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [fetchError, setFetchError] = useState(null);
  
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Fetch enrollments and courses independently so one failure doesn't block the other
      let enrollData = [];
      let coursesData = [];

      try {
        enrollData = await getAllEnrollments();
      } catch (enrollError) {
        console.error('[AdminEnrollments] Failed to fetch enrollments:', enrollError.code, enrollError.message);
        
        if (enrollError.code === 'permission-denied') {
          setFetchError('Permission denied: You must be logged in as an admin via Firebase Auth to view enrollments. Please log out and log back in.');
        } else {
          setFetchError(`Failed to fetch enrollments: ${enrollError.message}`);
        }
        // Don't throw — still try to load courses
      }

      try {
        coursesData = await getAllCourses();
      } catch (courseError) {
        console.error('[AdminEnrollments] Failed to fetch courses:', courseError.code, courseError.message);
        // Courses failing is less critical, enrollments can still display
      }

      const courseMap = {};
      coursesData.forEach(c => courseMap[c.id] = c);

      const enrichedEnrollments = enrollData.map(enroll => {
        const course = courseMap[enroll.courseId];
        let computedStatus = 'Upcoming';
        if (course && course.startDate && course.endDate) {
            const today = new Date();
            const start = new Date(course.startDate);
            const end = new Date(course.endDate);
            today.setHours(0,0,0,0);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            if (today < start) computedStatus = 'Upcoming';
            else if (today >= start && today <= end) computedStatus = 'Ongoing';
            else if (today > end) computedStatus = 'Completed';
        }
        return { ...enroll, computedStatus };
      });

      setEnrollments(enrichedEnrollments);
      setCourses(coursesData);
    } catch (error) {
      console.error('[AdminEnrollments] Unexpected error in fetchData:', error);
      setFetchError(`Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateEnrollmentStatus(id, newStatus);
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  // Helper to get the enrollment status from whichever field is present
  const getEnrollStatus = (enrollment) => {
    return enrollment.enrollmentStatus || enrollment.status || 'Pending';
  };

  // Helper to get the student display name from whichever field is present
  const getStudentName = (enrollment) => {
    return enrollment.fullName || enrollment.studentName || enrollment.name || 'Unknown';
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const studentName = getStudentName(enrollment);
    const searchString = `${studentName} ${enrollment.email || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const enrollStatus = getEnrollStatus(enrollment);
    const matchesStatus = statusFilter === 'All' || enrollStatus === statusFilter;
    const matchesCourse = courseFilter === 'All' || enrollment.courseId === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  const totalRevenue = enrollments
    .filter(e => getEnrollStatus(e).toLowerCase() === 'confirmed')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Format a Firestore timestamp or date string for display
  const formatEnrollDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('en-IN');
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN');
    }
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
          Enrollment Management
        </h1>
        <div className="flex space-x-2">
          <Button onClick={() => {
            const courseTitle = courseFilter === 'All' ? 'All_Courses' : courses.find(c => c.id === courseFilter)?.title;
            exportEnrollmentsToCSV(filteredEnrollments, courseTitle);
          }} variant="secondary" className="flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> CSV
          </Button>
          <Button onClick={() => {
            const courseTitle = courseFilter === 'All' ? 'All_Courses' : courses.find(c => c.id === courseFilter)?.title;
            exportEnrollmentsToExcel(filteredEnrollments, courseTitle);
          }} variant="secondary" className="flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <p className="font-semibold mb-1">Error Loading Enrollments</p>
          <p>{fetchError}</p>
          <button onClick={fetchData} className="mt-2 text-red-600 underline font-medium hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
          <p className="text-3xl font-display font-bold text-gray-900 mt-2">{enrollments.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Confirmed</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-2">
            {enrollments.filter(e => getEnrollStatus(e).toLowerCase() === 'confirmed').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Pending</p>
          <p className="text-3xl font-display font-bold text-orange-500 mt-2">
            {enrollments.filter(e => getEnrollStatus(e).toLowerCase() === 'pending').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Revenue (Confirmed)</p>
          <p className="text-3xl font-display font-bold text-blue-600 mt-2">
            {formatPrice(Number(totalRevenue) || 0)}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="All">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading enrollments...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No enrollments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Course Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredEnrollments.map(enroll => (
                    <motion.tr 
                      key={enroll.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{getStudentName(enroll)}</div>
                        <div className="text-sm text-gray-500">{enroll.email}</div>
                        <div className="text-xs text-gray-400">{enroll.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate" title={enroll.courseTitle}>
                          {enroll.courseTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatEnrollDate(enroll.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(Number(enroll.amount) || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(getEnrollStatus(enroll))}>
                          {getEnrollStatus(enroll)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                          enroll.computedStatus === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                          enroll.computedStatus === 'Ongoing' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {enroll.computedStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <select 
                            value={getEnrollStatus(enroll)}
                            onChange={(e) => handleUpdateStatus(enroll.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button onClick={() => setSelectedEnrollment(enroll)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                             <EyeIcon className="w-5 h-5" />
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

      {/* Details Modal */}
      {selectedEnrollment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-display font-bold mb-4">Enrollment Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-medium">{getStudentName(selectedEnrollment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedEnrollment.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{selectedEnrollment.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium">{selectedEnrollment.courseTitle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="font-medium">{formatPrice(Number(selectedEnrollment.amount) || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="font-medium">{selectedEnrollment.paymentStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enrollment Status</p>
                <p className="font-medium">{getEnrollStatus(selectedEnrollment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment ID</p>
                <p className="font-medium font-mono text-sm">{selectedEnrollment.paymentId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Enrollment Date</p>
                <p className="font-medium">{formatEnrollDate(selectedEnrollment.createdAt)}</p>
              </div>
              {selectedEnrollment.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedEnrollment.address}, {selectedEnrollment.city}, {selectedEnrollment.state} - {selectedEnrollment.pincode}</p>
                </div>
              )}
              {selectedEnrollment.profession && (
                <div>
                  <p className="text-sm text-gray-500">Profession</p>
                  <p className="font-medium">{selectedEnrollment.profession}</p>
                </div>
              )}
              {selectedEnrollment.qualification && (
                <div>
                  <p className="text-sm text-gray-500">Qualification</p>
                  <p className="font-medium">{selectedEnrollment.qualification}</p>
                </div>
              )}
              {selectedEnrollment.college && (
                <div>
                  <p className="text-sm text-gray-500">College/University</p>
                  <p className="font-medium">{selectedEnrollment.college}</p>
                </div>
              )}
              {selectedEnrollment.experienceLevel && (
                <div>
                  <p className="text-sm text-gray-500">Experience Level</p>
                  <p className="font-medium">{selectedEnrollment.experienceLevel}</p>
                </div>
              )}
              {selectedEnrollment.specialNotes && (
                <div>
                  <p className="text-sm text-gray-500">Special Notes</p>
                  <p className="font-medium">{selectedEnrollment.specialNotes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Enrollment ID</p>
                <p className="font-medium font-mono text-xs text-gray-600">{selectedEnrollment.id}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedEnrollment(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
