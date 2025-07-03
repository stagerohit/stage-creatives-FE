import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/utils/constants';

interface SelectedImageData {
  id: string;
  url: string;
  type: 'image' | 'ai_image';
}

interface AIPromptSectionProps {
  value: string;
  onChange: (value: string) => void;
  selectedImages: string[];
  onImageRemove: (imageId: string) => void;
  getSelectedImageData: (imageIds: string[]) => SelectedImageData[];
}

export default function AIPromptSection({ 
  value, 
  onChange, 
  selectedImages, 
  onImageRemove,
  getSelectedImageData 
}: AIPromptSectionProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxCharacters = 1000;

  // Get image data for display
  const imageData = getSelectedImageData(selectedImages);

  // Generate image references text with prefix
  const generateImageReferences = () => {
    if (imageData.length === 0) return '';
    const imageRefs = imageData.map((_, index) => `@img_${index + 1}`).join(' ');
    return `Reference Images : ${imageRefs}`;
  };

  // Update character count when value changes
  useEffect(() => {
    setCharacterCount(value.length);
  }, [value]);

  // Auto-update text when images change
  useEffect(() => {
    if (imageData.length > 0) {
      const imageRefs = generateImageReferences();
      const currentText = value;
      
      // Extract existing text without image references and prefix
      let textWithoutRefs = currentText;
      
      // Remove "Reference Images :" prefix if present
      textWithoutRefs = textWithoutRefs.replace(/^Reference Images\s*:\s*/, '');
      
      // Remove all @img_X references
      textWithoutRefs = textWithoutRefs.replace(/@img_\d+\s*/g, '');
      
      // Add new image references at the beginning
      const newValue = imageRefs + (textWithoutRefs.trim() ? ' ' + textWithoutRefs.trim() : '');
      
      if (newValue !== currentText) {
        onChange(newValue);
      }
    }
  }, [imageData.length]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (newValue.length <= maxCharacters) {
      onChange(newValue);
    } else {
      // If pasted content exceeds limit, show alert and don't accept
      if (newValue.length > value.length + 1) {
        alert('Only 1000 characters accepted');
      }
    }
  };

  const handleImageRemove = (index: number) => {
    const imageToRemove = selectedImages[index];
    onImageRemove(imageToRemove);
  };

  const getFullImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  };

  // Empty State
  if (imageData.length === 0 && !value.trim()) {
    return (
      <div className="w-full h-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          placeholder="Add text or images"
          className="w-full h-full p-1 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ minHeight: '278px' }}
        />
      </div>
    );
  }

  // Filled State with Images and Text
  if (imageData.length > 0) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Images Section - 30% height (90px) */}
        <div className="h-[90px] bg-white rounded-t border border-gray-300 p-2 flex gap-2 overflow-x-auto">
          {imageData.map((image, index) => (
            <div key={image.id} className="relative flex-shrink-0 group">
              <div className="relative h-full aspect-square">
                <img
                  src={getFullImageUrl(image.url)}
                  alt={`img_${index + 1}`}
                  className="w-full h-full object-cover rounded border border-gray-200"
                />
                {/* Image label */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 rounded-b">
                  img_{index + 1}
                </div>
                {/* Remove button - visible on hover */}
                <button
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Text Section - 70% height (210px) */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            placeholder="Enter your AI prompt here..."
            className="w-full h-full p-2 border-l border-r border-b border-gray-300 rounded-b resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {/* Character counter - only show when user has typed */}
          {characterCount > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
              {characterCount}/{maxCharacters}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filled State with Text Only
  return (
    <div className="w-full h-full relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        placeholder="Enter your AI prompt here..."
        className="w-full h-full p-1 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ minHeight: '278px' }}
      />
      {/* Character counter - only show when user has typed */}
      {characterCount > 0 && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
          {characterCount}/{maxCharacters}
        </div>
      )}
    </div>
  );
} 