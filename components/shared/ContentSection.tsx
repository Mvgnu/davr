'use client';

import React from 'react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Define the various content block types that can be displayed
export type ContentBlock = 
  | InfoBlock
  | WarningBlock
  | SuccessBlock
  | CardBlock
  | ImageBlock
  | CTABlock
  | ListBlock
  | StatsBlock;

interface BaseBlock {
  id: string;
  type: string;
}

export interface InfoBlock extends BaseBlock {
  type: 'info';
  title?: string;
  content: string;
  variant?: 'default' | 'highlight';
}

export interface WarningBlock extends BaseBlock {
  type: 'warning';
  title?: string;
  content: string;
  variant?: 'default' | 'critical';
}

export interface SuccessBlock extends BaseBlock {
  type: 'success';
  title?: string;
  content: string;
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  title: string;
  content: string;
  icon?: string;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'gray';
  link?: {
    text: string;
    url: string;
  };
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

export interface CTABlock extends BaseBlock {
  type: 'cta';
  title: string;
  content: string;
  primaryButton?: {
    text: string;
    url: string;
  };
  secondaryButton?: {
    text: string;
    url: string;
  };
  variant?: 'default' | 'highlight' | 'minimal';
}

export interface ListItem {
  text: string;
  description?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  title?: string;
  items: ListItem[];
  ordered?: boolean;
  iconType?: 'check' | 'arrow' | 'number' | 'none';
}

export interface Stat {
  value: string | number;
  label: string;
  trend?: number;
}

export interface StatsBlock extends BaseBlock {
  type: 'stats';
  title?: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  blocks: ContentBlock[];
  className?: string;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  blocks,
  className = ''
}) => {
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'info':
        return <InfoCallout key={block.id} block={block} />;
      case 'warning':
        return <WarningCallout key={block.id} block={block} />;
      case 'success':
        return <SuccessCallout key={block.id} block={block} />;
      case 'card':
        return <ContentCard key={block.id} block={block} />;
      case 'image':
        return <ContentImage key={block.id} block={block} />;
      case 'cta':
        return <CallToAction key={block.id} block={block} />;
      case 'list':
        return <ContentList key={block.id} block={block} />;
      case 'stats':
        return <StatsDisplay key={block.id} block={block} />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {title && (
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      <div className="space-y-6">
        {blocks.map(renderBlock)}
      </div>
    </div>
  );
};

// Component for information callouts
const InfoCallout: React.FC<{ block: InfoBlock }> = ({ block }) => {
  const isHighlight = block.variant === 'highlight';
  
  return (
    <div className={`rounded-lg p-5 flex items-start ${
      isHighlight 
        ? 'bg-blue-50 border border-blue-100' 
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className={`flex-shrink-0 mr-4 p-2 rounded-full ${
        isHighlight ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        <Info className={`w-5 h-5 ${isHighlight ? 'text-blue-600' : 'text-gray-600'}`} />
      </div>
      <div>
        {block.title && (
          <h4 className={`font-semibold text-lg mb-1 ${
            isHighlight ? 'text-blue-700' : 'text-gray-800'
          }`}>
            {block.title}
          </h4>
        )}
        <div className="text-gray-700">{block.content}</div>
      </div>
    </div>
  );
};

// Component for warning callouts
const WarningCallout: React.FC<{ block: WarningBlock }> = ({ block }) => {
  const isCritical = block.variant === 'critical';
  
  return (
    <div className={`rounded-lg p-5 flex items-start ${
      isCritical 
        ? 'bg-red-50 border border-red-100' 
        : 'bg-amber-50 border border-amber-100'
    }`}>
      <div className={`flex-shrink-0 mr-4 p-2 rounded-full ${
        isCritical ? 'bg-red-100' : 'bg-amber-100'
      }`}>
        <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
      </div>
      <div>
        {block.title && (
          <h4 className={`font-semibold text-lg mb-1 ${
            isCritical ? 'text-red-700' : 'text-amber-700'
          }`}>
            {block.title}
          </h4>
        )}
        <div className="text-gray-700">{block.content}</div>
      </div>
    </div>
  );
};

// Component for success callouts
const SuccessCallout: React.FC<{ block: SuccessBlock }> = ({ block }) => {
  return (
    <div className="bg-green-50 border border-green-100 rounded-lg p-5 flex items-start">
      <div className="flex-shrink-0 mr-4 p-2 bg-green-100 rounded-full">
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>
      <div>
        {block.title && (
          <h4 className="font-semibold text-lg mb-1 text-green-700">
            {block.title}
          </h4>
        )}
        <div className="text-gray-700">{block.content}</div>
      </div>
    </div>
  );
};

// Component for content cards
const ContentCard: React.FC<{ block: CardBlock }> = ({ block }) => {
  const colorMap = {
    green: 'border-green-200 bg-green-50',
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    purple: 'border-purple-200 bg-purple-50',
    gray: 'border-gray-200 bg-gray-50'
  };
  
  const textColorMap = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
    gray: 'text-gray-700'
  };
  
  const color = block.color || 'gray';
  
  return (
    <div className={`rounded-lg p-6 border ${colorMap[color]} transition-all duration-300 hover:shadow-md`}>
      <h4 className={`text-xl font-semibold mb-3 ${textColorMap[color]}`}>{block.title}</h4>
      <p className="text-gray-700 mb-4">{block.content}</p>
      
      {block.link && (
        <Link href={block.link.url} className={`flex items-center font-medium ${textColorMap[color]} hover:underline`}>
          {block.link.text}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

// Component for images
const ContentImage: React.FC<{ block: ImageBlock }> = ({ block }) => {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-lg shadow-md">
        <Image 
          src={block.src} 
          alt={block.alt} 
          width={block.width} 
          height={block.height}
          className="w-full h-auto object-cover"
        />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-sm text-gray-600 text-center">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
};

// Component for call to actions
const CallToAction: React.FC<{ block: CTABlock }> = ({ block }) => {
  let bgClass = 'bg-gray-50 border border-gray-200';
  let titleClass = 'text-gray-900';
  let textClass = 'text-gray-700';
  
  if (block.variant === 'highlight') {
    bgClass = 'bg-gradient-to-r from-green-600 to-green-800 text-white';
    titleClass = 'text-white';
    textClass = 'text-green-100';
  } else if (block.variant === 'minimal') {
    bgClass = 'bg-white border-t border-b border-gray-200';
  }
  
  return (
    <div className={`p-8 ${bgClass} rounded-lg`}>
      <div className="text-center max-w-3xl mx-auto">
        <h3 className={`text-2xl font-bold mb-4 ${titleClass}`}>{block.title}</h3>
        <p className={`mb-6 ${textClass}`}>{block.content}</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {block.primaryButton && (
            <Link 
              href={block.primaryButton.url}
              className={block.variant === 'highlight' 
                ? "bg-white text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors inline-flex items-center justify-center"
                : "bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center justify-center"
              }
            >
              {block.primaryButton.text}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          )}
          
          {block.secondaryButton && (
            <Link 
              href={block.secondaryButton.url}
              className={block.variant === 'highlight' 
                ? "bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-900 border border-green-500 transition-colors inline-flex items-center justify-center"
                : "border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
              }
            >
              {block.secondaryButton.text}
              <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for lists
const ContentList: React.FC<{ block: ListBlock }> = ({ block }) => {
  const getIcon = (index: number) => {
    switch (block.iconType) {
      case 'check':
        return (
          <div className="flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'arrow':
        return (
          <div className="flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'number':
        return (
          <div className="flex-shrink-0 w-6 h-6 mr-3 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
            {index + 1}
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4">
      {block.title && (
        <h4 className="text-xl font-semibold text-gray-900">{block.title}</h4>
      )}
      
      <div className="space-y-3">
        {block.items.map((item, index) => (
          <div key={index} className="flex items-start">
            {block.iconType !== 'none' && getIcon(index)}
            <div>
              <div className="text-gray-800 font-medium">{item.text}</div>
              {item.description && (
                <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for displaying statistics
const StatsDisplay: React.FC<{ block: StatsBlock }> = ({ block }) => {
  const columns = block.columns || 4;
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4'
  }[columns];
  
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      {block.title && (
        <h4 className="text-xl font-semibold text-gray-800 mb-6">{block.title}</h4>
      )}
      
      <div className={`grid ${colClass} gap-6`}>
        {block.stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stat.value}
              {stat.trend !== undefined && (
                <span className={`text-sm ml-1 ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentSection; 