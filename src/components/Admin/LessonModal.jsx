import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PlayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ShieldCheckIcon,
  EyeIcon,
  DocumentArrowUpIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CubeTransparentIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { extractGoogleDriveId, getGoogleDrivePreviewUrl } from '../../services/curriculumService';
import toast from 'react-hot-toast';

export default function LessonModal({ isOpen, onClose, onSave, lesson, modules = [], defaultModuleId = null }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moduleId: '',
    videoSource: 'google_drive',
    videoUrl: '',
    directVideoUrl: '',
    duration: '',
    isPublished: true,
    isFreePreview: false,
    protectionLevel: 'standard', // 'standard' | 'enhanced'
    resources: []
  });

  const [validatingVideo, setValidatingVideo] = useState(false);
  const [videoValidationStatus, setVideoValidationStatus] = useState(null); // { valid: bool, message: str, previewUrl: str }
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');

  useEffect(() => {
    if (lesson) {
      const driveFileId = lesson.driveFileId || '';
      const videoUrl = driveFileId ? `https://drive.google.com/file/d/${driveFileId}/view` : (lesson.videoUrl || '');
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        moduleId: lesson.moduleId || defaultModuleId || (modules[0]?.id || 'default'),
        videoSource: lesson.videoSource || 'google_drive',
        videoUrl,
        directVideoUrl: lesson.directVideoUrl || '',
        duration: lesson.duration || '',
        isPublished: lesson.isPublished !== undefined ? lesson.isPublished : true,
        isFreePreview: !!lesson.isFreePreview,
        protectionLevel: lesson.protectionLevel || 'standard',
        resources: Array.isArray(lesson.resources) ? lesson.resources : []
      });

      if (driveFileId) {
        setVideoValidationStatus({
          valid: true,
          previewUrl: getGoogleDrivePreviewUrl(driveFileId),
          message: 'Google Drive File ID recognized'
        });
      } else {
        setVideoValidationStatus(null);
      }
    } else {
      setFormData({
        title: '',
        description: '',
        moduleId: defaultModuleId || (modules[0]?.id || 'default'),
        videoSource: 'google_drive',
        videoUrl: '',
        directVideoUrl: '',
        duration: '',
        isPublished: true,
        isFreePreview: false,
        protectionLevel: 'standard',
        resources: []
      });
      setVideoValidationStatus(null);
    }
  }, [lesson, defaultModuleId, modules, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'videoUrl') {
      const extractedId = extractGoogleDriveId(value);
      if (extractedId) {
        setVideoValidationStatus({
          valid: true,
          previewUrl: getGoogleDrivePreviewUrl(extractedId),
          message: 'Valid Google Drive Video ID'
        });
      } else if (value.trim()) {
        setVideoValidationStatus({
          valid: false,
          previewUrl: null,
          message: 'Invalid Google Drive link format. Use: https://drive.google.com/file/d/.../view'
        });
      } else {
        setVideoValidationStatus(null);
      }
    }
  };

  const validateResourceCandidate = (url) => {
    if (!url || typeof url !== 'string') return { valid: false, message: 'Resource URL is required' };
    const trimmed = url.trim();
    
    // Check if it matches the lesson's video Drive ID
    const candidateDriveId = extractGoogleDriveId(trimmed);
    const lessonDriveId = extractGoogleDriveId(formData.videoUrl);
    if (lessonDriveId && candidateDriveId && lessonDriveId.toLowerCase() === candidateDriveId.toLowerCase()) {
      return { 
        valid: false, 
        message: 'This link points to your lesson VIDEO! The Resources section only accepts document/PDF links.' 
      };
    }

    // Check if it matches formData.videoUrl or formData.directVideoUrl
    if (formData.videoUrl && trimmed.toLowerCase() === formData.videoUrl.trim().toLowerCase()) {
      return { 
        valid: false, 
        message: 'This link is the lesson VIDEO! Please provide a document or PDF link.' 
      };
    }
    if (formData.directVideoUrl && trimmed.toLowerCase() === formData.directVideoUrl.trim().toLowerCase()) {
      return { 
        valid: false, 
        message: 'This link is the lesson VIDEO! Please provide a document or PDF link.' 
      };
    }

    // Check video file extensions
    if (/\.(mp4|webm|mov|mkv|avi|flv|wmv)(\?.*)?$/i.test(trimmed)) {
      return { 
        valid: false, 
        message: 'Video files cannot be added as resources. Videos must be set in the Video Source section.' 
      };
    }

    // Check video streaming platforms
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.includes('vimeo.com')) {
      return { 
        valid: false, 
        message: 'Video streaming links cannot be added as resources. Only document files are supported.' 
      };
    }

    return { valid: true };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Disallow video files
    if (/\.(mp4|webm|mov|mkv|avi|flv|wmv)$/i.test(file.name) || file.type.startsWith('video/')) {
      toast.error('Videos cannot be uploaded as resources! Upload your lecture in Video Source.');
      e.target.value = '';
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit. For larger CAD files or PDFs, please host on Google Drive and paste the share link.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        resources: [
          ...prev.resources,
          {
            name: file.name,
            url: reader.result,
            size: sizeStr
          }
        ]
      }));
      toast.success(`Attached "${file.name}" (${sizeStr})`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleAddResource = () => {
    if (!resourceName.trim() || !resourceUrl.trim()) {
      toast.error('Resource name and URL are both required');
      return;
    }

    const validation = validateResourceCandidate(resourceUrl.trim());
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { name: resourceName.trim(), url: resourceUrl.trim() }]
    }));
    setResourceName('');
    setResourceUrl('');
  };

  const handleRemoveResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    if (formData.videoSource === 'google_drive') {
      const fileId = extractGoogleDriveId(formData.videoUrl);
      if (!fileId) {
        toast.error('Please provide a valid Google Drive video link');
        return;
      }
    }

    // Auto-save any resource typed in inputs even if 'Add' was not clicked, provided it's valid
    let finalResources = [...formData.resources];
    if (resourceUrl.trim()) {
      const validation = validateResourceCandidate(resourceUrl.trim());
      if (validation.valid) {
        const name = resourceName.trim() || 'Course Resource (PDF)';
        finalResources.push({ name, url: resourceUrl.trim() });
      } else {
        toast.error(validation.message);
        return;
      }
    }

    onSave({
      ...formData,
      title: formData.title.trim(),
      resources: finalResources
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-display font-bold text-gray-900">
              {lesson ? 'Edit Video Lesson' : 'Add New Video Lesson'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure video source, duration, protection, and curriculum details
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Module selection */}
          {modules.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Curriculum Module
              </label>
              <select
                name="moduleId"
                value={formData.moduleId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium bg-white"
              >
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Lesson Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Slicing Models with Bambu Studio"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Lesson Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Summary of topics covered, practical steps, or homework assignments..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-medium"
            />
          </div>

          {/* Video Source Switcher */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Video Source</span>
              <div className="flex bg-gray-200 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, videoSource: 'google_drive' }))}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    formData.videoSource === 'google_drive' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Google Drive (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, videoSource: 'direct_upload' }))}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    formData.videoSource === 'direct_upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Direct Video Link
                </button>
              </div>
            </div>

            {formData.videoSource === 'google_drive' ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  Google Drive Video URL / File ID:
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/file/d/1A2B3C.../view"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                />
                <p className="text-[11px] text-gray-500">
                  Tip: Ensure file permissions are set to "Anyone with the link can view" in Google Drive.
                </p>

                {videoValidationStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                    videoValidationStatus.valid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {videoValidationStatus.valid ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <ExclamationCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <span>{videoValidationStatus.message}</span>
                    </div>

                    {videoValidationStatus.valid && (
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="px-3 py-1.5 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                      >
                        <PlayIcon className="w-3.5 h-3.5 fill-current" />
                        <span>Preview Video</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">
                  Direct Video URL (MP4 / WebM):
                </label>
                <input
                  type="url"
                  name="directVideoUrl"
                  value={formData.directVideoUrl}
                  onChange={handleChange}
                  placeholder="https://storage.googleapis.com/.../video.mp4"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                />
              </div>
            )}
          </div>

          {/* Duration & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Duration (MM:SS)
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="14:30"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Video Protection
              </label>
              <select
                name="protectionLevel"
                value={formData.protectionLevel}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
              >
                <option value="standard">Standard Playback</option>
                <option value="enhanced">Enhanced Protection (Watermarked)</option>
              </select>
            </div>
          </div>

          {/* Toggles: Free Preview & Published */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                name="isFreePreview"
                checked={formData.isFreePreview}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-bold text-gray-800 block">Free Preview Lesson</span>
                <span className="text-[11px] text-gray-500 block">Allows unenrolled visitors to watch</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-bold text-gray-800 block">Published</span>
                <span className="text-[11px] text-gray-500 block">Visible to enrolled students</span>
              </div>
            </label>
          </div>

          {/* Supplementary Resources */}
          <div className="pt-2 bg-slate-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                  Supplementary Documents & Files (PDF, STL, ZIP)
                </label>
                <p className="text-[11px] text-gray-500">
                  Attach downloadable guides or models. Do not enter video links here.
                </p>
              </div>

              {/* Upload file trigger */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.stl,.obj,.step,.stp,.3mf,.zip,.rar,.xlsx,.xls,.csv,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#a435f0]/10 hover:bg-[#a435f0]/20 text-[#a435f0] border border-[#a435f0]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                <span>Upload Document File</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider pt-1">
              Or Link External Document (Google Drive PDF / URL):
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Document Name (e.g. Summary Guide PDF)"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-[#a435f0] bg-white font-medium"
              />
              <input
                type="url"
                placeholder="Document URL (PDF / Drive PDF link)"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none focus:ring-2 focus:ring-[#a435f0] bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddResource}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                Add Link
              </button>
            </div>

            {formData.resources.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-600 block">
                  Attached Documents ({formData.resources.length}):
                </span>
                {formData.resources.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-xs shadow-xs">
                    <div className="flex items-center gap-2 min-w-0 mr-2">
                      <DocumentTextIcon className="w-4 h-4 text-[#a435f0] flex-shrink-0" />
                      <span className="font-semibold text-gray-800 truncate">{res.name}</span>
                      {res.size && (
                        <span className="text-[10px] text-gray-400 font-mono">({res.size})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={res.url} target="_blank" rel="noreferrer" className="text-[#a435f0] hover:underline text-[11px] font-bold">
                        Open
                      </a>
                      <button type="button" onClick={() => handleRemoveResource(i)} className="text-red-500 hover:text-red-700 p-1">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {lesson ? 'Save Changes' : 'Add Lesson'}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Video Preview Modal */}
      {showPreviewModal && videoValidationStatus?.previewUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full border border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
              <span className="font-bold text-sm">Admin Video Preview</span>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={videoValidationStatus.previewUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
