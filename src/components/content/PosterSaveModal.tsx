import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, CHANNEL_OPTIONS, DIMENSION_OPTIONS, USE_CASE_OPTIONS, COLORS } from '@/utils/constants';
import type { Content } from '@/types/content';
import type { CanvasAsset } from '@/components/content/PosterCanvas';

interface PosterSaveModalProps {
  content: Content;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  canvasAssets: CanvasAsset[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function PosterSaveModal({
  content,
  isOpen,
  onClose,
  onSave,
  canvasAssets,
  canvasRef
}: PosterSaveModalProps) {
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedDimension, setSelectedDimension] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    channel?: string;
    dimension?: string;
    useCase?: string;
  }>({});

  // Debug modal state when it opens
  useEffect(() => {
    if (isOpen) {
      console.log('=== PosterSaveModal opened ===');
      console.log('Content:', content);
      console.log('Canvas assets:', canvasAssets);
      console.log('Canvas ref:', canvasRef.current);
      console.log('Form state:', {
        selectedChannel,
        selectedDimension,
        selectedUseCase
      });
    }
  }, [isOpen, content, canvasAssets, canvasRef, selectedChannel, selectedDimension, selectedUseCase]);

  // Validate form fields
  const validateForm = () => {
    const errors: { channel?: string; dimension?: string; useCase?: string } = {};
    
    if (!selectedChannel) {
      errors.channel = 'Channel selection is required';
    }

    if (!selectedDimension) {
      errors.dimension = 'Dimension selection is required';
    }

    if (!selectedUseCase) {
      errors.useCase = 'Use case selection is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if canvas has assets
  const hasCanvasAssets = () => {
    return canvasAssets.length > 0;
  };

  // Convert image URL to base64 data URL using fetch to avoid CORS issues
  const imageToDataURL = (url: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        
        // Fetch the image as a blob
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to data URL
        const reader = new FileReader();
        reader.onload = () => {
          const dataURL = reader.result as string;
          resolve(dataURL);
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        
        reader.readAsDataURL(blob);
        
      } catch (error) {
        console.error('Failed to fetch image and convert to data URL:', error);
        reject(error);
      }
    });
  };

