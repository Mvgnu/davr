'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CalendarIcon, 
  UserCircleIcon, 
  ArrowLeftIcon, 
  TagIcon,
  ShareIcon,
  HandThumbUpIcon,
  ClockIcon,
  BookmarkIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';
import BlogComments from '@/components/BlogComments';

// Define the types for our blog post data
interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  slug?: string;
  author: string;
  authorTitle: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface RelatedPost {
  _id: string;
  title: string;
  excerpt: string;
  image: string;
  slug?: string;
  category: string;
  date: string;
}

// Generate the schema.org JSON-LD markup for the blog post
function generateBlogPostSchema(post: BlogPost, readingTime: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.date,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Aluminium Recycling Deutschland',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.aluminium-recycling-deutschland.de/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.aluminium-recycling-deutschland.de/blog/${post.slug || post._id}`
    },
    keywords: post.tags?.join(', ') || '',
    wordCount: post.content.split(/\s+/).length,
    timeRequired: `PT${readingTime}M`,
    articleSection: post.category,
    inLanguage: 'de-DE'
  };
}

// Parse markdown-style content into HTML
const parseContent = (content: string) => {
  // Replace line breaks with paragraphs
  let parsedContent = content.split('\n\n').map(para => 
    para.trim() ? `<p>${para}</p>` : ''
  ).join('');
  
  // Replace bold markdown with HTML
  parsedContent = parsedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace headers
  parsedContent = parsedContent.replace(/## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  parsedContent = parsedContent.replace(/### (.*?)$/gm, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
  
  // Handle list items
  let listItemsPattern = /^\* (.*?)$/gm;
  // Gather all list items
  const listItems: string[] = [];
  let match;
  while ((match = listItemsPattern.exec(parsedContent)) !== null) {
    listItems.push(`<li class="ml-6 mb-2">${match[1]}</li>`);
  }
  
  // If we have list items, replace them with a proper list
  if (listItems.length > 0) {
    // Create a regex pattern that will match all list items as a block
    const listItemsAsString = listItems.map(item => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const listBlockPattern = new RegExp(`(${listItemsAsString})`, 'g');
    
    // First remove all individual list items
    parsedContent = parsedContent.replace(listItemsPattern, '');
    
    // Then wrap all list items in a ul tag
    parsedContent += `<ul class="list-disc my-4">${listItems.join('')}</ul>`;
  }
  
  return parsedContent;
};

interface ClientBlogPostProps {
  postId: string;
}

export default function ClientBlogPost({ postId }: ClientBlogPostProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate estimated reading time
  const readingTime = post ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : 0;
  
  // Fetch the blog post and related posts
  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!postId) {
          setError('Artikel-ID oder Slug fehlt');
          setLoading(false);
          return;
        }
        
        // Fetch the blog post - postId could be either an ID or a slug
        console.log(`Fetching blog post with ID/slug: ${postId}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
          const response = await fetch(`/api/blog/${postId}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
            throw new Error(errorData.message || `API error (${response.status})`);
          }
          
          const data = await response.json();
          
          if (data.success && data.data) {
            console.log('Blog post data received:', data.data);
            setPost(data.data);
            
            // Handle related posts if available
            if (data.relatedPosts) {
              setRelatedPosts(data.relatedPosts);
            } else {
              setRelatedPosts([]);
            }
          } else {
            throw new Error(data.message || 'Artikel konnte nicht gefunden werden');
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            throw new Error('Zeitüberschreitung bei der Anfrage. Bitte versuchen Sie es später erneut.');
          }
          throw fetchErr;
        }
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError(`Es gab ein Problem beim Laden des Artikels: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogPost();
  }, [postId]);
  
  // Format date to German locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="max-w-4xl mx-auto mb-12">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="flex space-x-6">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-80 bg-gray-200 rounded-xl mb-10"></div>
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-4xl mx-auto">
          <p className="text-red-700 mb-4">{error || 'Artikel konnte nicht gefunden werden'}</p>
          <Link href="/blog" className="inline-flex items-center text-red-600 hover:text-red-700">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBlogPostSchema(post, readingTime))
        }}
      />
    
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Blog post header */}
        <div className="max-w-4xl mx-auto mb-12">
          {/* Back navigation */}
          <Link 
            href="/blog" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-8 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Link>
        
          {/* Category */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {post.category}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900">{post.title}</h1>
          
          {/* Post meta */}
          <div className="flex flex-wrap items-center text-gray-500 mb-8">
            <div className="flex items-center mr-6 mb-2">
              <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center mr-6 mb-2">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span>{readingTime} min Lesezeit</span>
            </div>
          </div>
          
          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-8 font-medium leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      
        {/* Article content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main content area */}
          <div className="lg:col-span-8">
            {/* Hero image */}
            {post.image && (
              <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-w-16 aspect-h-9 relative h-96">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
              </div>
            )}
            
            {/* Article content */}
            <div 
              className="prose prose-lg max-w-none mb-16 prose-headings:text-gray-900 prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline" 
              dangerouslySetInnerHTML={{ __html: parseContent(post.content) }}
            />
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="border-t border-b border-gray-200 py-6 mb-16">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-700 font-medium">Tags:</span>
                  {post.tags.map(tag => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-sm transition-colors"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Author info */}
            <div className="bg-gray-50 rounded-xl p-6 mb-16 flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <UserCircleIcon className="h-10 w-10" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{post.author}</h3>
                <p className="text-sm text-gray-500 mb-3">{post.authorTitle}</p>
                <p className="text-gray-700">
                  Ein erfahrener Autor im Bereich nachhaltige Recyclingmethoden und Abfallwirtschaft mit besonderem Fokus auf Aluminium-Recycling in Deutschland.
                </p>
              </div>
            </div>
            
            {/* Comments section */}
            <BlogComments blogPostId={post._id} blogPostTitle={post.title} />
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-4">
            {/* Share widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Artikel teilen</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
                  className="flex-1 bg-[#1DA1F2] text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
                  aria-label="Auf Twitter teilen"
                >
                  <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.02 10.02 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </button>
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex-1 bg-[#4267B2] text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
                  aria-label="Auf Facebook teilen"
                >
                  <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
                <button 
                  onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(post.title)}`, '_blank')}
                  className="flex-1 bg-[#0A66C2] text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
                  aria-label="Auf LinkedIn teilen"
                >
                  <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link wurde in die Zwischenablage kopiert!');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-colors"
                  aria-label="Link kopieren"
                >
                  <ShareIcon className="h-5 w-5 mx-auto" />
                </button>
              </div>
            </div>
            
            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Ähnliche Artikel</h3>
                <div className="space-y-4">
                  {relatedPosts.map(related => (
                    <Link 
                      key={related._id} 
                      href={`/blog/${related.slug || related._id}`} 
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden">
                          <Image 
                            src={related.image || '/images/blog-placeholder.jpg'} 
                            alt={related.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
                            {related.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(related.date)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Newsletter signup */}
            <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl p-6 mb-8 text-white">
              <h3 className="font-bold mb-3">Newsletter abonnieren</h3>
              <p className="text-green-100 text-sm mb-4">
                Erhalten Sie die neuesten Nachrichten und Artikel direkt in Ihren Posteingang.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Ihre E-Mail-Adresse"
                  className="w-full p-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-white/40 focus:border-transparent"
                />
                <button 
                  type="submit"
                  className="w-full bg-white text-green-800 font-medium py-2 rounded-lg text-sm hover:bg-green-50 transition-colors"
                >
                  Abonnieren
                </button>
              </form>
            </div>
            
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Kategorien</h3>
              <div className="space-y-2">
                {[
                  'Technologie',
                  'Tipps & Tricks',
                  'Politik',
                  'Wirtschaft',
                  'Nachhaltigkeit',
                  'Umwelt',
                  'Kreislaufwirtschaft'
                ].map(category => (
                  <Link 
                    key={category} 
                    href={`/blog?category=${encodeURIComponent(category)}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-gray-700 group-hover:text-green-600 transition-colors">
                      {category}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {Math.floor(Math.random() * 20) + 1}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 