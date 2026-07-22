import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { collection, addDoc, serverTimestamp, db } from "../firebase/index.js";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "contactMessages"), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        date: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", message: "" });
      toast.success("Message sent successfully! We'll get back to you soon.");

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: "✉️", label: "Email", value: "aira3dprinting@gmail.com" },
    { icon: "📍", label: "Address", value: "Aira 3D, Shegaon, Buldhana, Maharashtra, India" },
    {
      icon: "🕐",
      label: "Working Hours",
      value: "Mon - Sat: 10:00 AM - 6:00 PM",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow py-12 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center mb-12">Contact Us</h1>

          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center"
            >
              Message sent successfully! We'll get back to you soon.
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-white rounded-xl shadow-md p-8"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={8}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-y min-h-[160px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-80 space-y-6"
            >
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-5">
                  {contactInfo.map((info, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{info.label}</p>
                        <p className="text-gray-600 text-sm mt-0.5">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Need a 3D Print?</h3>
                <p className="text-sm text-gray-600">
                  Fill out the form and we'll get back to you within 24 hours with a quote.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
