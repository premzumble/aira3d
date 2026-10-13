import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function VideoPlayer({ 
  lesson, 
  videoTarget,
  previewUrl, 
  userEmail, 
  userId, 
  onEnded, 
  onNextLesson,
  onOpenOverview,
  isFreePreview = false,
  protectionLevel = 'standard'
}) {
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '20%' });
  const containerRef = useRef(null);

  // Active target resolution
  const resolvedUrl = videoTarget?.url || previewUrl || '';
  const isDirectVideo = videoTarget?.type === 'video' || (resolvedUrl && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(resolvedUrl));
  const hasVideo = Boolean(resolvedUrl && resolvedUrl.trim() !== '');

  // Dynamic anti-piracy watermark drift
  useEffect(() => {
    if (protectionLevel === 'enhanced' || !isFreePreview) {
      const interval = setInterval(() => {
        const top = Math.floor(12 + Math.random() * 65) + '%';
        const left = Math.floor(10 + Math.random() * 60) + '%';
        setWatermarkPos({ top, left });
      }, 14000);
      return () => clearInterval(interval);
    }
  }, [protectionLevel, isFreePreview]);

  // Reset loading state when previewUrl or lesson changes
  useEffect(() => {
    setLoading(true);
    setPlayerError(false);
    setErrorMessage('');

    // Safety timeout: dismiss loading overlay after 1.8s so video never gets stuck loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [resolvedUrl, lesson?.id]);

  // Clean unmount: Stop audio/video immediately when switching lessons
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        const video = containerRef.current.querySelector('video');
        if (video) {
          video.pause();
          video.src = '';
        }
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          iframe.src = 'about:blank';
        }
      }
    };
  }, []);

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleRetry = () => {
    setPlayerError(false);
    setLoading(true);
    // Refresh iframe by toggling
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe && resolvedUrl) {
      iframe.src = resolvedUrl;
    }
  };

  // State A: No video configured for this lesson
  if (!hasVideo) {
    return (
      <div className="w-full aspect-video max-h-[540px] bg-[#2d2f31] rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-6 sm:p-8 text-center border border-[#3e4143] shadow-2xl relative overflow-hidden backdrop-blur-sm group">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#a435f0]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#0056d2]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#a435f0]/15 text-[#a435f0] flex items-center justify-center mb-4 ring-1 ring-[#a435f0]/30 shadow-lg">
            <VideoCameraIcon className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a435f0] mb-1">
            Curriculum In Progress
          </span>
          <h3 className="text-xl font-bold text-white mb-2">
            Video Coming Soon
          </h3>
          <p className="text-xs sm:text-sm text-[#d1d7dc] leading-relaxed mb-6">
            The instructor has not uploaded a video for this lesson yet. You can explore the lesson overview or continue to another available lesson.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {onOpenOverview && (
              <button
                type="button"
                onClick={onOpenOverview}
                className="px-4 py-2 bg-[#1c1d1f] hover:bg-[#25272a] text-[#d1d7dc] hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-[#3e4143] transition-all hover:scale-[1.02]"
              >
                <DocumentTextIcon className="w-4 h-4 text-[#9da3a8]" />
                <span>Read Lesson Overview</span>
              </button>
            )}

            {onNextLesson && (
              <button
                type="button"
                onClick={onNextLesson}
                className="px-4 py-2 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#a435f0]/20 transition-all hover:scale-[1.02]"
              >
                <span>Next Lesson</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className="relative w-full aspect-video max-h-[580px] bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#3e4143] select-none group"
    >
      {/* State B: Video Loading Skeleton / Overlay with Professional Play Loader */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-[#1c1d1f] flex flex-col items-center justify-center text-white">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-[#a435f0]/20 border-t-[#a435f0] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#a435f0] flex items-center justify-center shadow-lg shadow-[#a435f0]/40">
                <PlayIcon className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#d1d7dc] tracking-wide">
            Loading secure lecture stream...
          </p>
          <span className="text-[11px] text-[#9da3a8] mt-1 font-mono">
            Aira3D Secure Classroom
          </span>
        </div>
      )}

      {/* State C & D: Playback Error Overlay */}
      {playerError && (
        <div className="absolute inset-0 z-20 bg-[#1c1d1f]/95 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-3 ring-1 ring-red-500/30">
            <ExclamationTriangleIcon className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-white mb-1.5">
            Unable to load this lesson right now
          </h4>
          <p className="text-xs text-[#d1d7dc] max-w-md mb-5 leading-relaxed">
            {errorMessage || "The video source may still be processing or Google Drive file permissions are restricted. Please verify file sharing settings or try again."}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 bg-[#a435f0] hover:bg-[#8710d8] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#a435f0]/20 transition-all hover:scale-105"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Retry Video</span>
            </button>
            {onNextLesson && (
              <button
                type="button"
                onClick={onNextLesson}
                className="px-4 py-2.5 bg-[#2d2f31] hover:bg-[#35373a] text-[#d1d7dc] rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#3e4143]"
              >
                <span>Skip to Next</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* State G: Direct HTML5 Video Player vs Embedded Iframe */}
      {isDirectVideo ? (
        <video
          src={resolvedUrl}
          controls
          controlsList="nodownload"
          onLoadedData={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setPlayerError(true);
            setErrorMessage('Direct video playback encountered a format or connection error.');
          }}
          onEnded={onEnded}
          className="w-full h-full object-contain bg-black"
        >
          Your browser does not support HTML5 video playback.
        </video>
      ) : (
        <div className="relative w-full h-full">
          {/* Top Security Mask: Completely covers and blocks Google Drive header & popout arrow */}
          <div 
            className="absolute top-0 left-0 right-0 h-14 sm:h-16 z-20 pointer-events-auto bg-black select-none flex items-center justify-between px-4 cursor-default shadow-md"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="flex items-center gap-2 max-w-[80%] min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#a435f0] flex-shrink-0 animate-pulse" />
              <span className="text-xs font-semibold text-gray-200 truncate tracking-wide">
                {lesson?.title || 'Aira3D Classroom'}
              </span>
            </div>
          </div>

          <iframe
            src={resolvedUrl}
            className="w-full h-full border-0 absolute inset-0 z-10"
            allow="autoplay; fullscreen; picture-in-picture"
            title={lesson?.title || "Video Lesson"}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setPlayerError(true);
              setErrorMessage('Unable to embed external video source. Google Drive permissions may need review.');
            }}
          />
        </div>
      )}

      {/* Anti-Piracy Watermark: Drifting identity overlay */}
      {(userEmail || userId) && !loading && !playerError && (
        <div 
          className="absolute z-30 pointer-events-none transition-all duration-1000 ease-in-out text-[11px] font-mono font-bold tracking-wider text-white/30 backdrop-blur-[0.5px] px-2.5 py-1 rounded bg-black/20 border border-white/5"
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
        >
          {userEmail || userId} • Aira3D Student
        </div>
      )}
    </div>
  );
}
