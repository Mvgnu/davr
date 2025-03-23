import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ChevronUpIcon as ChevronUpIconSolid, ChevronDownIcon as ChevronDownIconSolid } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';

interface VoteButtonsProps {
  postId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: 'up' | 'down' | null;
  orientation?: 'vertical' | 'horizontal';
  onVoteSuccess?: (newVoteCount: { upvotes: number; downvotes: number }) => void;
}

export const VoteButtons: React.FC<VoteButtonsProps> = ({
  postId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null,
  orientation = 'vertical',
  onVoteSuccess
}) => {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState<'up' | 'down' | null>(userVote);
  const [isVoting, setIsVoting] = useState(false);

  const voteScore = upvotes - downvotes;

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = `/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (isVoting) return; // Prevent multiple simultaneous votes
    
    setIsVoting(true);
    
    try {
      const response = await fetch(`/api/forum/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state based on the server response
        setUpvotes(data.data.upvotes);
        setDownvotes(data.data.downvotes);
        setCurrentVote(data.data.userVote);
        
        // Call success callback if provided
        if (onVoteSuccess) {
          onVoteSuccess({
            upvotes: data.data.upvotes,
            downvotes: data.data.downvotes
          });
        }
      } else {
        throw new Error(data.message || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      // Could show a toast notification here
    } finally {
      setIsVoting(false);
    }
  };

  const containerClass = orientation === 'vertical'
    ? 'flex flex-col items-center'
    : 'flex items-center';

  return (
    <div className={containerClass}>
      <button
        onClick={() => handleVote('up')}
        disabled={isVoting}
        className={`p-1 rounded-full focus:outline-none ${
          currentVote === 'up'
            ? 'text-green-600'
            : 'text-gray-400 hover:text-green-600'
        }`}
        aria-label="Upvote"
      >
        {currentVote === 'up' ? (
          <ChevronUpIconSolid className="h-6 w-6" />
        ) : (
          <ChevronUpIcon className="h-6 w-6" />
        )}
      </button>
      
      <span className={`font-medium text-center mx-1 ${
        voteScore > 0 
          ? 'text-green-600' 
          : voteScore < 0 
            ? 'text-red-600' 
            : 'text-gray-500'
      }`}>
        {voteScore}
      </span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={isVoting}
        className={`p-1 rounded-full focus:outline-none ${
          currentVote === 'down'
            ? 'text-red-600'
            : 'text-gray-400 hover:text-red-600'
        }`}
        aria-label="Downvote"
      >
        {currentVote === 'down' ? (
          <ChevronDownIconSolid className="h-6 w-6" />
        ) : (
          <ChevronDownIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}; 