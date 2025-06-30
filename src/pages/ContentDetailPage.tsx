import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
// import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { contentService } from '@/services/api';
import { useContentStore } from '@/store/useContentStore';
import { COLORS } from '@/utils/constants';
import type { Content, ApiError } from '@/types/content';

export default function ContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { contents } = useContentStore();
  
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isCreatingContent, setIsCreatingContent] = useState(false);

  // Get content data from home page store for thumbnail and basic info
  const homePageContent = contents.find((item: Content) => item.slug === slug);

  useEffect(() => {
    const handleContentCreation = async () => {
      if (!slug) {
        setError({ message: 'Content slug is required' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsCreatingContent(true);
        setError(null);
        
        const response = await contentService.createContent(slug);
        setContent(response);
        
      } catch (err: any) {
        console.log('Create content error:', err);
        
        // If content already exists, that's fine - just show it
        if (err.message === 'CONTENT_EXISTS') {
          // Content already exists, use the returned data or home page data
          if (err.data) {
            setContent(err.data);
          } else if (homePageContent) {
            setContent(homePageContent);
          } else {
            setError({ message: 'Content not found' });
          }
        } else {
          setError({ message: 'Content Not Found' });
        }
      } finally {
        setIsLoading(false);
        setIsCreatingContent(false);
      }
    };

    handleContentCreation();
  }, [slug, homePageContent]);

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
              {isCreatingContent && (
                <div className="text-center mt-4">
                  <p className="text-gray-600">Loading content...</p>
                </div>
              )}
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
        {(content || homePageContent) && !isLoading && !error && (
          <div className="space-y-6">
                         {/* Video Player Section */}
             {content?.trailer_url && (
               <Card>
                 <CardContent className="p-0">
                   <div className="aspect-video w-full overflow-hidden bg-black rounded-t-lg relative">
                     <video
                       className="w-full h-full object-cover"
                       controls
                       poster={homePageContent?.thumbnailURL}
                       preload="metadata"
                     >
                       <source src={content.trailer_url} type="video/mp4" />
                       <source src={content.trailer_url} type="video/webm" />
                       <source src={content.trailer_url} type="video/ogg" />
                       Your browser does not support the video tag.
                     </video>
                   </div>
                 </CardContent>
               </Card>
             )}

            {/* Content Info Card */}
            <Card>
              <CardContent className="p-8">
                <h1 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  {content?.title || homePageContent?.title}
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
                      {content?.content_type || homePageContent?.contentType}
                    </span>
                  </div>
                  
                  {(content?.created_at || homePageContent?.createdAt) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Created: {formatDate(content?.created_at || homePageContent?.createdAt || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {content?.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      Description
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {content.description}
                    </p>
                  </div>
                )}
                
                {/* Content Details */}
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Content Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Slug:</span>
                      <span className="text-gray-600 ml-2">{content?.slug || homePageContent?.slug}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="text-gray-600 ml-2">{content?.content_type || homePageContent?.contentType}</span>
                    </div>
                    {(content?.language || homePageContent?.language) && (
                      <div>
                        <span className="font-medium text-gray-700">Language:</span>
                        <span className="text-gray-600 ml-2">{content?.language || homePageContent?.language}</span>
                      </div>
                    )}
                    {(content?.dialect || homePageContent?.dialect) && (
                      <div>
                        <span className="font-medium text-gray-700">Dialect:</span>
                        <span className="text-gray-600 ml-2">{content?.dialect || homePageContent?.dialect}</span>
                      </div>
                    )}
                    {content?.genre && (
                      <div>
                        <span className="font-medium text-gray-700">Genre:</span>
                        <span className="text-gray-600 ml-2">{content.genre}</span>
                      </div>
                    )}
                    {content?.content_id && (
                      <div>
                        <span className="font-medium text-gray-700">Content ID:</span>
                        <span className="text-gray-600 ml-2">{content.content_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Fallback if no video */}
            {!content?.trailer_url && homePageContent?.thumbnailURL && (
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded-lg">
                    <img
                      src={homePageContent.thumbnailURL}
                      alt={content?.title || homePageContent.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 