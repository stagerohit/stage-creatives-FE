import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLORS, DIMENSION_OPTIONS } from '@/utils/constants';

interface ImageGenerationControlsProps {
  selectedImages: string[];
  onGenerate: (dimension: string) => void;
}

export default function ImageGenerationControls({ 
  selectedImages, 
  onGenerate 
}: ImageGenerationControlsProps) {
  const [selectedDimension, setSelectedDimension] = useState<string>('');

  const handleGenerate = () => {
    onGenerate(selectedDimension);
  };

  return (
    <div className="bg-white rounded-b-lg shadow p-2 border-t border-gray-200">
      <div className="flex justify-between items-center">
        <Select value={selectedDimension} onValueChange={setSelectedDimension}>
          <SelectTrigger className="w-32" style={{ backgroundColor: 'white' }}>
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
  );
} 