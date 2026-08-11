'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { showAlert, showConfirm } from '@/lib/dialog';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  status: string;
  excerpt?: string;
  tags?: string[];
  viewCount: number;
  authorName?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/marketplace/pages?includeUnpublished=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter only blog posts
        const blogs = data.filter((page: BlogPost) => page.pageType === 'blog');
        setBlogPosts(blogs);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlogPost = async (id: string) => {
    const ok = await showConfirm({ message: 'Are you sure you want to delete this blog post?', confirmText: 'Delete', variant: 'danger' });
    if (!ok) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/marketplace/pages/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchBlogPosts();
      } else {
        showAlert('Failed to delete blog post', 'error');
      }
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      showAlert('Failed to delete blog post', 'error');
    }
  };

  const filteredPosts = blogPosts.filter((post) => {
    if (filter === 'all') return true;
    if (filter === 'published') return post.status === 'published';
    if (filter === 'draft') return post.status === 'draft';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Management</h1>
        <Link
          href="/admin/blog/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Blog Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2 px-4 ${
            filter === 'all' ? 'border-b-2 border-blue-600 font-semibold' : ''
          }`}
        >
          All ({blogPosts.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`pb-2 px-4 ${
            filter === 'published' ? 'border-b-2 border-blue-600 font-semibold' : ''
          }`}
        >
          Published ({blogPosts.filter((p) => p.status === 'published').length})
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`pb-2 px-4 ${
            filter === 'draft' ? 'border-b-2 border-blue-600 font-semibold' : ''
          }`}
        >
          Drafts ({blogPosts.filter((p) => p.status === 'draft').length})
        </button>
      </div>

      {/* Blog Posts Table */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No blog posts yet</p>
          <Link
            href="/admin/blog/new"
            className="text-blue-600 hover:underline"
          >
            Create your first blog post
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    <div className="text-sm text-gray-500">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {post.authorName || 'Admin'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {(post.tags?.length || 0) > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{post.tags!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {post.viewCount || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteBlogPost(post.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
