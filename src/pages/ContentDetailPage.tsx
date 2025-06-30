import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { contentService } from '@/services/api';
import { COLORS } from '@/utils/constants';
import type { Content, ApiError } from '@/types/content';

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) {
        setError({ message: 'Content ID is required' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await contentService.getContentById(id);
        
        if (response.success && response.data) {
          setContent(response.data);
        } else {
          setError({ message: response.message || 'Content not found' });
        }
      } catch (err) {
        setError({ message: 'Failed to fetch content details' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Display */}
        {content && !isLoading && !error && (
          <Card>
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded-t-lg">
                {content.thumbnailURL ? (
                  <img
                    src={content.thumbnailURL}
                    alt={content.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <div className="text-gray-400 text-lg">No Image Available</div>
                  </div>
                )}
              </div>
              
              {/* Content Info */}
              <div className="p-8">
                <h1 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {content.title}
                </h1>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                      style={{ 
                        backgroundColor: COLORS.CONTENT_BADGE + '20',
                        color: COLORS.CONTENT_BADGE
                      }}
                    >
                      {content.contentType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Created: {formatDate(content.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Content Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">ID:</span>
                      <span className="text-gray-600 ml-2">{content._id || content.id || content.oldContentId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="text-gray-600 ml-2">{content.contentType}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="text-gray-600 ml-2">{formatDate(content.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Updated:</span>
                      <span className="text-gray-600 ml-2">{formatDate(content.updatedAt)}</span>
                    </div>
                    {content.dialect && (
                      <div>
                        <span className="font-medium text-gray-700">Dialect:</span>
                        <span className="text-gray-600 ml-2">{content.dialect}</span>
                      </div>
                    )}
                    {content.language && (
                      <div>
                        <span className="font-medium text-gray-700">Language:</span>
                        <span className="text-gray-600 ml-2">{content.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 