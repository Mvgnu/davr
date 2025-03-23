import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  ClockIcon, 
  ArrowUturnLeftIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Interface for a comment
interface Comment {
  _id: string;
  name: string;
  email: string;
  website?: string;
  text: string;
  blogPostId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

interface BlogCommentsProps {
  blogPostId: string;
  blogPostTitle: string;
}

export const BlogComments: React.FC<BlogCommentsProps> = ({ blogPostId, blogPostTitle }) => {
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [commentText, setCommentText] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    text: '',
    privacy: ''
  });
  
  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
  }, [blogPostId]);
  
  // Function to fetch comments from the API
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/blog/comments?blogPostId=${blogPostId}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data.comments);
      } else {
        setError(data.message || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Kommentare konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date to German locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      text: '',
      privacy: ''
    };
    let isValid = true;
    
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
      isValid = false;
    }
    
    if (!email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
      isValid = false;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
        isValid = false;
      }
    }
    
    if (!commentText.trim()) {
      newErrors.text = 'Kommentartext ist erforderlich';
      isValid = false;
    }
    
    if (!privacyAccepted) {
      newErrors.privacy = 'Sie müssen den Datenschutzbestimmungen zustimmen';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          website,
          text: commentText,
          blogPostId,
          parentId: replyTo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setName('');
        setEmail('');
        setWebsite('');
        setCommentText('');
        setPrivacyAccepted(false);
        setReplyTo(null);
        setSubmitSuccess(true);
        
        // Refresh comments
        fetchComments();
        
        // Reset success message after a delay
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        setSubmitError(data.message || 'Fehler beim Absenden des Kommentars');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setSubmitError('Fehler beim Absenden des Kommentars. Bitte versuchen Sie es später erneut.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Start replying to a comment
  const handleReply = (commentId: string) => {
    setReplyTo(commentId);
    
    // Scroll to comment form
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Cancel reply
  const cancelReply = () => {
    setReplyTo(null);
  };
  
  // Render a single comment
  const renderComment = (comment: Comment, isReply = false) => (
    <div 
      key={comment._id} 
      className={`mb-8 ${isReply ? 'ml-12 border-l-4 border-green-100 pl-6' : ''}`}
      id={`comment-${comment._id}`}
    >
      <div className="flex items-start">
        <div className="bg-green-100 rounded-full p-3 text-green-600 mr-4">
          <UserCircleIcon className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center mb-2">
            <h4 className="font-bold text-gray-900 mr-3">
              {comment.name}
              {comment.website && (
                <Link 
                  href={comment.website.startsWith('http') ? comment.website : `https://${comment.website}`}
                  className="ml-2 text-green-600 text-sm font-normal hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {comment.website.replace(/^https?:\/\/(www\.)?/, '')}
                </Link>
              )}
            </h4>
            
            <div className="text-sm text-gray-500 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDate(comment.createdAt)}
            </div>
          </div>
          
          <div className="prose prose-green prose-sm max-w-none mb-3 text-gray-700">
            <p>{comment.text}</p>
          </div>
          
          <button
            type="button"
            onClick={() => handleReply(comment._id)}
            className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
            Antworten
          </button>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-6">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="mt-16 pt-16 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900" id="comments">
        {comments.length === 0
          ? 'Seien Sie der Erste, der kommentiert'
          : `${comments.reduce(
              (total, comment) => total + 1 + (comment.replies?.length || 0),
              0
            )} Kommentare`}
      </h2>
      
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start">
              <div className="bg-gray-200 rounded-full h-12 w-12 mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-1/5"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      ) : (
        <div className="mb-12">
          {comments.length > 0 ? (
            comments.map(comment => renderComment(comment))
          ) : (
            <p className="text-gray-500 italic mb-8">
              Noch keine Kommentare. Seien Sie der Erste, der kommentiert!
            </p>
          )}
        </div>
      )}
      
      {/* Comment form */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8" id="comment-form">
        <h3 className="text-xl font-bold mb-4 text-gray-900">
          {replyTo ? 'Auf Kommentar antworten' : 'Hinterlassen Sie einen Kommentar'}
        </h3>
        
        {replyTo && (
          <div className="mb-4 bg-green-50 rounded-lg p-4 flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Sie antworten auf einen Kommentar
              </p>
              <button
                type="button"
                onClick={cancelReply}
                className="text-sm text-red-600 hover:text-red-700 inline-flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Abbrechen
              </button>
            </div>
          </div>
        )}
        
        {submitSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-start">
            <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              Ihr Kommentar wurde erfolgreich übermittelt. Vielen Dank für Ihren Beitrag!
            </p>
          </div>
        )}
        
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{submitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs ml-1">(wird nicht veröffentlicht)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website <span className="text-gray-500 text-xs ml-1">(optional)</span>
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="https://"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Kommentar <span className="text-red-500">*</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={5}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-green-500 focus:border-green-500 ${
                errors.text ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            ></textarea>
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text}</p>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="privacy"
                  name="privacy"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="privacy" className="text-gray-700">
                  Ich stimme zu, dass meine Daten zur Bearbeitung meines Kommentars gespeichert werden.{' '}
                  <Link href="/datenschutz" className="text-green-600 hover:underline">
                    Datenschutzerklärung
                  </Link>
                  <span className="text-red-500">*</span>
                </label>
                {errors.privacy && (
                  <p className="mt-1 text-sm text-red-600">{errors.privacy}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </>
              ) : (
                'Kommentar absenden'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogComments; 