import { useState } from 'react';

interface AIPromptTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function AIPromptTextarea({ 
  value, 
  onChange, 
  placeholder = "Enter your AI prompt here..." 
}: AIPromptTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`w-full h-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
          isFocused ? 'bg-white' : 'bg-gray-50'
        }`}
        style={{ minHeight: '100%' }}
      />
      
      {/* Character count */}
      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
        {value.length} characters
      </div>
    </div>
  );
} 