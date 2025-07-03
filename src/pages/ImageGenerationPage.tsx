import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { contentService } from '@/services/api';
import AIPromptTextarea from '@/components/content/AIPromptTextarea';
import ImageSelectionTabs from '@/components/content/ImageSelectionTabs';
import type { Content } from '@/types/content';

export default function ImageGenerationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const maxSelections = 3;

  const handleImageSelect = (imageId: string, isSelected: boolean) => {
    if (isSelected) {
      // Add to selection if not already selected and under limit
      if (!selectedImages.includes(imageId) && selectedImages.length < maxSelections) {
        setSelectedImages(prev => [...prev, imageId]);
      }
    } else {
      // Remove from selection
      setSelectedImages(prev => prev.filter(id => id !== imageId));
    }
  };

  const handleGenerate = (dimension: string) => {
    // TODO: Implement generate functionality
    console.log('Generate clicked with:', {
      selectedImages,
      dimension,
      aiPrompt
    });
  };

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
          <div className="col-span-2 flex flex-col h-full">
            {/* Section 1: AI Prompt Textarea - Fixed Height */}
            <div className="bg-white rounded-lg shadow p-2 mb-6" style={{ height: '300px' }}>
              <div className="h-[278px]">
                <AIPromptTextarea
                  value={aiPrompt}
                  onChange={setAiPrompt}
                />
              </div>
            </div>

            {/* Section 2: Image Selection Tabs - Calculated Height */}
            <div 
              className="bg-white rounded-lg shadow" 
              style={{ height: 'calc(100% - 300px - 24px)' }}
            >
              <ImageSelectionTabs 
                content={content}
                selectedImages={selectedImages}
                onImageSelect={handleImageSelect}
                maxSelections={maxSelections}
                onGenerate={handleGenerate}
              />
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