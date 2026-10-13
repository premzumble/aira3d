import * as XLSX from 'xlsx';

// Helper to format Firestore timestamps for export
const formatExportDate = (timestamp) => {
  if (!timestamp) return '';
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString('en-IN');
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN');
  }
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

// Helper to get student name from whichever field exists
const getName = (enrollment) => {
  return enrollment.fullName || enrollment.studentName || enrollment.name || '';
};

// Helper to get enrollment status from whichever field exists
const getStatus = (enrollment) => {
  return enrollment.enrollmentStatus || enrollment.status || '';
};

export const exportEnrollmentsToExcel = (enrollments, courseTitle) => {
  if (!enrollments || enrollments.length === 0) return;

  const data = enrollments.map(enrollment => ({
    'Name': getName(enrollment),
    'Email': enrollment.email || '',
    'Phone': enrollment.phone || '',
    'Course': enrollment.courseTitle || courseTitle || '',
    'Amount': enrollment.amount || '',
    'Payment Status': enrollment.paymentStatus || '',
    'Enrollment Status': getStatus(enrollment),
    'Enrollment Date': formatExportDate(enrollment.createdAt),
    'City': enrollment.city || '',
    'State': enrollment.state || '',
    'Address': enrollment.address || '',
    'Pincode': enrollment.pincode || '',
    'Country': enrollment.country || '',
    'Gender': enrollment.gender || '',
    'Qualification': enrollment.qualification || '',
    'Profession': enrollment.profession || '',
    'College': enrollment.college || '',
    'Company': enrollment.company || '',
    'Experience Level': enrollment.experienceLevel || '',
    'How Heard': enrollment.howHeardAboutUs || '',
    'Special Notes': enrollment.specialNotes || '',
    'Enrollment ID': enrollment.id || '',
    'Payment ID': enrollment.paymentId || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollments');

  const date = new Date().toISOString().split('T')[0];
  const fileName = `Aira3D_Enrollments_${courseTitle || 'All'}_${date}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};

const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  str = str.replace(/"/g, '""');
  str = str.replace(/\r?\n|\r/g, ' ');
  return str.trim();
};

export const exportEnrollmentsToCSV = (enrollments, courseTitle) => {
  if (!enrollments || enrollments.length === 0) return;
  
  const headers = [
    'Name', 'Email', 'Phone', 'Course', 'Amount', 'Payment Status', 'Enrollment Status',
    'Enrollment Date', 'City', 'State', 'Address', 'Pincode', 'Country', 'Gender',
    'Qualification', 'Profession', 'College', 'Company', 'Experience Level',
    'How Heard', 'Special Notes', 'Enrollment ID', 'Payment ID'
  ];
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const enrollment of enrollments) {
    const values = [
      escapeCSV(getName(enrollment)),
      escapeCSV(enrollment.email),
      escapeCSV(enrollment.phone),
      escapeCSV(enrollment.courseTitle || courseTitle),
      escapeCSV(enrollment.amount),
      escapeCSV(enrollment.paymentStatus),
      escapeCSV(getStatus(enrollment)),
      escapeCSV(formatExportDate(enrollment.createdAt)),
      escapeCSV(enrollment.city),
      escapeCSV(enrollment.state),
      escapeCSV(enrollment.address),
      escapeCSV(enrollment.pincode),
      escapeCSV(enrollment.country),
      escapeCSV(enrollment.gender),
      escapeCSV(enrollment.qualification),
      escapeCSV(enrollment.profession),
      escapeCSV(enrollment.college),
      escapeCSV(enrollment.company),
      escapeCSV(enrollment.experienceLevel),
      escapeCSV(enrollment.howHeardAboutUs),
      escapeCSV(enrollment.specialNotes),
      escapeCSV(enrollment.id),
      escapeCSV(enrollment.paymentId)
    ];
    
    csvRows.push(values.map(v => `"${v}"`).join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  const date = new Date().toISOString().split('T')[0];
  const fileName = `Aira3D_Enrollments_${courseTitle || 'All'}_${date}.csv`;
  
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