  // Create a clean canvas with base64 data URLs to avoid CORS issues
  const createCleanCanvas = async (): Promise<HTMLCanvasElement> => {
    return new Promise(async (resolve, reject) => {
      if (!canvasRef.current) {
        reject(new Error('Canvas not available'));
        return;
      }

      if (canvasAssets.length === 0) {
        reject(new Error('No assets to save'));
        return;
      }

      console.log('Creating clean canvas with assets:', canvasAssets);

      // Calculate bounding box of all assets
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      canvasAssets.forEach(asset => {
        minX = Math.min(minX, asset.x);
        minY = Math.min(minY, asset.y);
        maxX = Math.max(maxX, asset.x + asset.width);
        maxY = Math.max(maxY, asset.y + asset.height);
      });

      // No padding - tight crop around content
      const padding = 0;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      // Create canvas only for the content area
      const newCanvas = document.createElement('canvas');
      const scale = window.devicePixelRatio || 1;
      
      newCanvas.width = contentWidth * scale;
      newCanvas.height = contentHeight * scale;
      newCanvas.style.width = `${contentWidth}px`;
      newCanvas.style.height = `${contentHeight}px`;
      
      const ctx = newCanvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Scale the context for high DPI
      ctx.scale(scale, scale);

      // Set canvas background to white
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, contentWidth, contentHeight);

      try {
        // Convert all images to data URLs first
        const imageDataUrls = await Promise.all(
          canvasAssets.map(async (asset) => {
            try {
              const dataURL = await imageToDataURL(asset.src);
              return { asset, dataURL };
            } catch (error) {
              console.error('Failed to convert asset to data URL:', asset.src, error);
              return { asset, dataURL: null };
            }
          })
        );

        // Now draw all images using data URLs, adjusted for the content area
        const drawPromises = imageDataUrls.map(({ asset, dataURL }) => {
          return new Promise<void>((resolveImg) => {
            if (!dataURL) {
              resolveImg();
              return;
            }

            const img = new Image();
            img.onload = () => {
              
              // Draw the image relative to the content area (subtract minX, minY)
              ctx.drawImage(
                img,
                asset.x - minX,
                asset.y - minY,
                asset.width,
                asset.height
              );
              
              resolveImg();
            };
            
            img.onerror = (error) => {
              console.error('Failed to draw asset:', asset.id, error);
              resolveImg();
            };
            
            img.src = dataURL;
          });
        });

        await Promise.all(drawPromises);
        resolve(newCanvas);
        
      } catch (error) {
        console.error('Failed to create clean canvas:', error);
        reject(error);
      }
    });
  };

  // Capture canvas as image using clean canvas approach
  const captureCanvasImage = (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      if (!canvasRef.current) {
        console.error('Canvas ref is null');
        reject(new Error('Canvas not available'));
        return;
      }

      // Since we expect CORS issues, use clean canvas approach directly
      
      try {
        const cleanCanvas = await createCleanCanvas();
        cleanCanvas.toBlob((blob) => {
          if (blob) {
            console.log('Canvas blob created successfully via clean canvas');
            resolve(blob);
          } else {
            console.error('Failed to create blob from clean canvas');
            reject(new Error('Failed to capture canvas'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        console.error('Clean canvas approach failed:', error);
        reject(new Error('Failed to capture canvas - please check if images are loaded properly'));
      }
    });
  };



  const handleSave = async () => {
    if (!validateForm()) return;

    if (!hasCanvasAssets()) {
      setValidationErrors({ channel: 'Canvas must have at least one asset before saving' });
      return;
    }

    try {
      setIsSaving(true);

      // Capture canvas image
      const imageBlob = await captureCanvasImage();
      
      // Get content ID
      const contentId = content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
      
      if (!contentId) {
        throw new Error('Content ID is required');
      }
      
      // Create form data with just the basic required fields
      const formData = new FormData();
      formData.append('content_id', contentId);
      formData.append('slug', content.slug || '');
      formData.append('channel', selectedChannel);
      formData.append('dimension', selectedDimension);
      formData.append('use_case', selectedUseCase);
      formData.append('poster', imageBlob, 'poster.png');



      // Make API call
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_POSTER}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      // Close modal and show success
      handleClose();
      onSave();
      
      // Show success alert
      alert('Poster has been saved successfully!');
      
    } catch (error) {
      console.error('Failed to save poster:', error);
      // For now, we're not handling errors as per requirements
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedChannel('');
    setSelectedDimension('');
    setSelectedUseCase('');
    setValidationErrors({});
    setIsSaving(false);
    onClose();
  };

  const isFormValid = selectedChannel && selectedDimension && selectedUseCase && Object.keys(validationErrors).length === 0;

  // Debug save button state only when modal is open
  const saveButtonDisabled = !isFormValid || !hasCanvasAssets() || isSaving;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Save Poster</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSaving}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel <span className="text-red-500">*</span>
            </label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={isSaving}>
              <SelectTrigger className={`w-full ${validationErrors.channel ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select Channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.channel && (
              <div className="text-sm text-red-500 mt-1">{validationErrors.channel}</div>
            )}
          </div>

          {/* Dimension Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimension <span className="text-red-500">*</span>
            </label>
            <Select value={selectedDimension} onValueChange={setSelectedDimension} disabled={isSaving}>
              <SelectTrigger className={`w-full ${validationErrors.dimension ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select Dimension" />
              </SelectTrigger>
              <SelectContent>
                {DIMENSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.dimension && (
              <div className="text-sm text-red-500 mt-1">{validationErrors.dimension}</div>
            )}
          </div>

          {/* Use Case Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Case <span className="text-red-500">*</span>
            </label>
            <Select value={selectedUseCase} onValueChange={setSelectedUseCase} disabled={isSaving}>
              <SelectTrigger className={`w-full ${validationErrors.useCase ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select Use Case" />
              </SelectTrigger>
              <SelectContent>
                {USE_CASE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.useCase && (
              <div className="text-sm text-red-500 mt-1">{validationErrors.useCase}</div>
            )}
          </div>

          {/* Canvas Assets Validation */}
          {!hasCanvasAssets() && (
            <div className="text-sm text-red-500 text-center p-3 bg-red-50 rounded-lg">
              Please add at least one asset to the canvas before saving
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveButtonDisabled}
            className="px-6 py-2 font-semibold text-white rounded-lg transition-colors"
            style={{ 
              backgroundColor: isFormValid && hasCanvasAssets() && !isSaving ? COLORS.SECONDARY : '#9CA3AF',
              opacity: isFormValid && hasCanvasAssets() && !isSaving ? 1 : 0.7
            }}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 