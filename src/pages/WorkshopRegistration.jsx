import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import app, { db } from '../firebase';
import { apiService } from '../services/api';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function WorkshopRegistration() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (location.state) {
      setFormData(location.state);
    } else {
      navigate('/workshop');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createRazorpayOrder = async () => {
    try {
      const order = await apiService.createRazorpayOrder({
        amount: 99,
        currency: 'INR',
        receipt: `workshop_${Date.now()}`,
        notes: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          experience: formData.experience
        }
      });
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const initiatePayment = async () => {
    setPaymentLoading(true);
    try {
      const order = await createRazorpayOrder();
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourRazorpayKey',
        amount: 9900,
        currency: 'INR',
        name: '3D Printing Business Blueprint',
        description: 'Workshop Registration - ₹99',
        order_id: order.id,
        handler: async (response) => {
          await verifyPayment(response);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to initiate payment. Please try again.');
      console.error(error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    setLoading(true);
    try {
      const result = await apiService.verifyPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      if (result.success) {
        const registrationData = {
          ...formData,
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          status: 'confirmed',
          workshopDate: 'Every Sunday',
          workshopTime: '4:00 PM - 5:30 PM',
          amount: 99,
          currency: 'INR',
          registeredAt: serverTimestamp()
        };

        await addDoc(collection(db, 'workshop_registrations'), registrationData);
        
        // Add to Google Sheets
        try {
          await apiService.addToGoogleSheets(registrationData);
        } catch (sheetError) {
          console.error('Error adding to Google Sheets:', sheetError);
        }

        toast.success('Registration successful! Check your email for details.');
        navigate('/workshop/success');
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      toast.error(error.message || 'Error processing registration. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Your Registration</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">
              Secure your spot with a payment of ₹99
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-slate-800/80 p-8 md:p-12 rounded-2xl border border-slate-700 shadow-2xl"
          >
            <div className="mb-8 p-6 bg-slate-700/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Workshop Details</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="text-gray-400">Workshop:</span> 3D Printing Business Blueprint</p>
                <p><span className="text-gray-400">Schedule:</span> Every Sunday, 4:00 PM - 5:30 PM</p>
                <p><span className="text-gray-400">Duration:</span> 90 Minutes</p>
                <p><span className="text-gray-400">Mode:</span> Live Online</p>
                <p><span className="text-gray-400">Amount:</span> <span className="text-green-400 font-bold">₹99</span></p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Your Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <button
              onClick={initiatePayment}
              disabled={paymentLoading || loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {paymentLoading ? 'Processing...' : loading ? 'Verifying Payment...' : 'Pay ₹99 & Register'}
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">
              Secure payment powered by Razorpay
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
