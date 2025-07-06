import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, CHANNEL_OPTIONS, COLORS } from '@/utils/constants';
import type { Content, Tagline } from '@/types/content';

interface TaglineGenerationPopupProps {
  content: Content;
  isOpen: boolean;
  onClose: () => void;
  onTaglineGenerated: (tagline: Tagline) => void;
}

export default function TaglineGenerationPopup({
  content,
  isOpen,
  onClose,
  onTaglineGenerated
}: TaglineGenerationPopupProps) {
  const [taglineText, setTaglineText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTagline, setGeneratedTagline] = useState<Tagline | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    taglineText?: string;
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
    const errors: { taglineText?: string; promptText?: string; channel?: string } = {};
    
    if (!taglineText.trim()) {
      errors.taglineText = 'Tagline text is required';
    } else if (taglineText.trim().length < 10) {
      errors.taglineText = 'Tagline text must be at least 10 characters';
    } else if (taglineText.trim().length > 1000) {
      errors.taglineText = 'Tagline text must be less than 1000 characters';
    }

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

  const handleGenerate = async () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
      setStartTime(Date.now());
      setElapsedTime(0);
      setGeneratedTagline(null);

      const contentId = content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
      
      const payload = {
        content_id: contentId,
        slug: content.slug,
        text: taglineText.trim(),
        tagline_prompt: promptText.trim(),
        channel: selectedChannel.toUpperCase(),
        dimension: "16:9"
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GENERATE_TAGLINE}`, {
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
      console.log('Tagline generated successfully:', data);
      
      setGeneratedTagline(data);
      onTaglineGenerated(data);
      
    } catch (error) {
      console.error('Failed to generate tagline:', error);
      // Show error state but don't show toast as per requirements
    } finally {
      setIsGenerating(false);
      setStartTime(null);
      setElapsedTime(0);
    }
  };

  const handleClose = () => {
    setTaglineText('');
    setPromptText('');
    setSelectedChannel('');
    setGeneratedTagline(null);
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

  const isFormValid = taglineText.trim().length >= 10 && 
                     taglineText.trim().length <= 1000 && 
                     promptText.trim().length >= 10 && 
                     promptText.trim().length <= 1000 && 
                     selectedChannel && 
                     Object.keys(validationErrors).length === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tagline Generation</h2>
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
          {/* Tagline Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline Text
            </label>
            <textarea
              value={taglineText}
              onChange={(e) => setTaglineText(e.target.value)}
              placeholder="Enter your tagline text here..."
              className={`w-full h-20 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                validationErrors.taglineText ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isGenerating}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">
                {taglineText.length}/1000 characters
              </div>
              {validationErrors.taglineText && (
                <div className="text-sm text-red-500">{validationErrors.taglineText}</div>
              )}
            </div>
          </div>

          {/* Prompt Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
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

          {/* Generated Tagline Display */}
          {generatedTagline && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Tagline</h3>
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-lg p-4 max-w-md">
                  <img
                    src={getFullImageUrl(generatedTagline.tagline_url)}
                    alt="Generated Tagline"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      console.error('Generated tagline image failed to load:', generatedTagline.tagline_url);
                    }}
                  />
                  <div className="mt-3 text-center">
                    <div className="text-sm text-gray-600">
                      {generatedTagline.dimension} • {generatedTagline.channel}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      "{generatedTagline.text}"
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