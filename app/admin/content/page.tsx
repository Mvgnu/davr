import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content Management | Admin Dashboard | DAVR',
  description: 'Manage static content, blog posts, or other content sections.',
};

export default function AdminContentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Content Management</h1>
      <p className="text-gray-600">
        This section is under development. Content management features (e.g., blog posts, static pages) will be available here.
      </p>
      {/* Add content management components here later */}
    </div>
  );
} 