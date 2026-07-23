import * as XLSX from 'xlsx';
import { formatDate } from './formatHelpers.js';

export const exportEnrollmentsToExcel = (enrollments, courseTitle) => {
  const data = enrollments.map(enrollment => ({
    'Name': enrollment.name || '',
    'Email': enrollment.email || '',
    'Phone': enrollment.phone || '',
    'Course': enrollment.course || courseTitle || '',
    'Amount': enrollment.amount || '',
    'Payment Status': enrollment.paymentStatus || '',
    'Enrollment Date': enrollment.createdAt ? formatDate(enrollment.createdAt) : '',
    'City': enrollment.city || '',
    'State': enrollment.state || '',
    'Address': enrollment.address || '',
    'Pincode': enrollment.pincode || '',
    'Qualification': enrollment.qualification || '',
    'Profession': enrollment.profession || '',
    'Experience': enrollment.experience || '',
    'How Heard': enrollment.howHeard || '',
    'Notes': enrollment.notes || '',
    'Enrollment ID': enrollment.id || '',
    'Payment ID': enrollment.paymentId || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollments');

  const date = new Date().toISOString().split('T')[0];
  const fileName = `Aira3D_Enrollments_${courseTitle}_${date}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

export const exportEnrollmentsToCSV = (enrollments, courseTitle) => {
  if (!enrollments || enrollments.length === 0) return;
  
  const headers = [
    'Name', 'Email', 'Phone', 'Course', 'Amount', 'Payment Status', 'Enrollment Date',
    'City', 'State', 'Address', 'Pincode', 'Qualification', 'Profession', 'Experience',
    'How Heard', 'Notes', 'Enrollment ID', 'Payment ID'
  ];
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const enrollment of enrollments) {
    const values = [
      enrollment.name || '',
      enrollment.email || '',
      enrollment.phone || '',
      enrollment.course || courseTitle || '',
      enrollment.amount || '',
      enrollment.paymentStatus || '',
      enrollment.createdAt ? formatDate(enrollment.createdAt) : '',
      enrollment.city || '',
      enrollment.state || '',
      enrollment.address ? enrollment.address.replace(/,/g, ' ') : '',
      enrollment.pincode || '',
      enrollment.qualification || '',
      enrollment.profession || '',
      enrollment.experience || '',
      enrollment.howHeard || '',
      enrollment.notes ? enrollment.notes.replace(/,/g, ' ') : '',
      enrollment.id || '',
      enrollment.paymentId || ''
    ];
    
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const date = new Date().toISOString().split('T')[0];
  const fileName = `Aira3D_Enrollments_${courseTitle}_${date}.csv`;
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
