import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  TrashIcon, 
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { getLessonComments, addLessonComment, deleteLessonComment } from '../../services/curriculumService';
import toast from 'react-hot-toast';

export default function LessonComments({ courseId, lessonId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (courseId && lessonId) {
      loadComments();
    }
  }, [courseId, lessonId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getLessonComments(courseId, lessonId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!currentUser) {
      toast.error('Please sign in to ask a question or leave a comment');
      return;
    }

    try {
      setIsSubmitting(true);
      const newComment = await addLessonComment(courseId, lessonId, {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0],
        userEmail: currentUser.email,
        commentText: commentText.trim()
      });
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await deleteLessonComment(commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success('Comment removed');
      } catch (error) {
        toast.error('Failed to remove comment');
      }
    }
  };

  const isAdmin = currentUser?.email === 'kraut9011@gmail.com' || currentUser?.email === 'premzumble@gmail.com';

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Question / Comment Input Box - Standard Udemy & Coursera Discussion Design */}
      <form onSubmit={handleSubmit} className="bg-[#1c1d1f] p-4 sm:p-5 rounded-2xl border border-[#3e4143] space-y-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a435f0] to-[#0056d2] text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
            {(currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              rows={3}
              placeholder="Ask a question about this lecture, slicer settings, or share your print results..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#2d2f31] border border-[#3e4143] text-sm text-white placeholder-[#9da3a8] focus:ring-2 focus:ring-[#a435f0]/30 focus:border-[#a435f0] outline-none transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pl-11">
          <span className="text-[11px] text-[#9da3a8] font-mono">
            {commentText.length}/500
          </span>
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="px-4 py-2 bg-[#a435f0] hover:bg-[#8710d8] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#a435f0]/25 transition-all hover:scale-[1.02]"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Posting...' : 'Ask Question'}</span>
          </button>
        </div>
      </form>

      {/* Discussion List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#3e4143] px-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm">
              Questions & Discussion
            </h4>
            <span className="px-2 py-0.5 bg-[#a435f0]/20 text-[#d8b4fe] border border-[#a435f0]/30 rounded-full text-[10px] font-mono font-bold">
              {comments.length}
            </span>
          </div>
          <span className="text-[11px] text-[#9da3a8]">Active Classroom</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#9da3a8]">
            <div className="w-6 h-6 border-2 border-[#a435f0]/30 border-t-[#a435f0] rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading classroom discussions...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center bg-[#1c1d1f] rounded-2xl border border-[#3e4143] p-6 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#2d2f31] text-[#a435f0] flex items-center justify-center mx-auto mb-2 border border-[#3e4143]">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-white text-sm">No Questions Yet</h5>
            <p className="text-xs text-[#9da3a8] max-w-sm mx-auto leading-relaxed">
              Have a question about this lecture or want feedback from the instructor? Be the first to start the conversation!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = currentUser?.uid === comment.userId;
            const canDelete = isOwner || isAdmin;
            const isInstructor = comment.userEmail === 'kraut9011@gmail.com' || comment.userEmail === 'premzumble@gmail.com';

            return (
              <div 
                key={comment.id}
                className="bg-[#1c1d1f] p-4 sm:p-5 rounded-2xl border border-[#3e4143] hover:border-[#4f5356] transition-colors shadow-sm space-y-2.5"
              >
                {/* Comment Header: Responsive Mobile User Info */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a435f0] to-[#0056d2] text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                      {comment.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {comment.userName || 'Student'}
                        </span>
                        {isInstructor && (
                          <span className="px-1.5 py-0.5 bg-[#a435f0] text-white rounded text-[9px] font-bold uppercase tracking-wider">
                            Instructor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#9da3a8] font-mono mt-0.5">
                        <ClockIcon className="w-3 h-3 text-[#6a6f73]" />
                        <span>
                          {comment.createdAt?.seconds 
                            ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-[#9da3a8] hover:text-red-400 p-1.5 rounded-lg hover:bg-[#2d2f31] transition-colors flex-shrink-0"
                      title="Delete question"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-[#d1d7dc] text-xs sm:text-sm pl-10 sm:pl-10.5 leading-relaxed whitespace-pre-wrap">
                  {comment.commentText}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
