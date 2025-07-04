import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { contentService } from '@/services/api';
import { useToast } from '@/components/ui/toast';
import PosterAssetTabs from '@/components/content/PosterAssetTabs';
import PosterCanvas, { CanvasAsset } from '@/components/content/PosterCanvas';
import type { Content, AIImage, TitleLogo, Tagline } from '@/types/content';

export default function PosterGenerationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToast } = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiImages, setAiImages] = useState<AIImage[]>([]);
  const [titleLogos, setTitleLogos] = useState<TitleLogo[]>([]);
  const [taglines, setTaglines] = useState<Tagline[]>([]);
  const [canvasAssets, setCanvasAssets] = useState<CanvasAsset[]>([]);

  const handleSavePoster = () => {
    // TODO: Implement save functionality
    console.log('Saving poster with assets:', canvasAssets);
    addToast('Save functionality will be implemented later', 'info');
  };

  useEffect(() => {
    const fetchContentAndAssets = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const contentData = await contentService.fetchContentBySlug(slug);
        setContent(contentData);

        // Get content ID for fetching assets
        const contentId = contentData.content_id || contentData.id || contentData._id || contentData.oldContentId?.toString() || '';
        
        if (contentId) {
          // Fetch all assets in parallel
          const [aiImagesResponse, titleLogosResponse, taglinesResponse] = await Promise.all([
            contentService.getAIImagesByContentId(contentId).catch(() => []),
            contentService.getTitleLogosByContentId(contentId).catch(() => []),
            contentService.getTaglinesByContentId(contentId).catch(() => [])
          ]);

          setAiImages(Array.isArray(aiImagesResponse) ? aiImagesResponse : []);
          setTitleLogos(Array.isArray(titleLogosResponse) ? titleLogosResponse : []);
          setTaglines(Array.isArray(taglinesResponse) ? taglinesResponse : []);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
        addToast('Failed to load content data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentAndAssets();
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
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-50">
        <div className="h-full p-4">
          <div className="flex h-full gap-2">
            {/* Left Side - Section 1A (30% width) */}
            <div className="w-[30%] bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Asset Selection</h3>
              <PosterAssetTabs 
                aiImages={aiImages}
                titleLogos={titleLogos}
                taglines={taglines}
              />
            </div>

            {/* Right Side - 70% width */}
            <div className="w-[70%] flex flex-col gap-2">
              {/* Section 2A - Canvas (90% height) */}
              <div className="h-[90%] bg-white rounded-lg shadow p-4 flex flex-col">
                <h3 className="text-lg font-semibold mb-4">Canvas</h3>
                <div className="flex-1 min-h-0">
                  <PosterCanvas onAssetsChange={setCanvasAssets} />
                </div>
              </div>

              {/* Bottom Section (10% height) */}
              <div className="h-[10%] flex gap-2">
                {/* Section 3A - Tools (80% width) */}
                <div className="w-[80%] bg-white rounded-lg shadow p-4">
                  <h4 className="font-semibold mb-2">Image Editing Tools</h4>
                  <div className="text-gray-500 text-sm">
                    Tools will appear here
                    {canvasAssets.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs">Canvas Assets: {canvasAssets.length}</div>
                        <div className="text-xs">
                          Selected: {canvasAssets.find(a => a.selected)?.type || 'None'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button (20% width) */}
                <div className="w-[20%] bg-white rounded-lg shadow p-4 flex items-center justify-center">
                  <button 
                    onClick={handleSavePoster}
                    className="w-full h-full bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
} 