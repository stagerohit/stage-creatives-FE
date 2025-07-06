import { useState, useEffect } from 'react';
import { contentService } from '@/services/api';
import { API_BASE_URL } from '@/utils/constants';
import type { Content, AIImage, ApiError } from '@/types/content';

interface AIImageSelectionTabProps {
  content: Content;
  selectedImages: string[];
  onImageSelect: (imageId: string, isSelected: boolean) => void;
  maxSelections: number;
}

export default function AIImageSelectionTab({ 
  content, 
  selectedImages, 
  onImageSelect, 
  maxSelections 
}: AIImageSelectionTabProps) {
  const [aiImages, setAIImages] = useState<AIImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  const fetchAIImages = async () => {
    const contentId = getContentId();
    if (!contentId) {
      setError({ message: 'Content ID not found' });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await contentService.getAIImagesByContentId(contentId);
      
      // API returns direct array of AI images
      const aiImages = Array.isArray(response) ? response : [];
      
      // Sort AI images by creation date (newest first)
      const sortedAIImages = aiImages.sort((a: AIImage, b: AIImage) => {
        // Get creation date from either created_at or createdAt
        const dateA = a.created_at || a.createdAt;
        const dateB = b.created_at || b.createdAt;
        
        // If both have dates, sort by date (newest first)
        if (dateA && dateB) {
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        
        // If only one has a date, the one with date comes first
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        
        // If neither has a date, maintain original order
        return 0;
      });
      
      setAIImages(sortedAIImages);
    } catch (err: any) {
      console.error('Failed to fetch AI images:', err);
      setAIImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIImages();
  }, [content]);

  const getFullImageUrl = (aiImageUrl: string) => {
    if (aiImageUrl.startsWith('http')) {
      return aiImageUrl;
    }
    return `${API_BASE_URL}${aiImageUrl}`;
  };



  const handleImageClick = (imageId: string) => {
    const prefixedId = `ai_image_${imageId}`;
    const isCurrentlySelected = selectedImages.includes(prefixedId);
    
    if (isCurrentlySelected) {
      // If already selected, deselect it
      onImageSelect(prefixedId, false);
    } else {
      // If not selected, check if we can select more
      if (selectedImages.length < maxSelections) {
        onImageSelect(prefixedId, true);
      }
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[1px]">
          {[...Array(8)].map((_, index) => (
            <div key={index}>
              <div className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading AI images</div>
        <div className="text-sm text-gray-500">{error.message}</div>
      </div>
    );
  }

  // Empty State
  if (aiImages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No AI images found</h3>
        <p className="text-gray-500">No AI images available for this content</p>
      </div>
    );
  }

  // Main Content - Grid Display
  return (
    <div>
      {/* AI Images Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[1px]">
        {aiImages.map((aiImage) => {
          const prefixedId = `ai_image_${aiImage.ai_image_id}`;
          const isSelected = selectedImages.includes(prefixedId);
          const canSelect = selectedImages.length < maxSelections || isSelected;
          
          return (
            <div key={aiImage.ai_image_id}>
              {/* AI Image with Checkbox Overlay */}
              <div 
                className={`relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer transition-all duration-200 ${
                  !canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => canSelect && handleImageClick(aiImage.ai_image_id)}
              >
                <img
                  src={getFullImageUrl(aiImage.ai_image_url)}
                  alt={`AI Image ${aiImage.dimension}`}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                
                {/* Checkbox Overlay - Only visible on hover or when selected */}
                <div className={`absolute top-2 right-2 transition-opacity duration-200 ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-white/80 border-gray-300 hover:border-gray-400'
                  }`}>
                    {isSelected && (
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 