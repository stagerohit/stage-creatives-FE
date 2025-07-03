import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { COLORS, CHANNEL_OPTIONS } from '@/utils/constants';
import type { Content, Copy, ApiError } from '@/types/content';

interface CopiesTabProps {
  content: Content;
}

export default function CopiesTab({ content }: CopiesTabProps) {
  const [copies, setCopies] = useState<Copy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [expandedCopies, setExpandedCopies] = useState<Set<string>>(new Set());
  
  // Placeholder state for dropdown (no functionality yet)
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  useEffect(() => {
    const fetchCopies = async () => {
      const contentId = getContentId();
      if (!contentId) {
        setError({ message: 'Content ID not found' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await contentService.getCopiesByContentId(contentId);
        
        console.log('Copies API Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array:', Array.isArray(response));
        console.log('Copies count:', response.length);
        
        // API returns direct array of copies
        const copies = Array.isArray(response) ? response : [];
        
        // Sort copies by creation date (earliest first)
        const sortedCopies = copies.sort((a: Copy, b: Copy) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        console.log('Setting copies state with:', sortedCopies);
        setCopies(sortedCopies);
      } catch (err: any) {
        console.error('Failed to fetch copies:', err);
        // For now, if API fails, show empty state instead of error
        // This allows us to test the UI without requiring backend
        setCopies([]);
        console.log('Setting empty copies array due to API error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCopies();
  }, [content]);

  const toggleExpanded = (copyId: string) => {
    setExpandedCopies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(copyId)) {
        newSet.delete(copyId);
      } else {
        newSet.add(copyId);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Grid Loading Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
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
            onClick={() => {
              // Placeholder for create copy functionality
              console.log('Create Copy clicked');
            }}
          >
            Create Copy
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
  if (copies.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
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
            onClick={() => {
              // Placeholder for create copy functionality
              console.log('Create Copy clicked');
            }}
          >
            Create Copy
          </Button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No copies yet</h3>
            <p className="text-gray-500 mb-4">Create your first copy to get started</p>
            <Button 
              className="font-semibold"
              style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
              onClick={() => {
                // Placeholder for create copy functionality
                console.log('Create Copy clicked');
              }}
            >
              Create First Copy
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
          onClick={() => {
            // Placeholder for create copy functionality
            console.log('Create Copy clicked');
          }}
        >
          Create Copy
        </Button>
      </div>

      {/* Copies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {copies.map((copy) => (
          <div 
            key={copy.copy_id} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Copy Text - Newspaper Style */}
            <div className="mb-4">
              <div className="text-gray-800 leading-relaxed font-serif text-sm">
                {expandedCopies.has(copy.copy_id) ? (
                  <span className="whitespace-pre-line">{copy.copy}</span>
                ) : (
                  <span className="whitespace-pre-line">{truncateText(copy.copy)}</span>
                )}
              </div>
              
              {/* Read More/Less Button */}
              {copy.copy.length > 150 && (
                <button
                  onClick={() => toggleExpanded(copy.copy_id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 focus:outline-none focus:underline"
                >
                  {expandedCopies.has(copy.copy_id) ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
            
            {/* Channel Badge */}
            <div className="flex justify-start">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                style={{ 
                  backgroundColor: COLORS.SECONDARY + '20',
                  color: COLORS.SECONDARY
                }}
              >
                {formatChannelName(copy.channel)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 