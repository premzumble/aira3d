import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const topics = [
  "Introduction to 3D Printing",
  "How 3D Printing Works",
  "Choosing the Right 3D Printer",
  "Best Beginner Printer Recommendations",
  "Types of 3D Printing Filaments",
  "Bambu Studio Basics",
  "Where to Download 3D Models (Free & Paid)",
  "Preparing Models for Printing",
  "Creating Custom Products",
  "Pricing Your 3D Prints",
  "Calculating Profit & Costs",
  "Finding High-Paying Customers",
  "Online Marketing Strategy",
  "Offline Marketing Strategy",
  "Instagram & Social Media Growth",
  "How to Get Your First Orders",
  "Building a 3D Printing Brand",
  "Zero Budget Business Plan",
  "30-Day Action Plan",
  "Live Q&A Session"
];

export default function Workshop() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    experience: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/workshop/register', { state: formData });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeIn} className="mb-6">
              <span className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-4">
                🔥 Limited Seats Available
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                3D Printing Business Blueprint
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl text-gray-300 mt-4 block">
                Start Your 3D Printing Business with Zero Budget
              </span>
            </motion.h1>

            <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4 mb-8 text-lg">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Every Sunday</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>4:00 PM - 5:30 PM</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>90 Minutes Live</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-400 font-bold">₹99 Only</span>
              </div>
            </motion.div>

            <motion.p variants={fadeIn} className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Learn how to start a profitable 3D printing business from scratch. Perfect for students, beginners, 
              engineers, entrepreneurs, and anyone looking to turn their 3D printing skills into a real income stream.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/workshop/register')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                Register Now - ₹99
              </button>
              <a
                href="#topics"
                className="px-8 py-4 border border-white/20 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300"
              >
                View Topics
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      </section>

      {/* About Workshop Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About This Workshop</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto"></div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h3 className="text-2xl font-bold mb-4 text-blue-400">From Zero to Profitable Business</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                This comprehensive workshop is designed for complete beginners who want to launch their own 
                3D printing business with minimal investment. You'll learn everything from selecting the right 
                equipment to finding high-paying customers and scaling your operations.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Whether you're a student, hobbyist, or entrepreneur, this workshop provides a proven 
                roadmap to build a sustainable 3D printing business without breaking the bank.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: "👥", title: "Target Audience", desc: "Students, Beginners, Engineers, Entrepreneurs" },
                { icon: "⏱️", title: "Duration", desc: "90 Minutes of Live Training" },
                { icon: "💻", title: "Mode", desc: "Live Online Workshop" },
                { icon: "💰", title: "Investment", desc: "Only ₹99" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeIn}
                  className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 hover:border-blue-500/50 transition-colors"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Topics Covered Section */}
      <section id="topics" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What You'll Learn</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Master every aspect of starting and running a successful 3D printing business
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {topics.map((topic, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold text-sm mt-0.5">#{idx + 1}</span>
                  <p className="text-gray-300 group-hover:text-white transition-colors">{topic}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Secure Your Spot</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">
              Fill in your details and get instant access to the workshop
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-slate-800/80 p-8 md:p-12 rounded-2xl border border-slate-700 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Your city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level *</label>
                <select
                  name="experience"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="">Select your experience</option>
                  <option value="complete-beginner">Complete Beginner</option>
                  <option value="beginner">Beginner (0-1 years)</option>
                  <option value="intermediate">Intermediate (1-3 years)</option>
                  <option value="advanced">Advanced (3+ years)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Continue to Payment - ₹99
              </button>

              <p className="text-center text-gray-400 text-sm">
                By registering, you agree to our terms and conditions
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Aira3D. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
