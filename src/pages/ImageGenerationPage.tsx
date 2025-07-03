import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { contentService } from '@/services/api';
import type { Content } from '@/types/content';

export default function ImageGenerationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const contentData = await contentService.fetchContentBySlug(slug);
        setContent(contentData);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Content not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Placeholder */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Image Generation - {content.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {content.title} &gt; Image Generation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-5 gap-8 h-[calc(100vh-200px)]">
          {/* Left Side - 40% width (2 columns) */}
          <div className="col-span-2 space-y-6">
            {/* Section 1: Textarea */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Section 1 - AI Prompt</h2>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Textarea placeholder</span>
              </div>
            </div>

            {/* Section 2: Image Tabs */}
            <div className="bg-white rounded-lg shadow p-6 flex-1">
              <h2 className="text-lg font-semibold mb-4">Section 2 - Image Tabs</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Images/AI Images tabs placeholder</span>
              </div>
            </div>
          </div>

          {/* Right Side - 60% width (3 columns) */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-6 h-full">
              <h2 className="text-lg font-semibold mb-4">Section 3 - Generated Results</h2>
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Generated results will appear here</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Controls:</span>
              <div className="w-32 h-10 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-sm text-gray-500">Dimension</span>
              </div>
            </div>
            <div className="w-24 h-10 bg-green-500 rounded flex items-center justify-center">
              <span className="text-sm text-white">Generate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 