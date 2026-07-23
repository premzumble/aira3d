import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckIcon } from '@heroicons/react/24/solid';
import Input from '../ui/Input';
import { COURSE_CATEGORIES, COURSE_DIFFICULTIES, COURSE_DURATIONS, COURSE_BADGES, COURSE_TYPES } from '../../utils/courseConstants';
import { uploadCourseImage } from '../../services/courseService';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, name: 'Basic Info', icon: DocumentTextIcon },
  { id: 2, name: 'Media', icon: PhotoIcon },
  { id: 3, name: 'Instructor', icon: UserIcon },
  { id: 4, name: 'Schedule', icon: CalendarIcon },
  { id: 5, name: 'Pricing', icon: CurrencyRupeeIcon },
  { id: 6, name: 'Content', icon: AcademicCapIcon },
  { id: 7, name: 'SEO & Publish', icon: MegaphoneIcon },
  { id: 8, name: 'Review', icon: CheckCircleIcon },
];

const ImageUploadInput = ({ label, value, onChange, folder, placeholder }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large! Please upload an image smaller than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      const url = await uploadCourseImage(file, folder);
      onChange(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image. You might not have permission, or the file is too large.');
      console.error('Upload Error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4">
        <div className="flex-1 w-full relative">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Paste image URL here..."}
            className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        <div className="text-gray-400 font-medium">OR</div>
        <div className="w-full sm:w-auto relative">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
            ) : (
              <>
                <PhotoIcon className="w-5 h-5" /> Browse File
              </>
            )}
          </button>
        </div>
      </div>
      {value && (
        <div className="mt-4 relative w-full aspect-video sm:w-64 sm:aspect-video rounded-xl border border-gray-200 overflow-hidden bg-gray-50 shadow-inner">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

const CourseWizard = ({ course, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    longDesc: '',
    category: '',
    difficulty: 'Beginner',
    courseType: 'Online',
    language: 'English',
    badges: [],
    
    startDate: '',
    endDate: '',
    time: '',
    timezone: 'Asia/Kolkata',
    duration: '',
    customDuration: '',
    isOnline: true,
    address: '',
    meetLink: '',
    maxStudents: '',
    
    instructorName: '',
    instructorBio: '',
    instructorImageUrl: '',
    instructorSocialLinks: '',
    
    price: '',
    discountPrice: '',
    earlyBirdDiscount: false,
    certificateAvailable: false,
    featured: false,
    
    bannerUrl: '',
    thumbnailUrl: '',
    galleryUrls: '',
    
    learningOutcomes: '',
    requirements: '',
    targetAudience: '',
    toolsRequired: '',
    faqs: '',
    courseHighlights: '',
    
    seoTitle: '',
    seoDescription: '',
    status: 'Draft'
  });

  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        galleryUrls: course.galleryUrls ? course.galleryUrls.join(', ') : '',
        learningOutcomes: course.learningOutcomes ? course.learningOutcomes.join('\n') : '',
        requirements: course.requirements ? course.requirements.join('\n') : '',
        targetAudience: course.targetAudience ? course.targetAudience.join('\n') : '',
        toolsRequired: course.toolsRequired ? course.toolsRequired.join('\n') : '',
        courseHighlights: course.courseHighlights ? course.courseHighlights.join('\n') : '',
        faqs: course.faqs ? JSON.stringify(course.faqs, null, 2) : ''
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        if (!formData.title) { toast.error("Course Title is required."); return false; }
        if (!formData.category) { toast.error("Category is required."); return false; }
        return true;
      case 5:
        if (formData.price === '') { toast.error("Price is required. (Enter 0 for free)"); return false; }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (statusOverride = null) => {
    if (!validateStep(1) || !validateStep(5)) return;
    
    setIsSubmitting(true);
    let parsedFaqs = [];
    if (formData.faqs) {
      try {
        parsedFaqs = JSON.parse(formData.faqs);
      } catch (err) {
        toast.error('FAQs must be valid JSON format. Example: [{"q": "Question?", "a": "Answer"}]');
        setIsSubmitting(false);
        return;
      }
    }

    const submissionData = {
      ...formData,
      status: statusOverride || formData.status,
      price: formData.price ? Number(formData.price) : 0,
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
      galleryUrls: formData.galleryUrls ? formData.galleryUrls.split(',').map(u => u.trim()).filter(Boolean) : [],
      learningOutcomes: formData.learningOutcomes ? formData.learningOutcomes.split('\n').filter(Boolean) : [],
      requirements: formData.requirements ? formData.requirements.split('\n').filter(Boolean) : [],
      targetAudience: formData.targetAudience ? formData.targetAudience.split('\n').filter(Boolean) : [],
      toolsRequired: formData.toolsRequired ? formData.toolsRequired.split('\n').filter(Boolean) : [],
      courseHighlights: formData.courseHighlights ? formData.courseHighlights.split('\n').filter(Boolean) : [],
      badges: typeof formData.badges === 'string' ? formData.badges.split(',').map(b=>b.trim()).filter(Boolean) : formData.badges,
      faqs: parsedFaqs
    };
    
    // Remove all undefined/empty fields to prevent Firestore errors
    Object.keys(submissionData).forEach(key => {
      if (submissionData[key] === undefined || submissionData[key] === '') {
        delete submissionData[key];
      }
    });

    try {
      await onSubmit(submissionData);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Basic Information</h3>
              <p className="text-gray-500 mb-6">Start by providing the core details of your course.</p>
            </div>
            
            <Input label="Course Title *" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. 3D Printing Masterclass" />
            
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Short Description</label>
              <textarea 
                name="shortDesc" 
                value={formData.shortDesc} 
                onChange={handleChange}
                placeholder="A brief, catchy summary of what this course offers..."
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4">
                  <option value="">Select a category</option>
                  {COURSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Course Type</label>
                <select name="courseType" value={formData.courseType} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4">
                  {COURSE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Difficulty Level</label>
                <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4">
                  {COURSE_DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                </select>
              </div>
              <Input label="Language" name="language" value={formData.language} onChange={handleChange} placeholder="e.g. English" />
            </div>

            <Input 
              label="Badges (Comma separated)" 
              name="badges" 
              value={Array.isArray(formData.badges) ? formData.badges.join(', ') : formData.badges} 
              onChange={handleChange} 
              placeholder="e.g. New, Bestseller" 
            />
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Course Media</h3>
              <p className="text-gray-500 mb-6">Upload high-quality images to attract students.</p>
            </div>
            
            <ImageUploadInput label="Course Thumbnail (4:3 aspect ratio recommended)" value={formData.thumbnailUrl} onChange={(url) => setFormData(p => ({...p, thumbnailUrl: url}))} folder="courseThumbnails" placeholder="https://..." />
            <ImageUploadInput label="Hero Banner (16:9 aspect ratio recommended)" value={formData.bannerUrl} onChange={(url) => setFormData(p => ({...p, bannerUrl: url}))} folder="courseBanners" placeholder="https://..." />
            
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-900 mb-2">Gallery Images (Comma separated URLs)</label>
              <textarea 
                name="galleryUrls" 
                value={formData.galleryUrls} 
                onChange={handleChange}
                placeholder="https://image1.com/img.jpg, https://image2.com/img.jpg"
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Instructor Details</h3>
              <p className="text-gray-500 mb-6">Who is teaching this course?</p>
            </div>

            <ImageUploadInput label="Instructor Profile Picture" value={formData.instructorImageUrl} onChange={(url) => setFormData(p => ({...p, instructorImageUrl: url}))} folder="instructors" />
            <Input label="Instructor Name" name="instructorName" value={formData.instructorName} onChange={handleChange} placeholder="e.g. John Doe" />
            
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Instructor Bio</label>
              <textarea 
                name="instructorBio" 
                value={formData.instructorBio} 
                onChange={handleChange}
                placeholder="A short biography outlining their expertise..."
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                rows={4}
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Schedule & Delivery</h3>
              <p className="text-gray-500 mb-6">When and how will this course be delivered?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Duration Type</label>
                <select name="duration" value={formData.duration} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4">
                  <option value="">Select duration</option>
                  {COURSE_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Input label="Custom Duration (e.g. '3 Weeks', '10 Hours')" name="customDuration" value={formData.customDuration} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
              <Input label="End Date" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Time (e.g. 10:00 AM - 12:00 PM)" name="time" value={formData.time} onChange={handleChange} />
              <Input label="Timezone" name="timezone" value={formData.timezone} onChange={handleChange} placeholder="e.g. Asia/Kolkata" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Maximum Seats" name="maxStudents" type="number" value={formData.maxStudents} onChange={handleChange} placeholder="Leave blank for unlimited" />
              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  id="isOnline"
                  name="isOnline"
                  checked={formData.isOnline}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="isOnline" className="ml-3 font-bold text-gray-900">This is an Online Course</label>
              </div>
            </div>

            {formData.isOnline ? (
              <Input label="Google Meet / Zoom Link" name="meetLink" value={formData.meetLink} onChange={handleChange} placeholder="https://meet.google.com/..." />
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Venue Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="Full address of the physical venue..."
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                  rows={2}
                />
              </div>
            )}
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Pricing & Perks</h3>
              <p className="text-gray-500 mb-6">Set your price and included benefits.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Regular Price (₹) *" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="e.g. 2999" />
                <Input label="Discount Price (₹)" name="discountPrice" type="number" value={formData.discountPrice} onChange={handleChange} placeholder="e.g. 1999" />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center">
                  <input type="checkbox" id="certificateAvailable" name="certificateAvailable" checked={formData.certificateAvailable} onChange={handleChange} className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                  <label htmlFor="certificateAvailable" className="ml-3 font-bold text-gray-900">Provide a Certificate of Completion</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="featured" name="featured" checked={formData.featured} onChange={handleChange} className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500" />
                  <label htmlFor="featured" className="ml-3 font-bold text-gray-900">Mark as Featured Course</label>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">Course Content</h3>
              <p className="text-gray-500 mb-6">Detailed curriculum and requirements (One per line).</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Long Description (About this course)</label>
              <textarea 
                name="longDesc" 
                value={formData.longDesc} 
                onChange={handleChange}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Learning Outcomes</label>
                <textarea name="learningOutcomes" value={formData.learningOutcomes} onChange={handleChange} placeholder="- Outcome 1\n- Outcome 2" className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 py-3 px-4" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Requirements / Prerequisites</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} placeholder="- Requirement 1\n- Requirement 2" className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 py-3 px-4" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Target Audience</label>
                <textarea name="targetAudience" value={formData.targetAudience} onChange={handleChange} placeholder="- Students\n- Professionals" className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 py-3 px-4" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Tools Required</label>
                <textarea name="toolsRequired" value={formData.toolsRequired} onChange={handleChange} placeholder="- Laptop\n- Software X" className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 py-3 px-4" rows={4} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Syllabus / FAQs (Must be valid JSON array)</label>
              <textarea 
                name="faqs" 
                value={formData.faqs} 
                onChange={handleChange}
                placeholder='[{"q": "Module 1", "a": "Intro to 3D Printing"}, {"q": "Module 2", "a": "Advanced Techniques"}]'
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4 font-mono text-sm"
                rows={6}
              />
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">SEO & Publish Settings</h3>
              <p className="text-gray-500 mb-6">Optimize for search engines and set visibility.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <Input label="SEO Meta Title" name="seoTitle" value={formData.seoTitle} onChange={handleChange} placeholder="Defaults to Course Title if blank" />
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">SEO Meta Description</label>
                <textarea 
                  name="seoDescription" 
                  value={formData.seoDescription} 
                  onChange={handleChange}
                  placeholder="Defaults to Short Description if blank"
                  className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Course Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-3 px-4">
                  <option value="Draft">Draft (Hidden from public)</option>
                  <option value="Published">Published (Live to public)</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SolidCheckIcon className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-display font-bold text-gray-900 mb-2">Almost Done!</h3>
              <p className="text-gray-500">Review your course details below. You can always edit this later.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-4xl mx-auto">
              <div className="relative aspect-[3/1] bg-gray-900">
                {formData.bannerUrl && <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-50" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{formData.category}</span>
                    <span className="bg-white/20 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{formData.status}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">{formData.title || 'Untitled Course'}</h1>
                  <p className="text-gray-300 text-lg line-clamp-1">{formData.shortDesc || 'No description provided.'}</p>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Instructor</h4>
                      <div className="flex items-center gap-4">
                        {formData.instructorImageUrl ? (
                          <img src={formData.instructorImageUrl} alt="Instructor" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <UserIcon className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{formData.instructorName || 'Not specified'}</p>
                          <p className="text-gray-500 text-sm line-clamp-2">{formData.instructorBio || 'No bio provided.'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-1 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">Quick Stats</h4>
                    <ul className="space-y-4 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-bold text-gray-900">₹{formData.price || '0'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Format:</span>
                        <span className="font-bold text-gray-900">{formData.isOnline ? 'Online' : 'In-Person'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className="font-bold text-gray-900">{formData.difficulty || 'N/A'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Certificate:</span>
                        <span className="font-bold text-gray-900">{formData.certificateAvailable ? 'Yes' : 'No'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 hidden sm:block">
              {course ? 'Edit Course' : 'Create New Course'}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentStep === STEPS.length ? (
            <>
              <button 
                onClick={() => handleFinalSubmit('Draft')} 
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button 
                onClick={() => handleFinalSubmit('Published')} 
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                {course ? 'Update & Publish' : 'Publish Course'}
              </button>
            </>
          ) : (
            <button 
              onClick={handleNext}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              Next Step <ChevronRightIcon className="w-4 h-4 stroke-2" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Left Sidebar - Progress */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Wizard Progress</h3>
            <div className="space-y-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="relative flex items-center gap-4 group">
                    {index !== STEPS.length - 1 && (
                      <div className={`absolute left-[15px] top-8 w-0.5 h-8 -ml-px ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}`} />
                    )}
                    <button 
                      onClick={() => setCurrentStep(step.id)}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white transition-colors ${
                        isCompleted ? 'border-primary-500 text-primary-500' : 
                        isCurrent ? 'border-primary-600 border-[3px] text-primary-600 shadow-md' : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <SolidCheckIcon className="w-5 h-5 text-primary-500" /> : <Icon className="w-4 h-4" />}
                    </button>
                    <span className={`font-medium text-sm transition-colors ${isCurrent ? 'text-primary-700 font-bold' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Content - Form Steps */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 min-h-[600px] flex flex-col">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </div>
            
            {/* Bottom Navigation */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-4 h-4 stroke-2" /> Back
              </button>
              
              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  Continue <ChevronRightIcon className="w-4 h-4 stroke-2" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseWizard;
