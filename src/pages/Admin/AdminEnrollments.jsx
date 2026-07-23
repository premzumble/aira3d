import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getAllEnrollments, updateEnrollmentStatus } from '../../services/enrollmentService';
import { getAllCourses } from '../../services/courseService';
import { exportEnrollmentsToExcel, exportEnrollmentsToCSV } from '../../utils/enrollmentExport';
import { formatDate, formatPrice } from '../../utils/formatHelpers';
import toast from 'react-hot-toast';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollData, coursesData] = await Promise.all([
        getAllEnrollments(),
        getAllCourses()
      ]);
      setEnrollments(enrollData);
      setCourses(coursesData);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
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

  const filteredEnrollments = enrollments.filter(enrollment => {
    const searchString = `${enrollment.studentName} ${enrollment.email}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || enrollment.status === statusFilter;
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
    .filter(e => e.status?.toLowerCase() === 'confirmed')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
          Enrollment Management
        </h1>
        <div className="flex space-x-2">
          <Button onClick={() => exportEnrollmentsToCSV(filteredEnrollments)} variant="secondary" className="flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> CSV
          </Button>
          <Button onClick={() => exportEnrollmentsToExcel(filteredEnrollments)} variant="secondary" className="flex items-center gap-2">
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
          <p className="text-3xl font-display font-bold text-gray-900 mt-2">{enrollments.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Confirmed</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-2">
            {enrollments.filter(e => e.status?.toLowerCase() === 'confirmed').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Pending</p>
          <p className="text-3xl font-display font-bold text-orange-500 mt-2">
            {enrollments.filter(e => e.status?.toLowerCase() === 'pending').length}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500 font-medium">Revenue (Confirmed)</p>
          <p className="text-3xl font-display font-bold text-blue-600 mt-2">
            {formatPrice ? formatPrice(totalRevenue) : `$${totalRevenue}`}
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
                        <div className="text-sm font-medium text-gray-900">{enroll.studentName}</div>
                        <div className="text-sm text-gray-500">{enroll.email}</div>
                        <div className="text-xs text-gray-400">{enroll.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-[200px] truncate" title={enroll.courseTitle}>
                          {enroll.courseTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate ? formatDate(enroll.createdAt) : new Date(enroll.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice ? formatPrice(enroll.amount) : `$${enroll.amount}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(enroll.status)}>
                          {enroll.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <select 
                            value={enroll.status || 'Pending'}
                            onChange={(e) => handleUpdateStatus(enroll.id, e.target.value)}
                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <button onClick={() => setSelectedEnrollment(enroll)} className="text-gray-400 hover:text-blue-500">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-xl font-display font-bold mb-4">Enrollment Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-medium">{selectedEnrollment.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedEnrollment.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium">{selectedEnrollment.courseTitle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium font-mono text-sm">{selectedEnrollment.transactionId || 'N/A'}</p>
              </div>
              {/* Add more details as needed */}
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
