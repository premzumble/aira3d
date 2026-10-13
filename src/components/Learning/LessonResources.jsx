import React from 'react';
import { 
  DocumentArrowDownIcon, 
  ArrowTopRightOnSquareIcon, 
  FolderIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  CubeTransparentIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

/**
 * Checks whether a given resource object is actually a video rather than a document.
 * Resources must strictly only contain documents, not actual lesson videos.
 */
export const isVideoResource = (res, lesson = null) => {
  if (!res || !res.url) return true;
  const url = String(res.url).trim().toLowerCase();
  const name = String(res.name || '').trim().toLowerCase();

  // 1. Matches or contains the lesson's video Drive ID
  const lessonVideoDriveId = String(lesson?.driveFileId || '').trim().toLowerCase();
  if (lessonVideoDriveId && url.includes(lessonVideoDriveId)) {
    return true;
  }

  // 2. Matches the lesson's videoUrl or directVideoUrl
  const lessonVideoUrl = String(lesson?.videoUrl || '').trim().toLowerCase();
  const directVideoUrl = String(lesson?.directVideoUrl || '').trim().toLowerCase();
  if (lessonVideoUrl && (url === lessonVideoUrl || url.includes(lessonVideoUrl))) {
    return true;
  }
  if (directVideoUrl && (url === directVideoUrl || url.includes(directVideoUrl))) {
    return true;
  }

  // 3. Standalone video file extensions
  if (/\.(mp4|webm|ogg|mov|mkv|avi|flv|wmv)(\?.*)?$/i.test(url)) {
    return true;
  }

  // 4. Video streaming platform URLs
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('dailymotion.com')
  ) {
    return true;
  }

  return false;
};

export default function LessonResources({ lesson = null, resources = [] }) {
  // STRICT FILTER: Only show legitimate uploaded documents, NEVER actual videos!
  const validResources = (resources || []).filter(res => !isVideoResource(res, lesson));

  if (!validResources || validResources.length === 0) {
    return (
      <div className="py-10 px-6 bg-[#1c1d1f] rounded-2xl border border-[#3e4143] text-center max-w-md mx-auto my-3">
        <div className="w-12 h-12 rounded-2xl bg-[#2d2f31] text-[#9da3a8] flex items-center justify-center mx-auto mb-3 shadow-inner">
          <FolderIcon className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-white text-sm mb-1.5">
          No Supplementary Documents
        </h4>
        <p className="text-xs text-[#9da3a8] leading-relaxed">
          The instructor has not attached downloadable PDF guides, 3D design files, or spreadsheets for this lecture.
        </p>
      </div>
    );
  }

  const getFileBadge = (name = '', url = '') => {
    const combined = `${name} ${url}`.toLowerCase();
    
    // PDF Documents
    if (combined.includes('.pdf') || combined.includes('pdf')) {
      return { 
        label: 'PDF Document', 
        icon: DocumentTextIcon, 
        actionLabel: 'Open PDF', 
        badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        iconBg: 'bg-rose-500/15 text-rose-400'
      };
    }

    // 3D CAD Files & Models
    if (combined.includes('.stl') || combined.includes('.obj') || combined.includes('.step') || combined.includes('.stp') || combined.includes('.3mf')) {
      return { 
        label: '3D CAD Model', 
        icon: CubeTransparentIcon, 
        actionLabel: 'Download 3D Model', 
        badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        iconBg: 'bg-cyan-500/15 text-cyan-400'
      };
    }

    // Compressed Archives
    if (combined.includes('.zip') || combined.includes('.rar') || combined.includes('.7z')) {
      return { 
        label: 'Archive Package (ZIP)', 
        icon: ArchiveBoxIcon, 
        actionLabel: 'Download ZIP', 
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        iconBg: 'bg-amber-500/15 text-amber-400'
      };
    }

    // Spreadsheets & Tabular Data
    if (combined.includes('.xls') || combined.includes('.xlsx') || combined.includes('.csv') || combined.includes('spreadsheets')) {
      return { 
        label: 'Spreadsheet', 
        icon: TableCellsIcon, 
        actionLabel: 'Open Sheet', 
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        iconBg: 'bg-emerald-500/15 text-emerald-400'
      };
    }

    // General Document or Notes
    return { 
      label: 'Course Document', 
      icon: DocumentArrowDownIcon, 
      actionLabel: 'Download Document', 
      badgeColor: 'text-[#a435f0] bg-[#a435f0]/10 border-[#a435f0]/30',
      iconBg: 'bg-[#a435f0]/15 text-[#a435f0]'
    };
  };

  return (
    <div className="space-y-3.5 max-w-2xl">
      <div className="text-xs text-[#9da3a8] font-medium flex items-center justify-between">
        <span>Available project files, design models, and downloadable notes:</span>
        <span className="font-mono text-[#a435f0] font-semibold">
          {validResources.length} document{validResources.length > 1 ? 's' : ''}
        </span>
      </div>

      {validResources.map((res, idx) => {
        const fileInfo = getFileBadge(res.name, res.url);
        const IconComponent = fileInfo.icon;

        return (
          <a
            key={idx}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 sm:p-4 bg-[#1c1d1f] rounded-2xl border border-[#3e4143] hover:border-[#a435f0]/60 hover:bg-[#25272a] transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 mr-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner ${fileInfo.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-[#d8b4fe] transition-colors truncate">
                  {res.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-[#9da3a8] mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md border font-mono font-semibold ${fileInfo.badgeColor}`}>
                    {fileInfo.label}
                  </span>
                  {res.size && (
                    <>
                      <span>•</span>
                      <span>{res.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a435f0]/10 border border-[#a435f0]/30 rounded-xl text-xs font-bold text-[#a435f0] group-hover:bg-[#a435f0] group-hover:text-white transition-all flex-shrink-0">
              <span className="hidden xs:inline">{fileInfo.actionLabel}</span>
              <span className="xs:hidden">Open</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </div>
          </a>
        );
      })}
    </div>
  );
}
