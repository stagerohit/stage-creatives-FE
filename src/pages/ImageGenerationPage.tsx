import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { contentService } from '@/services/api';
import { useToast } from '@/components/ui/toast';
import { API_BASE_URL } from '@/utils/constants';
import AIPromptSection from '@/components/content/AIPromptSection';
import ImageSelectionTabs from '@/components/content/ImageSelectionTabs';
import type { Content, Image, AIImage } from '@/types/content';

export default function ImageGenerationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [allAIImages, setAllAIImages] = useState<AIImage[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [generationTimer, setGenerationTimer] = useState<number>(0);
  
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

  const handleGenerate = async (dimension: string, channel: string) => {
    // Validation
    if (!aiPrompt.trim()) {
      addToast('Please enter a prompt text', 'error');
      return;
    }

    if (selectedImages.length === 0) {
      addToast('Please select at least one reference image', 'error');
      return;
    }

    if (!content) {
      addToast('Content data not available', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      setImageLoadError(null); // Clear previous error
      
      // Get content ID
      const contentId = content.content_id || content._id || content.id || content.oldContentId?.toString() || '';
      
      if (!contentId) {
        throw new Error('Content ID not found');
      }

      // Prepare reference images data
      const selectedImageData = getSelectedImageData(selectedImages);
      const referenceImages = selectedImageData.map((img, index) => {
        const fullUrl = img.url.startsWith('http') ? img.url : `${API_BASE_URL}${img.url}`;
        return {
          uri: fullUrl,
          tag: `img_${index + 1}`
        };
      });

      // Prepare API payload
      const payload = {
        content_id: contentId,
        slug: slug || '',
        ratio: dimension,
        channel: channel,
        promptText: aiPrompt,
        referenceImages: referenceImages
      };

      console.log('Generating AI image with payload:', payload);

      // Call API
      const response = await contentService.generateAIImage(payload);
      
      console.log('Generate API response:', response);

      // Handle successful response
      if (response.ai_image_url) {
        console.log('Raw ai_image_url from response:', response.ai_image_url);
        console.log('API_BASE_URL:', API_BASE_URL);
        
        // Handle relative path - ensure single slash
        let fullImageUrl;
        if (response.ai_image_url.startsWith('http')) {
          fullImageUrl = response.ai_image_url;
        } else {
          // Ensure the path starts with / for proper URL construction
          const cleanPath = response.ai_image_url.startsWith('/') 
            ? response.ai_image_url 
            : `/${response.ai_image_url}`;
          fullImageUrl = `${API_BASE_URL}${cleanPath}`;
        }
        
        console.log('Constructed full image URL:', fullImageUrl);
        
        // Test the URL accessibility
        console.log('Testing image URL accessibility...');
        
        setGeneratedImage(fullImageUrl);
        addToast('AI image generated successfully!', 'success');
        setGenerationTimer(0); // Reset timer on success
      } else {
        console.error('No ai_image_url in response:', response);
        throw new Error('No image URL received from server');
      }

    } catch (error: any) {
      console.error('Generate failed:', error);
      
      // Handle specific error types
      if (error.status === 'timeout') {
        addToast('AI image generation timed out. The server may be busy, please try again.', 'error');
      } else if (error.message && error.message.includes('timeout')) {
        addToast('Request timed out. AI image generation takes 1-2 minutes, please try again.', 'error');
      } else {
        const errorMessage = error.message || 'Failed to generate AI image. Please try again.';
        addToast(errorMessage, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageRemove = (imageId: string) => {
    setSelectedImages(prev => prev.filter(id => id !== imageId));
  };

  const getSelectedImageData = (imageIds: string[]) => {
    const result: Array<{ id: string; url: string; type: 'image' | 'ai_image' }> = [];
    
    imageIds.forEach(id => {
      if (id.startsWith('image_')) {
        const actualId = id.replace('image_', '');
        const image = allImages.find(img => 
          (img as any).images_id === actualId || img.image_id === actualId || img._id === actualId
        );
        if (image) {
          result.push({
            id: id,
            url: image.image_url,
            type: 'image'
          });
        }
      } else if (id.startsWith('ai_image_')) {
        const actualId = id.replace('ai_image_', '');
        const aiImage = allAIImages.find(img => 
          img.ai_image_id === actualId || img._id === actualId
        );
        if (aiImage) {
          result.push({
            id: id,
            url: aiImage.ai_image_url,
            type: 'ai_image'
          });
        }
      }
    });
    
    return result;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating) {
      setGenerationTimer(0);
      interval = setInterval(() => {
        setGenerationTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  useEffect(() => {
    const fetchContentAndImages = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const contentData = await contentService.fetchContentBySlug(slug);
        setContent(contentData);

        // Get content ID for fetching images
        const contentId = contentData.content_id || contentData.id || contentData._id || contentData.oldContentId?.toString() || '';
        
        if (contentId) {
          // Fetch images and AI images in parallel
          const [imagesResponse, aiImagesResponse] = await Promise.all([
            contentService.getImagesByContentId(contentId).catch(() => []),
            contentService.getAIImagesByContentId(contentId).catch(() => [])
          ]);

          setAllImages(Array.isArray(imagesResponse) ? imagesResponse : []);
          setAllAIImages(Array.isArray(aiImagesResponse) ? aiImagesResponse : []);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
        addToast('Failed to load content data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentAndImages();
  }, [slug, addToast]);

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
        <div className="grid grid-cols-5 gap-[5px] h-full">
          {/* Left Side - 40% width (2 columns) */}
          <div className="col-span-2 flex flex-col h-full">
            {/* Section 1: AI Prompt Textarea - Fixed Height */}
            <div className="bg-white rounded-lg shadow p-2 mb-[5px]" style={{ height: '300px' }}>
              <div className="h-[278px]">
                <AIPromptSection
                  value={aiPrompt}
                  onChange={setAiPrompt}
                  selectedImages={selectedImages}
                  onImageRemove={handleImageRemove}
                  getSelectedImageData={getSelectedImageData}
                />
              </div>
            </div>

            {/* Section 2: Image Selection Tabs - Calculated Height */}
            <div 
              className="bg-white rounded-lg shadow" 
              style={{ height: 'calc(100% - 300px - 5px)' }}
            >
              <ImageSelectionTabs 
                content={content}
                selectedImages={selectedImages}
                onImageSelect={handleImageSelect}
                maxSelections={maxSelections}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>

          {/* Right Side - 60% width (3 columns) */}
          <div className="col-span-3 h-full">
            <div className="bg-white rounded-lg shadow p-2 h-full">
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden pt-[10px] pl-[20px] pr-[20px] pb-[100px]">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <div className="text-gray-600 text-center">
                      <div className="font-medium">Generating AI image...</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Elapsed time: {Math.floor(generationTimer / 60)}:{(generationTimer % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {generationTimer < 30 ? 'Starting generation...' : 
                         generationTimer < 60 ? 'Creating your image...' : 
                         'Almost done, please wait...'}
                      </div>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-[90%] h-[90%] relative">
                      {imageLoadError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="text-red-600 text-center mb-4">
                            <div className="font-bold text-lg mb-2">⚠️ Image Failed to Load</div>
                            <div className="text-sm mb-2">URL: {generatedImage}</div>
                            <div className="text-sm">Error: {imageLoadError}</div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                console.log('🔄 Retrying image load...');
                                setImageLoadError(null);
                                // Force re-render of image
                                const currentUrl = generatedImage;
                                setGeneratedImage(null);
                                setTimeout(() => setGeneratedImage(currentUrl), 100);
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                            >
                              Retry
                            </button>
                            <button 
                              onClick={() => {
                                console.log('🌐 Opening image URL in new tab...');
                                window.open(generatedImage, '_blank');
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                            >
                              Test URL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={generatedImage} 
                          alt="Generated AI Image" 
                          className="w-full h-full object-contain rounded-lg"
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', generatedImage);
                            setImageLoadError(null);
                          }}
                          onError={(e) => {
                            console.error('❌ Image failed to load:', generatedImage);
                            console.error('Image error event:', e);
                            setImageLoadError(`Failed to load image from ${generatedImage}`);
                            addToast('Failed to load generated image. Check console for details.', 'error');
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Generated results will appear here</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 