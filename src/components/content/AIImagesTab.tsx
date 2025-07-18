import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { API_BASE_URL, COLORS, DIMENSION_OPTIONS, CHANNEL_OPTIONS } from '@/utils/constants';
import type { Content, AIImage, ApiError } from '@/types/content';

interface AIImagesTabProps {
  content: Content;
}

export default function AIImagesTab({ content }: AIImagesTabProps) {
  const navigate = useNavigate();
  const [aiImages, setAIImages] = useState<AIImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  
  // Placeholder state for dropdowns (no functionality yet)
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  useEffect(() => {
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
        
        console.log('AI Images API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        console.log('AI Images count:', response.length);
        
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
        
        console.log('Setting AI images state with:', sortedAIImages);
        setAIImages(sortedAIImages);
      } catch (err: any) {
        console.error('Failed to fetch AI images:', err);
        // For now, if API fails, show empty state instead of error
        // This allows us to test the UI without requiring backend
        setAIImages([]);
        console.log('Setting empty AI images array due to API error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAIImages();
  }, [content]);

  const getFullImageUrl = (aiImageUrl: string) => {
    if (aiImageUrl.startsWith('http')) {
      return aiImageUrl;
    }
    return `${API_BASE_URL}${aiImageUrl}`;
  };

  const formatDimension = (dimension: string) => {
    // Convert dimension string like "1920:1080" to "1920 x 1080"
    return dimension.replace(':', ' x ');
  };

  const handleCreateAIImage = () => {
    if (content.slug) {
      navigate(`/content-detail/${content.slug}/image-generation`);
    } else {
      console.error('Content slug not found');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header with Loading Skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Grid Loading Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-40" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Dimension" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-32" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleCreateAIImage}
          >
            Create AI Image
          </Button>
        </div>

        {/* Error Alert */}
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty State
  if (aiImages.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-40" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Dimension" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-32" style={{ backgroundColor: 'white' }}>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleCreateAIImage}
          >
            Create AI Image
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No AI images yet</h3>
            <p className="text-gray-500 mb-4">Create your first AI image to get started</p>
            <Button 
              className="font-semibold"
              style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
              onClick={handleCreateAIImage}
            >
              Create First AI Image
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Content - Grid Display
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedDimension} onValueChange={setSelectedDimension}>
            <SelectTrigger className="w-40" style={{ backgroundColor: 'white' }}>
              <SelectValue placeholder="Dimension" />
            </SelectTrigger>
            <SelectContent>
              {DIMENSION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32" style={{ backgroundColor: 'white' }}>
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          className="font-semibold"
          style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
          onClick={handleCreateAIImage}
        >
          Create AI Image
        </Button>
      </div>

      {/* AI Images Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {aiImages.map((aiImage) => (
          <div key={aiImage.ai_image_id} className="space-y-3">
            {/* AI Image */}
            <div className="relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
              <img
                src={getFullImageUrl(aiImage.ai_image_url)}
                alt={`AI Image ${aiImage.dimension}`}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  console.error('Image failed to load:', aiImage.ai_image_url);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
            
            {/* Dimension Badge */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{ 
                  backgroundColor: COLORS.SECONDARY + '20',
                  color: COLORS.SECONDARY
                }}
              >
                {formatDimension(aiImage.dimension)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 