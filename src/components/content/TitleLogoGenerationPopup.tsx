import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, CHANNEL_OPTIONS, COLORS } from '@/utils/constants';
import type { Content, TitleLogo } from '@/types/content';

interface TitleLogoGenerationPopupProps {
  content: Content;
  isOpen: boolean;
  onClose: () => void;
  onLogoGenerated: (logo: TitleLogo) => void;
}

export default function TitleLogoGenerationPopup({
  content,
  isOpen,
  onClose,
  onLogoGenerated
}: TitleLogoGenerationPopupProps) {
  const [promptText, setPromptText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<TitleLogo | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    promptText?: string;
    channel?: string;
  }>({});

  // Timer for elapsed time during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  // Validate form fields
  const validateForm = () => {
    const errors: { promptText?: string; channel?: string } = {};
    
    if (!promptText.trim()) {
      errors.promptText = 'Prompt text is required';
    } else if (promptText.trim().length < 10) {
      errors.promptText = 'Prompt text must be at least 10 characters';
    } else if (promptText.trim().length > 1000) {
      errors.promptText = 'Prompt text must be less than 1000 characters';
    }

    if (!selectedChannel) {
      errors.channel = 'Channel selection is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation
  useEffect(() => {
    if (promptText || selectedChannel) {
      validateForm();
    }
  }, [promptText, selectedChannel]);

  const handleGenerate = async () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
      setStartTime(Date.now());
      setElapsedTime(0);
      setGeneratedLogo(null);

      const contentId = content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
      
      const payload = {
        content_id: contentId,
        slug: content.slug,
        title_prompt: promptText.trim(),
        channel: selectedChannel.toUpperCase(),
        dimension: "16:9"
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GENERATE_TITLE_LOGO}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Title logo generated successfully:', data);
      
      setGeneratedLogo(data);
      onLogoGenerated(data);
      
    } catch (error) {
      console.error('Failed to generate title logo:', error);
      // Show error state but don't show toast as per requirements
    } finally {
      setIsGenerating(false);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const handleClose = () => {
    setPromptText('');
    setSelectedChannel('');
    setGeneratedLogo(null);
    setValidationErrors({});
    setIsGenerating(false);
    setStartTime(null);
    setElapsedTime(0);
    onClose();
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  };

  const isFormValid = promptText.trim().length >= 10 && 
                     promptText.trim().length <= 1000 && 
                     selectedChannel && 
                     Object.keys(validationErrors).length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Logo Generation</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isGenerating}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Box for Prompt
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter your prompt text here..."
              className={`w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.promptText ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isGenerating}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">
                {promptText.length}/1000 characters
              </div>
              {validationErrors.promptText && (
                <div className="text-sm text-red-500">{validationErrors.promptText}</div>
              )}
            </div>
          </div>

          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel
            </label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={isGenerating}>
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

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={!isFormValid || isGenerating}
              className="px-8 py-3 font-semibold text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: isFormValid && !isGenerating ? COLORS.SECONDARY : '#9CA3AF',
                opacity: isFormValid && !isGenerating ? 1 : 0.7
              }}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating... {elapsedTime}s
                </div>
              ) : (
                'Generate'
              )}
            </Button>
          </div>

          {/* Generated Logo Display */}
          {generatedLogo && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Logo</h3>
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                  <img
                    src={getFullImageUrl(generatedLogo.title_logo_url)}
                    alt="Generated Title Logo"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      console.error('Generated logo image failed to load:', generatedLogo.title_logo_url);
                    }}
                  />
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600">
                      {generatedLogo.dimension} • {generatedLogo.channel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
} 