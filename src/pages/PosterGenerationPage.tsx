import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { contentService } from '@/services/api';
import { useToast } from '@/components/ui/toast';
import PosterAssetTabs from '@/components/content/PosterAssetTabs';
import PosterCanvas, { CanvasAsset } from '@/components/content/PosterCanvas';
import ImageEditingTools from '@/components/content/ImageEditingTools';
import AdvancedGradientControls from '@/components/content/AdvancedGradientControls';
import MaterialDesignControls from '@/components/content/MaterialDesignControls';
import PosterSaveModal from '@/components/content/PosterSaveModal';
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
  const [selectedAsset, setSelectedAsset] = useState<CanvasAsset | null>(null);
  const [isGradientActive, setIsGradientActive] = useState(false);
  const [gradientArea, setGradientArea] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<CanvasAsset[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Update selected asset when canvas assets change
  useEffect(() => {
    const selected = canvasAssets.find(asset => asset.selected);
    setSelectedAsset(selected || null);
  }, [canvasAssets]);

  const handleSavePoster = () => {
    // Open the save modal
    setIsSaveModalOpen(true);
  };

  const handleSaveComplete = () => {
    // This function is called after successful save
    // Close the modal (already handled by the modal)
    setIsSaveModalOpen(false);
  };

  // Handle asset updates from image editing tools
  const handleAssetUpdate = (updatedAsset: CanvasAsset) => {
    console.log('PosterGenerationPage received asset update:', updatedAsset.id, updatedAsset.effects);
    setCanvasAssets(prev => 
      prev.map(asset => 
        asset.id === updatedAsset.id ? updatedAsset : asset
      )
    );
  };

  // Handle apply effects
  const handleApplyEffects = () => {
    // Effects are already applied in real-time, just show confirmation
    addToast('Effects applied successfully', 'success');
  };

  // Handle cancel effects
  const handleCancelEffects = () => {
    // This will be handled by the ImageEditingTools component
    addToast('Effects cancelled', 'info');
  };

  // Handle effect changes
  const handleEffectChange = (assetId: string, effects: any) => {
    console.log('Effect change for asset:', assetId, effects);
    setCanvasAssets(prev => 
      prev.map(asset => 
        asset.id === assetId ? { ...asset, effects } : asset
      )
    );
  };

  // Handle asset actions
  const handleAssetAction = (assetId: string, action: string) => {
    console.log('Asset action:', assetId, action);
    // Handle various asset actions here
  };

  // Handle advanced gradient application
  const handleAdvancedGradientApply = (config: any) => {
    if (!selectedAsset) return;
    
    const newEffects = {
      ...selectedAsset.effects,
      advancedGradient: config
    };
    
    const updatedAsset = { ...selectedAsset, effects: newEffects };
    handleAssetUpdate(updatedAsset);
    addToast('Advanced gradient applied', 'success');
  };

  // Handle gradient area definition from canvas
  const handleGradientAreaDefined = (area: { startX: number, startY: number, endX: number, endY: number }) => {
    // Pass the gradient area to the advanced gradient controls
    setGradientArea(area);
    console.log('Gradient area defined:', area);
    addToast('Gradient area defined - adjust colors in the gradient panel', 'info');
  };

  // Add to history
  const addToHistory = (assets: CanvasAsset[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(assets))); // Deep copy
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasAssets(JSON.parse(JSON.stringify(history[newIndex])));
      addToast('Undo successful', 'info');
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasAssets(JSON.parse(JSON.stringify(history[newIndex])));
      addToast('Redo successful', 'info');
    }
  };

  // Track canvas changes for undo/redo
  useEffect(() => {
    if (canvasAssets.length > 0 || history.length === 0) {
      const currentStateHash = JSON.stringify(canvasAssets.map(a => ({
        id: a.id,
        effects: a.effects,
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height
      })));
      
      const lastStateHash = history[historyIndex] ? JSON.stringify(history[historyIndex].map(a => ({
        id: a.id,
        effects: a.effects,
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height
      }))) : '';
      
      // Only add to history if state actually changed
      if (currentStateHash !== lastStateHash) {
        addToHistory(canvasAssets);
      }
    }
  }, [canvasAssets]);

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

          // Sort assets by creation date (newest first)
          const sortedAIImages = (Array.isArray(aiImagesResponse) ? aiImagesResponse : [])
            .sort((a: AIImage, b: AIImage) => {
              const dateA = a.created_at || a.createdAt;
              const dateB = b.created_at || b.createdAt;
              if (dateA && dateB) {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              }
              if (dateA && !dateB) return -1;
              if (!dateA && dateB) return 1;
              return 0;
            });

          const sortedTitleLogos = (Array.isArray(titleLogosResponse) ? titleLogosResponse : [])
            .sort((a: TitleLogo, b: TitleLogo) => {
              const dateA = a.created_at || a.createdAt;
              const dateB = b.created_at || b.createdAt;
              if (dateA && dateB) {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              }
              if (dateA && !dateB) return -1;
              if (!dateA && dateB) return 1;
              return 0;
            });

          const sortedTaglines = (Array.isArray(taglinesResponse) ? taglinesResponse : [])
            .sort((a: Tagline, b: Tagline) => {
              const dateA = a.created_at || a.createdAt;
              const dateB = b.created_at || b.createdAt;
              if (dateA && dateB) {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              }
              if (dateA && !dateB) return -1;
              if (!dateA && dateB) return 1;
              return 0;
            });

          setAiImages(sortedAIImages);
          setTitleLogos(sortedTitleLogos);
          setTaglines(sortedTaglines);
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
      <div className="h-screen bg-gray-50 relative">
        {/* Top-right Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Undo/Redo Buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-1 ${
                historyIndex <= 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <span className="material-icons text-sm">undo</span>
            </button>
            <button 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-lg font-medium transition-colors shadow-lg flex items-center gap-1 ${
                historyIndex >= history.length - 1 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <span className="material-icons text-sm">redo</span>
            </button>
          </div>
          
          {/* Save Button */}
          <button 
            onClick={handleSavePoster}
            className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-lg flex items-center gap-1"
          >
            <span className="material-icons text-sm">save</span>
            Save
          </button>
        </div>

        <div className="h-full p-4">
          <div className="flex h-full gap-2">
            {/* Left Side - Section 1A (30% width) */}
            <div className="w-[30%] bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">Asset Selection</h3>
              <PosterAssetTabs 
                aiImages={aiImages}
                titleLogos={titleLogos}
                taglines={taglines}
                content={content}
                onTitleLogoGenerated={(newLogo) => {
                  setTitleLogos(prev => {
                    const updated = [...prev, newLogo];
                    // Sort by creation date (newest first)
                    return updated.sort((a, b) => {
                      const dateA = a.created_at || a.createdAt;
                      const dateB = b.created_at || b.createdAt;
                      if (dateA && dateB) {
                        return new Date(dateB).getTime() - new Date(dateA).getTime();
                      }
                      if (dateA && !dateB) return -1;
                      if (!dateA && dateB) return 1;
                      return 0;
                    });
                  });
                }}
                onTaglineGenerated={(newTagline) => {
                  setTaglines(prev => {
                    const updated = [...prev, newTagline];
                    // Sort by creation date (newest first)
                    return updated.sort((a, b) => {
                      const dateA = a.created_at || a.createdAt;
                      const dateB = b.created_at || b.createdAt;
                      if (dateA && dateB) {
                        return new Date(dateB).getTime() - new Date(dateA).getTime();
                      }
                      if (dateA && !dateB) return -1;
                      if (!dateA && dateB) return 1;
                      return 0;
                    });
                  });
                }}
              />
            </div>

            {/* Right Side - 70% width */}
            <div className="w-[70%] flex flex-col gap-2">
              {/* Section 2A - Canvas (70% height) */}
              <div className="h-[70%] bg-white rounded-lg shadow p-4 flex flex-col relative">
                <h3 className="text-lg font-semibold mb-4">Canvas</h3>
                <div className="flex-1 min-h-0 flex">
                  {/* Canvas Area - shrinks when gradient active */}
                  <div className={`flex-1 min-h-0 transition-all duration-300 ${isGradientActive ? 'mr-2' : ''}`}>
                    <PosterCanvas 
                      assets={canvasAssets}
                      onAssetsChange={setCanvasAssets}
                      isGradientMode={isGradientActive}
                      onGradientAreaDefined={handleGradientAreaDefined}
                      canvasRef={canvasRef}
                    />
                  </div>
                  
                  {/* Gradient Controls Overlay - 15% width when active */}
                  {isGradientActive && (
                    <div className="w-[15%] bg-white border-l border-gray-200 p-2 overflow-y-auto">
                      <AdvancedGradientControls
                        selectedAsset={selectedAsset}
                        onApply={handleAdvancedGradientApply}
                        onDone={() => setIsGradientActive(false)}
                        gradientArea={gradientArea}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section - Image Controls (30% height, full width) */}
              <div className="h-[30%] bg-white rounded-lg shadow overflow-hidden">
                <MaterialDesignControls
                  selectedAsset={selectedAsset}
                  onAssetUpdate={handleAssetUpdate}
                  onEffectChange={handleEffectChange}
                  onAssetAction={handleAssetAction}
                  onGradientToggle={() => setIsGradientActive(!isGradientActive)}
                  isGradientActive={isGradientActive}
                  canvasRef={canvasRef}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={historyIndex > 0}
                  canRedo={historyIndex < history.length - 1}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
              {content && (
          <PosterSaveModal
            content={content}
            isOpen={isSaveModalOpen}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveComplete}
            canvasAssets={canvasAssets}
            canvasRef={canvasRef}
          />
        )}
    </DndProvider>
  );
} 