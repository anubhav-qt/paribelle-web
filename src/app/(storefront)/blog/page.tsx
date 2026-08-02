'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import { formatDate as formatDateUtil } from '@/lib/utils/date';
import { htmlToText } from '@/lib/utils/string';
import { Loader } from '@/components/ui/Loader';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  tags: string[];
  authorName: string;
  viewCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages?pageType=blog&status=published`
        );
        
        if (response.ok) {
          const data = await response.json();
          // Sort by publishedAt or createdAt, newest first
          const sorted = data.sort((a: BlogPost, b: BlogPost) => {
            const dateA = new Date(a.publishedAt || a.createdAt).getTime();
            const dateB = new Date(b.publishedAt || b.createdAt).getTime();
            return dateB - dateA;
          });
          setPosts(sorted);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Get all unique tags
  const allTags = Array.from(
    new Set(posts.flatMap(post => post.tags || []))
  ).sort();

  // Filter posts by selected tag
  const filteredPosts = selectedTag
    ? posts.filter(post => post.tags?.includes(selectedTag))
    : posts;

  const formatDate = formatDateUtil; // Using centralized utility
  const stripHtml = htmlToText; // Using centralized utility

  return (
    <>
      <HeroCarousel />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog</h1>
            <p className="text-xl text-gray-600">
              Latest news, updates, and insights
            </p>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedTag
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Posts
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader size="md" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading blog posts...</p>
            </div>
          )}

          {/* No Posts */}
          {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                {selectedTag
                  ? `No blog posts found with tag "${selectedTag}"`
                  : 'No blog posts available yet.'}
              </p>
            </div>
          )}

          {/* Blog Posts Grid */}
          {!isLoading && filteredPosts.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map(post => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                      <Link
                        href={`/${post.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt || stripHtml(post.content).slice(0, 150) + '...'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        {post.authorName && (
                          <span className="font-medium">{post.authorName}</span>
                        )}
                      </div>
                      <div>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                    </div>

                    {/* Read More Link */}
                    <div className="mt-4">
                      <Link
                        href={`/${post.slug}`}
                        className="text-primary font-medium hover:underline inline-flex items-center"
                      >
                        Read More
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

    </>
  );
}
