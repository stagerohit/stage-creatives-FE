import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLORS, DIMENSION_OPTIONS } from '@/utils/constants';
import ImageSelectionTab from './ImageSelectionTab';
import AIImageSelectionTab from './AIImageSelectionTab';
import type { Content } from '@/types/content';

interface ImageSelectionTabsProps {
  content: Content;
  selectedImages: string[];
  onImageSelect: (imageId: string, isSelected: boolean) => void;
  maxSelections: number;
  onGenerate: (dimension: string) => void;
}

export default function ImageSelectionTabs({ 
  content, 
  selectedImages, 
  onImageSelect, 
  maxSelections,
  onGenerate 
}: ImageSelectionTabsProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'ai-images'>('images');
  const [selectedDimension, setSelectedDimension] = useState<string>('');

  const handleClearAll = () => {
    selectedImages.forEach(imageId => {
      onImageSelect(imageId, false);
    });
  };

  const handleGenerate = () => {
    onGenerate(selectedDimension);
  };

  return (
    <div className="h-full relative">
      {/* Fixed Tab Navigation with Selection Info */}
      <div className="flex justify-between items-center border-b border-gray-200 px-2 py-3 bg-white" style={{ height: '60px' }}>
        <div className="flex">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === 'images'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab('ai-images')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
              activeTab === 'ai-images'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            AI Images
          </button>
        </div>
        
        {/* Selection Info - Right side of tabs */}
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-emerald-600">
              {selectedImages.length} of {maxSelections} images selected
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-emerald-500 hover:text-emerald-700 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Image Content - Absolutely positioned */}
      <div className="absolute overflow-auto bg-white px-2 py-2" style={{ 
        top: '60px', 
        left: '0', 
        right: '0', 
        bottom: '60px'
      }}>
        {activeTab === 'images' ? (
          <ImageSelectionTab
            content={content}
            selectedImages={selectedImages}
            onImageSelect={onImageSelect}
            maxSelections={maxSelections}
          />
        ) : (
          <AIImageSelectionTab
            content={content}
            selectedImages={selectedImages}
            onImageSelect={onImageSelect}
            maxSelections={maxSelections}
          />
        )}
      </div>

      {/* Fixed Controls at Bottom - Absolutely positioned */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3 bg-white" style={{ height: '60px' }}>
        <div className="flex justify-between items-center">
          <Select value={selectedDimension} onValueChange={setSelectedDimension}>
            <SelectTrigger className="w-32">
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
          
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleGenerate}
            disabled={selectedImages.length === 0}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
} 