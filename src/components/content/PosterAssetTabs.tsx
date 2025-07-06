import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, COLORS } from '@/utils/constants';
import TitleLogoGenerationPopup from './TitleLogoGenerationPopup';
import TaglineGenerationPopup from './TaglineGenerationPopup';
import type { AIImage, TitleLogo, Tagline, Content } from '@/types/content';

interface PosterAssetTabsProps {
  aiImages: AIImage[];
  titleLogos: TitleLogo[];
  taglines: Tagline[];
  content?: Content;
  onTitleLogoGenerated?: (logo: TitleLogo) => void;
  onTaglineGenerated?: (tagline: Tagline) => void;
}

// Draggable Image Component
interface DraggableImageProps {
  id: string;
  src: string;
  alt: string;
  type: 'ai-image' | 'title-logo' | 'tagline';
  data: AIImage | TitleLogo | Tagline;
}

function DraggableImage({ id, src, alt, type, data }: DraggableImageProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'asset',
    item: { id, src, alt, type, data },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const fullImageUrl = src.startsWith('http') ? src : `${API_BASE_URL}${src}`;

  return (
    <div
      ref={drag as any}
      className={`relative cursor-move transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <img
          src={fullImageUrl}
          alt={alt}
          className="w-full h-24 object-cover"
          draggable={false}
        />
      </div>
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg border-2 border-blue-500 border-dashed" />
      )}
    </div>
  );
}

export default function PosterAssetTabs({ 
  aiImages, 
  titleLogos, 
  taglines, 
  content, 
  onTitleLogoGenerated,
  onTaglineGenerated 
}: PosterAssetTabsProps) {
  const [activeTab, setActiveTab] = useState<'ai-images' | 'title-logos' | 'taglines'>('ai-images');
  const [isTitleLogoPopupOpen, setIsTitleLogoPopupOpen] = useState(false);
  const [isTaglinePopupOpen, setIsTaglinePopupOpen] = useState(false);

  // Handle logo generation
  const handleLogoGenerated = (newLogo: TitleLogo) => {
    onTitleLogoGenerated?.(newLogo);
  };

  // Handle create title logo button click
  const handleCreateTitleLogo = () => {
    setIsTitleLogoPopupOpen(true);
  };

  // Handle tagline generation
  const handleTaglineGenerated = (newTagline: Tagline) => {
    onTaglineGenerated?.(newTagline);
  };

  // Handle create tagline button click
  const handleCreateTagline = () => {
    setIsTaglinePopupOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai-images':
        return (
          <div className="grid grid-cols-2 gap-2">
            {aiImages.map((image, index) => (
              <DraggableImage
                key={image.ai_image_id || image._id || index}
                id={image.ai_image_id || image._id || `ai-${index}`}
                src={image.ai_image_url}
                alt={`AI Image ${index + 1}`}
                type="ai-image"
                data={image}
              />
            ))}
            {aiImages.length === 0 && (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No AI images available
              </div>
            )}
          </div>
        );

      case 'title-logos':
        return (
          <div className="space-y-4">
            {/* Create Title Logo Button */}
            {content && (
              <div className="flex justify-center">
                <Button
                  onClick={handleCreateTitleLogo}
                  className="px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
                >
                  Create Title Logo
                </Button>
              </div>
            )}
            
            {/* Title Logos Grid */}
            <div className="grid grid-cols-2 gap-2">
              {titleLogos.map((logo, index) => (
                <DraggableImage
                  key={logo.title_logo_id || logo._id || index}
                  id={logo.title_logo_id || logo._id || `logo-${index}`}
                  src={logo.title_logo_url}
                  alt={`Title Logo ${index + 1}`}
                  type="title-logo"
                  data={logo}
                />
              ))}
              {titleLogos.length === 0 && (
                <div className="col-span-2 text-center text-gray-500 py-4">
                  No title logos available
                </div>
              )}
            </div>
          </div>
        );

      case 'taglines':
        return (
          <div className="space-y-4">
            {/* Create Tagline Button */}
            {content && (
              <div className="flex justify-center">
                <Button
                  onClick={handleCreateTagline}
                  className="px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
                >
                  Create Tagline
                </Button>
              </div>
            )}
            
            {/* Taglines Grid */}
            <div className="grid grid-cols-2 gap-2">
              {taglines.map((tagline, index) => (
                <DraggableImage
                  key={tagline.tagline_id || tagline._id || index}
                  id={tagline.tagline_id || tagline._id || `tagline-${index}`}
                  src={tagline.tagline_url}
                  alt={`Tagline ${index + 1}`}
                  type="tagline"
                  data={tagline}
                />
              ))}
              {taglines.length === 0 && (
                <div className="col-span-2 text-center text-gray-500 py-4">
                  No taglines available
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('ai-images')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'ai-images'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          AI Images
        </button>
        <button
          onClick={() => setActiveTab('title-logos')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'title-logos'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Title Logos
        </button>
        <button
          onClick={() => setActiveTab('taglines')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
            activeTab === 'taglines'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Taglines
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>

      {/* Title Logo Generation Popup */}
      {content && (
        <TitleLogoGenerationPopup
          content={content}
          isOpen={isTitleLogoPopupOpen}
          onClose={() => setIsTitleLogoPopupOpen(false)}
          onLogoGenerated={handleLogoGenerated}
        />
      )}

      {/* Tagline Generation Popup */}
      {content && (
        <TaglineGenerationPopup
          content={content}
          isOpen={isTaglinePopupOpen}
          onClose={() => setIsTaglinePopupOpen(false)}
          onTaglineGenerated={handleTaglineGenerated}
        />
      )}
    </div>
  );
} 