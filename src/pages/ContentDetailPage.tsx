import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { contentService } from '@/services/api';
import { useContentStore } from '@/store/useContentStore';
import { COLORS } from '@/utils/constants';
import type { Content, ApiError } from '@/types/content';

const TABS = [
  { id: 'posters', label: 'Posters' },
  { id: 'ai-images', label: 'AI Images' },
  { id: 'copies', label: 'Copies' },
  { id: 'tagline', label: 'Tagline' },
  { id: 'title-logo', label: 'title Logo' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
];

export default function ContentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { contents } = useContentStore();
  
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadingStage, setLoadingStage] = useState<'fetching' | 'creating' | 'refetching' | null>(null);
  const [activeTab, setActiveTab] = useState('posters');

  // Get content data from home page store for thumbnail matching
  const homePageContent = contents.find((item: Content) => item.slug === slug);

  useEffect(() => {
    const handleContentFlow = async () => {
      if (!slug) {
        setError({ message: 'Content slug is required' });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Step 1: Try to fetch content by slug first
        setLoadingStage('fetching');
        try {
          const fetchedContent = await contentService.fetchContentBySlug(slug);
          setContent(fetchedContent);
          setIsLoading(false);
          setLoadingStage(null);
          return; // Content found, exit early
        } catch (fetchError: any) {
          // If content doesn't exist (404), proceed to create it
          if (fetchError.status === 404) {
            console.log('Content not found, will create it');
          } else {
            // If it's not a 404, it's a different error
            throw fetchError;
          }
        }

        // Step 2: Content doesn't exist, create it
        setLoadingStage('creating');
        try {
          await contentService.createContent(slug);
          console.log('Content created successfully');
        } catch (createError: any) {
          // If creation fails because content already exists, that's fine
          if (createError.message === 'CONTENT_EXISTS') {
            console.log('Content already exists, proceeding to fetch');
          } else {
            throw createError;
          }
        }

        // Step 3: Fetch the content again after creation
        setLoadingStage('refetching');
        const createdContent = await contentService.fetchContentBySlug(slug);
        setContent(createdContent);
        
      } catch (err: any) {
        console.error('Content flow error:', err);
        setError({ 
          message: err.message || 'Failed to load content',
          status: err.status 
        });
      } finally {
        setIsLoading(false);
        setLoadingStage(null);
      }
    };

    handleContentFlow();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'fetching':
        return 'Checking if content exists...';
      case 'creating':
        return 'Creating content...';
      case 'refetching':
        return 'Loading content details...';
      default:
        return 'Loading...';
    }
  };

      return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button - Left of layout */}
      <div className="px-2 pt-4 pb-2">
        <div className="flex items-start gap-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="p-2 h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
                    <div className="flex-1 container mx-auto">
          {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="text-center mt-4">
              <p className="text-gray-600">{getLoadingMessage()}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Content Display - Sidebar Layout */}
        {content && !isLoading && !error && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Content Details (25%) */}
            <div className="w-full lg:w-1/4 lg:min-w-[350px]">
              <div className="bg-gray-100 min-h-screen p-6 space-y-4">
                {/* Title */}
                <div>
                  <h1 className="font-bold text-gray-900 text-left" style={{ fontSize: '45px' }}>
                    {content.title}
                  </h1>
                </div>

                {/* Video/Thumbnail */}
                <div className="w-full">
                  {content.trailer_url ? (
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        poster={homePageContent?.thumbnailURL}
                        preload="metadata"
                        playsInline
                        crossOrigin="anonymous"
                        onError={(e) => console.error('Video error:', e)}
                      >
                        <source src={content.trailer_url} type="video/mp4" />
                        <source src={content.trailer_url} type="video/webm" />
                        <source src={content.trailer_url} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    homePageContent?.thumbnailURL && (
                      <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={homePageContent.thumbnailURL}
                          alt={content.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Description */}
                {content.description && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2 text-left" style={{ fontSize: '17px' }}>
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-left" style={{ fontSize: '17px' }}>
                      {content.description}
                    </p>
                  </div>
                )}

                {/* Content Type Badge */}
                <div className="flex justify-start">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 font-medium"
                    style={{ 
                      backgroundColor: COLORS.CONTENT_BADGE + '20',
                      color: COLORS.CONTENT_BADGE,
                      fontSize: '17px'
                    }}
                  >
                    {content.content_type}
                  </span>
                </div>

                {/* Additional Details */}
                <div className="border-t pt-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Slug:</span>
                    <span className="text-gray-600 ml-2">{content.slug}</span>
                  </div>
                  {content.language && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Language:</span>
                      <span className="text-gray-600 ml-2">{content.language}</span>
                    </div>
                  )}
                  {content.dialect && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Dialect:</span>
                      <span className="text-gray-600 ml-2">{content.dialect}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Tabs Content (75%) */}
            <div className="hidden lg:block w-full lg:w-3/4">
              <div className="bg-white rounded-lg p-6 min-h-[600px]">
                {/* Tab Navigation - Style 1: Underline Tabs (Final Choice) */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex w-full">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-4 font-semibold text-sm transition-all duration-300 relative ${
                          activeTab === tab.id
                            ? 'border-b-3'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                        style={{
                          color: activeTab === tab.id ? COLORS.PRIMARY : undefined,
                          borderBottomColor: activeTab === tab.id ? COLORS.PRIMARY : 'transparent',
                          borderBottomWidth: activeTab === tab.id ? '3px' : '0px',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px] overflow-y-auto">
                  {activeTab === 'posters' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Posters</h3>
                      <p className="text-gray-500">Poster variations will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'ai-images' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Images</h3>
                      <p className="text-gray-500">AI generated images will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'copies' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Copies</h3>
                      <p className="text-gray-500">Text copies and scripts will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'tagline' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Tagline</h3>
                      <p className="text-gray-500">Tagline variations in image form will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'title-logo' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Title Logo</h3>
                      <p className="text-gray-500">Logo variations and versions will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'images' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Images</h3>
                      <p className="text-gray-500">General images related to content will be displayed here</p>
                    </div>
                  )}
                  
                  {activeTab === 'videos' && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Videos</h3>
                      <p className="text-gray-500">Related videos and clips will be displayed here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout - Full Width */}
        {content && !isLoading && !error && (
          <div className="block lg:hidden">
            {/* Mobile Sidebar */}
            <div className="bg-gray-100 p-4 mb-4">
              {/* Mobile Title */}
              <div className="mb-4">
                <h1 className="font-bold text-gray-900 text-left" style={{ fontSize: '28px' }}>
                  {content.title}
                </h1>
              </div>

              {/* Mobile Video/Thumbnail */}
              <div className="w-full mb-4">
                {content.trailer_url ? (
                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      controls
                      poster={homePageContent?.thumbnailURL}
                      preload="metadata"
                      playsInline
                      crossOrigin="anonymous"
                      onError={(e) => console.error('Video error:', e)}
                    >
                      <source src={content.trailer_url} type="video/mp4" />
                      <source src={content.trailer_url} type="video/webm" />
                      <source src={content.trailer_url} type="video/ogg" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  homePageContent?.thumbnailURL && (
                    <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={homePageContent.thumbnailURL}
                        alt={content.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )
                )}
              </div>

              {/* Mobile Description */}
              {content.description && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2 text-left" style={{ fontSize: '16px' }}>
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line text-left" style={{ fontSize: '15px' }}>
                    {content.description}
                  </p>
                </div>
              )}

              {/* Mobile Content Type Badge */}
              <div className="flex justify-start mb-4">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 font-medium"
                  style={{ 
                    backgroundColor: COLORS.CONTENT_BADGE + '20',
                    color: COLORS.CONTENT_BADGE,
                    fontSize: '15px'
                  }}
                >
                  {content.content_type}
                </span>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="bg-white rounded-lg p-4">
              {/* Mobile Tab Navigation - Style 1: Underline Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0 min-w-[100px] relative ${
                        activeTab === tab.id
                          ? 'border-b-3'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                      style={{
                        color: activeTab === tab.id ? COLORS.PRIMARY : undefined,
                        borderBottomColor: activeTab === tab.id ? COLORS.PRIMARY : 'transparent',
                        borderBottomWidth: activeTab === tab.id ? '3px' : '0px',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Tab Content */}
              <div className="min-h-[300px] overflow-y-auto">
                {activeTab === 'posters' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Posters</h3>
                    <p className="text-gray-500">Poster variations will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'ai-images' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Images</h3>
                    <p className="text-gray-500">AI generated images will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'copies' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Copies</h3>
                    <p className="text-gray-500">Text copies and scripts will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'tagline' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Tagline</h3>
                    <p className="text-gray-500">Tagline variations in image form will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'title-logo' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Title Logo</h3>
                    <p className="text-gray-500">Logo variations and versions will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'images' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Images</h3>
                    <p className="text-gray-500">General images related to content will be displayed here</p>
                  </div>
                )}
                
                {activeTab === 'videos' && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Videos</h3>
                    <p className="text-gray-500">Related videos and clips will be displayed here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
} 