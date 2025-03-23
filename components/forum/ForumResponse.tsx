import React from 'react';
import { UserCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { VoteButtons } from './VoteButtons';

export interface ForumResponseType {
  _id: string;
  content: string;
  userId: {
    _id: string;
    username: string;
  };
  postId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  userVote?: 'up' | 'down' | null;
}

interface ForumResponseProps {
  response: ForumResponseType;
  onVoteSuccess?: (responseId: string, newVotes: { upvotes: number; downvotes: number }) => void;
}

export const ForumResponse: React.FC<ForumResponseProps> = ({ response, onVoteSuccess }) => {
  // Format the creation date as a relative time (e.g. "3 hours ago")
  const formattedDate = formatDistanceToNow(new Date(response.createdAt), {
    addSuffix: true,
    locale: de
  });

  const handleVoteSuccess = (newVotes: { upvotes: number; downvotes: number }) => {
    if (onVoteSuccess) {
      onVoteSuccess(response._id, newVotes);
    }
  };

  return (
    <div className="p-5 border-b border-gray-200 last:border-0">
      <div className="flex">
        {/* Vote buttons */}
        <div className="mr-4">
          <VoteButtons
            postId={response._id}
            initialUpvotes={response.upvotes}
            initialDownvotes={response.downvotes}
            userVote={response.userVote}
            onVoteSuccess={handleVoteSuccess}
          />
        </div>
        
        {/* Response content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <UserCircleIcon className="h-6 w-6 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">
                {response.userId.username || 'Anonymous'}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formattedDate}
            </div>
          </div>
          
          <div className="prose prose-green max-w-none">
            <p className="text-gray-700">{response.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 