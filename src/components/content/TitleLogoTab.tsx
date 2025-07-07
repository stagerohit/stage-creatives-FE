import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { API_BASE_URL, COLORS, DIMENSION_OPTIONS, CHANNEL_OPTIONS } from '@/utils/constants';
import TitleLogoGenerationPopup from './TitleLogoGenerationPopup';
import type { Content, TitleLogo, ApiError } from '@/types/content';

interface TitleLogoTabProps {
  content: Content;
}

export default function TitleLogoTab({ content }: TitleLogoTabProps) {
  const [titleLogos, setTitleLogos] = useState<TitleLogo[]>([]);
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

  // Handle new logo generation
  const handleLogoGenerated = (newLogo: TitleLogo) => {
    setTitleLogos(prev => [...prev, newLogo]);
  };

  // Handle create title logo button click
  const handleCreateTitleLogo = () => {
    setIsPopupOpen(true);
  };

  useEffect(() => {
    const fetchTitleLogos = async () => {
      const contentId = getContentId();
      if (!contentId) {
        setError({ message: 'Content ID not found' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await contentService.getTitleLogosByContentId(contentId);
        
        console.log('Title Logos API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        console.log('Title Logos count:', response.length);
        
        // API returns direct array of title logos
        const titleLogos = Array.isArray(response) ? response : [];
        
        // Sort title logos by creation date (newest first)
        const sortedTitleLogos = titleLogos.sort((a: TitleLogo, b: TitleLogo) => {
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
        
        console.log('Setting title logos state with:', sortedTitleLogos);
        setTitleLogos(sortedTitleLogos);
      } catch (err: any) {
        console.error('Failed to fetch title logos:', err);
        // For now, if API fails, show empty state instead of error
        // This allows us to test the UI without requiring backend
        setTitleLogos([]);
        console.log('Setting empty title logos array due to API error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitleLogos();
  }, [content]);

  const getFullImageUrl = (titleLogoUrl: string) => {
    if (titleLogoUrl.startsWith('http')) {
      return titleLogoUrl;
    }
    return `${API_BASE_URL}${titleLogoUrl}`;
  };

  const formatDimension = (dimension: string) => {
    // Convert dimension string like "16:9" to "16 x 9"
    return dimension.replace(':', ' x ');
  };

  const formatChannelName = (channel: string) => {
    return channel.charAt(0).toUpperCase() + channel.slice(1).toLowerCase();
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
              <div className="flex gap-2 justify-center">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
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
            onClick={handleCreateTitleLogo}
          >
            Create Title Logo
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
  if (titleLogos.length === 0) {
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
            onClick={() => {
              // Placeholder for create title logo functionality
              console.log('Create Title Logo clicked');
            }}
          >
            Create Title Logo
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No title logos yet</h3>
            <p className="text-gray-500 mb-4">Create your first title logo to get started</p>
            <Button 
              className="font-semibold"
              style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
              onClick={handleCreateTitleLogo}
            >
              Create First Title Logo
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
          onClick={handleCreateTitleLogo}
        >
          Create Title Logo
        </Button>
      </div>

      {/* Title Logos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {titleLogos.map((titleLogo) => (
          <div key={titleLogo.title_logo_id} className="space-y-3">
            {/* Title Logo Image */}
            <div className="relative overflow-hidden rounded-lg bg-gray-100 group cursor-pointer">
              <img
                src={getFullImageUrl(titleLogo.title_logo_url)}
                alt={`Title Logo ${titleLogo.dimension}`}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  console.error('Image failed to load:', titleLogo.title_logo_url);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
            
            {/* Dimension + Channel Badges */}
            <div className="flex gap-2 justify-center">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{ 
                  backgroundColor: COLORS.SECONDARY + '20',
                  color: COLORS.SECONDARY
                }}
              >
                {formatDimension(titleLogo.dimension)}
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{ 
                  backgroundColor: COLORS.SECONDARY + '20',
                  color: COLORS.SECONDARY
                }}
              >
                {formatChannelName(titleLogo.channel)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Title Logo Generation Popup */}
      <TitleLogoGenerationPopup
        content={content}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onLogoGenerated={handleLogoGenerated}
      />
    </div>
  );
} 