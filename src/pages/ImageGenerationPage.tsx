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
    <div className="h-screen bg-gray-50">
      {/* Main Content */}
      <div className="h-full p-4">
        <div className="grid grid-cols-5 gap-8 h-full">
          {/* Left Side - 40% width (2 columns) */}
          <div className="col-span-2 flex flex-col gap-6 h-full">
            {/* Section 1: Textarea */}
            <div className="bg-white rounded-lg shadow p-2">
              <div className="h-[278px] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Textarea placeholder</span>
              </div>
            </div>

            {/* Section 2: Image Tabs */}
            <div className="bg-white rounded-lg shadow p-2 flex-1 flex flex-col">
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-gray-500">Images/AI Images tabs placeholder</span>
              </div>
              
              {/* Controls: Dimension and Generate */}
              <div className="flex justify-between items-center">
                <div className="w-32 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-sm text-gray-500">Dimension</span>
                </div>
                <div className="w-24 h-10 bg-green-500 rounded flex items-center justify-center">
                  <span className="text-sm text-white">Generate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - 60% width (3 columns) */}
          <div className="col-span-3 h-full">
            <div className="bg-white rounded-lg shadow p-2 h-full">
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Generated results will appear here</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 