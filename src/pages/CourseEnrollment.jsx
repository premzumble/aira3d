import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import app from '../firebase/index.js';
import { formatPrice } from '../utils/formatHelpers.js';
import toast from 'react-hot-toast';
import WhatsAppSuccessModal from '../components/WhatsAppSuccessModal.jsx';
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];
const HEAR_ABOUT_US = ["Social Media", "Friend/Colleague", "Search Engine", "Advertisement", "Other"];
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CourseEnrollment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    altPhone: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    college: '',
    company: '',
    profession: '',
    qualification: '',
    experienceLevel: '',
    howHeardAboutUs: '',
    specialNotes: '',
    termsAccepted: false,
    privacyAccepted: false
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/courses/${id}/enroll` } });
      return;
    }

    const fetchCourse = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'courses', id));
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
          navigate('/courses');
        }
      } catch (error) {
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.fullName || !formData.email || !formData.phone)) {
      return toast.error("Please fill all required personal details");
    }
    if (step === 2 && (!formData.address || !formData.city || !formData.state || !formData.pincode)) {
      return toast.error("Please fill all required address details");
    }
    if (step === 4 && (!formData.termsAccepted || !formData.privacyAccepted)) {
      return toast.error("Please accept the terms and privacy policy");
    }
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const enrollData = {
        userId: currentUser.uid,
        courseId: id,
        courseTitle: course.title,
        amount: course.price,
        enrollmentStatus: 'Pending',
        paymentStatus: 'Pending',
        createdAt: serverTimestamp(),
        ...formData
      };
      
      const enrollRef = await addDoc(collection(db, 'enrollments'), enrollData);
      const enrollmentId = enrollRef.id;

      const orderData = await apiService.createRazorpayOrder({ amount: course.price, receipt: enrollmentId });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aira3D",
        description: `Enrollment for ${course.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyData = await apiService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              enrollmentId: enrollmentId,
              courseId: id
            });

            if (verifyData.success) {
              setEnrollmentData({ id: enrollmentId, ...formData });
              setShowSuccessModal(true);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error(error);
            toast.error(error.message || 'Payment verification failed');
            await updateDoc(doc(db, 'enrollments', enrollmentId), { paymentStatus: 'Failed' });
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: "#f97316" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        toast.error("Payment failed or cancelled");
        await updateDoc(doc(db, 'enrollments', enrollmentId), { paymentStatus: 'Failed' });
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong during checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const steps = [
    { num: 1, title: 'Personal Info' },
    { num: 2, title: 'Address' },
    { num: 3, title: 'Professional' },
    { num: 4, title: 'Additional' },
    { num: 5, title: 'Payment' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Complete Enrollment</h1>
          <p className="text-gray-500">You are enrolling in: <span className="font-semibold text-primary-600">{course.title}</span></p>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 rounded-full -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 4) * 100}%` }}></div>
            
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 ${
                  step >= s.num ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step > s.num ? <CheckIcon className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 border-b border-gray-100 pb-4">Personal Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" name="email" value={formData.email} disabled className="w-full bg-gray-100 text-gray-500 border border-gray-200 rounded-xl px-4 py-3 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                      <input type="tel" name="altPhone" value={formData.altPhone} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 border-b border-gray-100 pb-4">Address Details</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} rows="3" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode / Zip *</label>
                        <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 border-b border-gray-100 pb-4">Professional Background</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Profession *</label>
                      <input type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="e.g. Student, Engineer, Designer" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                      <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">College/University</label>
                      <input type="text" name="college" value={formData.college} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company (If applicable)</label>
                      <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience with 3D/CAD/Printing</label>
                      <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="">Select Level</option>
                        {EXPERIENCE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 border-b border-gray-100 pb-4">Additional Information</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                      <select name="howHeardAboutUs" value={formData.howHeardAboutUs} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none">
                        <option value="">Select Option</option>
                        {HEAR_ABOUT_US.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Any special requirements or notes?</label>
                      <textarea name="specialNotes" value={formData.specialNotes} onChange={handleChange} rows="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none" />
                    </div>

                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                        <span className="text-sm text-gray-600">I agree to the <a href="#" className="text-primary-600 font-medium hover:underline">Terms & Conditions</a> of enrollment and course participation. *</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" name="privacyAccepted" checked={formData.privacyAccepted} onChange={handleChange} className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                        <span className="text-sm text-gray-600">I agree to the <a href="#" className="text-primary-600 font-medium hover:underline">Privacy Policy</a> and consent to being contacted regarding this course. *</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 border-b border-gray-100 pb-4">Order Summary</h2>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex gap-4 items-start border-b border-gray-200 pb-6 mb-6">
                      {course.thumbnailUrl && (
                        <img src={course.thumbnailUrl} alt="" className="w-24 h-24 object-cover rounded-xl shadow-sm" />
                      )}
                      <div>
                        <h3 className="font-display font-bold text-lg text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{course.category}</p>
                        <p className="text-primary-600 font-bold text-xl">{formatPrice(course.price)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Course Fee</span>
                        <span>{formatPrice(course.price)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Taxes & Fees</span>
                        <span className="text-green-600">Included</span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                        <span>Total to Pay</span>
                        <span>{formatPrice(course.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="flex items-center gap-2 font-medium mb-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Secure Payment
                    </p>
                    <p className="opacity-90">Payments are processed securely via Razorpay. We do not store your card details.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={prevStep} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 5 ? (
              <button onClick={nextStep} className="px-8 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2">
                Continue <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handlePayment} 
                disabled={isProcessing}
                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : `Pay ${formatPrice(course.price)}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <WhatsAppSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        enrollmentData={enrollmentData}
        courseData={course}
      />
    </div>
  );
};

export default CourseEnrollment;
