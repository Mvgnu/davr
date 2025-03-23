import React from 'react';
import Link from 'next/link';
import { ChatBubbleLeftRightIcon, TagIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  userId: string | {
    _id: string;
    username?: string;
    name?: string;
  };
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
  isResponse: boolean;
}

interface ForumCardProps {
  post: ForumPost;
}

export const ForumCard: React.FC<ForumCardProps> = ({ post }) => {
  // Format the creation date as a relative time (e.g. "3 hours ago")
  const formattedDate = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: de
  });

  // Calculate vote score
  const voteScore = post.upvotes - post.downvotes;
  
  // Truncate content for preview
  const truncatedContent = post.content.length > 150 
    ? `${post.content.substring(0, 150)}...` 
    : post.content;
    
  // Get username safely regardless of userId format
  const getUsername = () => {
    if (typeof post.userId === 'string') {
      return 'Anonymous';
    } else if (typeof post.userId === 'object' && post.userId) {
      return post.userId.username || post.userId.name || 'Anonymous';
    }
    return 'Anonymous';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/forum/${post._id}`} className="block p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {post.category}
          </span>
          <div className="flex items-center text-gray-500 text-sm">
            <ClockIcon className="h-4 w-4 mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
        
        <p className="text-gray-600 mb-4">{truncatedContent}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags && post.tags.map(tag => (
            <span 
              key={tag} 
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <UserIcon className="h-4 w-4 mr-1" />
            <span>{getUsername()}</span>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              <span>{post.responseCount || 0}</span>
            </div>
            
            <div className="flex items-center">
              <span className={`font-medium ${voteScore > 0 ? 'text-green-600' : voteScore < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {voteScore > 0 ? `+${voteScore}` : voteScore}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}; 