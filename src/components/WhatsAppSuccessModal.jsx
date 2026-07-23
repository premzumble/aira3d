import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const WhatsAppSuccessModal = ({ isOpen, onClose, enrollmentData, courseData }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    const phone = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919876543210';
    const message = encodeURIComponent(`Hello Aira3D Team,\n\nI have successfully enrolled.\n\nCourse: ${courseData?.title}\nStudent: ${enrollmentData?.fullName}\nPhone: ${enrollmentData?.phone}\nEmail: ${enrollmentData?.email}\nPayment Status: Paid\nEnrollment ID: ${enrollmentData?.id || enrollmentData?.enrollmentId}\n\nLooking forward to attending the course.\n\nThank you.`);
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleGoToCourses = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-green-50 -z-10"></div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircleIcon className="w-20 h-20 text-green-500" />
          </motion.div>

          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
            🎉 Enrollment Successful!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your seat has been successfully reserved for <span className="font-semibold text-gray-900">{courseData?.title}</span>.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-sm border border-gray-100">
            <p className="text-gray-500 mb-1">Enrollment ID</p>
            <p className="font-mono font-bold text-gray-900">{enrollmentData?.id || enrollmentData?.enrollmentId}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleWhatsApp}
              className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send WhatsApp Message
            </button>
            
            <button
              onClick={handleGoToCourses}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors"
            >
              Go to My Courses
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WhatsAppSuccessModal;
