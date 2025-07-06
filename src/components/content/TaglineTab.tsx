import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { API_BASE_URL, COLORS, DIMENSION_OPTIONS, CHANNEL_OPTIONS } from '@/utils/constants';
import TaglineGenerationPopup from './TaglineGenerationPopup';
import type { Content, Tagline, ApiError } from '@/types/content';

interface TaglineTabProps {
  content: Content;
}

export default function TaglineTab({ content }: TaglineTabProps) {
  const [taglines, setTaglines] = useState<Tagline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Placeholder state for dropdowns (no functionality yet)
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  // Handle new tagline generation
  const handleTaglineGenerated = (newTagline: Tagline) => {
    setTaglines(prev => [...prev, newTagline]);
  };

  // Handle create tagline button click
  const handleCreateTagline = () => {
    setIsPopupOpen(true);
  };

  useEffect(() => {
    const fetchTaglines = async () => {
      const contentId = getContentId();
      if (!contentId) {
        setError({ message: 'Content ID not found' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await contentService.getTaglinesByContentId(contentId);
        
        console.log('Taglines API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        console.log('Taglines count:', response.length);
        
        // API returns direct array of taglines
        const taglines = Array.isArray(response) ? response : [];
        
        // Sort taglines by creation date (earliest first)
        const sortedTaglines = taglines.sort((a: Tagline, b: Tagline) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        console.log('Setting taglines state with:', sortedTaglines);
        setTaglines(sortedTaglines);
      } catch (err: any) {
        console.error('Failed to fetch taglines:', err);
        // For now, if API fails, show empty state instead of error
        // This allows us to test the UI without requiring backend
        setTaglines([]);
        console.log('Setting empty taglines array due to API error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaglines();
  }, [content]);

  const getFullImageUrl = (taglineUrl: string) => {
    if (taglineUrl.startsWith('http')) {
      return taglineUrl;
    }
    return `${API_BASE_URL}${taglineUrl}`;
  };

  const formatDimension = (dimension: string) => {
    // Convert dimension string like "16:9" to "16 x 9"
    return dimension.replace(':', ' x ');
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
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-32">
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
            onClick={handleCreateTagline}
          >
            Create Tagline
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
  if (taglines.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Select value={selectedDimension} onValueChange={setSelectedDimension}>
              <SelectTrigger className="w-40">
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
              <SelectTrigger className="w-32">
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
            onClick={handleCreateTagline}
          >
            Create Tagline
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No taglines yet</h3>
            <p className="text-gray-500 mb-4">Create your first tagline to get started</p>
            <Button 
              className="font-semibold"
              style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
              onClick={handleCreateTagline}
            >
              Create First Tagline
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
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-32">
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
          onClick={handleCreateTagline}
        >
          Create Tagline
        </Button>
      </div>

      {/* Taglines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {taglines.map((tagline) => (
          <div key={tagline.tagline_id} className="space-y-3">
            {/* Tagline Image */}
            <div className="relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
              <img
                src={getFullImageUrl(tagline.tagline_url)}
                alt={`Tagline ${tagline.dimension}`}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  console.error('Image failed to load:', tagline.tagline_url);
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
                {formatDimension(tagline.dimension)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tagline Generation Popup */}
      <TaglineGenerationPopup
        content={content}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onTaglineGenerated={handleTaglineGenerated}
      />
    </div>
  );
} 