import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DIALECT_OPTIONS, COLORS, SEARCH_TRIGGER_LENGTHS } from '@/utils/constants';
import { useContentStore } from '@/store/useContentStore';
import { useContent } from '@/hooks/useContent';

export default function Header() {
  const { selectedLanguage, setSelectedLanguage, searchKeyword, setSearchKeyword, clearSearch } = useContentStore();
  const { searchContent, fetchContentByDialect } = useContent();
  const [localSearchValue, setLocalSearchValue] = useState('');

  // Handle search input changes
  useEffect(() => {
    const trimmedValue = localSearchValue.trim();
    
    if (trimmedValue === '') {
      // Clear search and fetch content by dialect
      clearSearch();
      fetchContentByDialect(selectedLanguage);
      return;
    }
    
    // Check if current length is one of the trigger lengths
    if (SEARCH_TRIGGER_LENGTHS.includes(trimmedValue.length as any)) {
      setSearchKeyword(trimmedValue);
      searchContent(trimmedValue, selectedLanguage);
    }
  }, [localSearchValue, selectedLanguage, setSearchKeyword, searchContent, fetchContentByDialect, clearSearch]);

  // Handle dialect changes
  const handleDialectChange = (newDialect: string) => {
    setSelectedLanguage(newDialect as any);
    
    // If there's a search keyword, search in the new dialect
    if (searchKeyword.trim()) {
      searchContent(searchKeyword, newDialect as any);
    } else {
      // Otherwise, fetch content for the new dialect
      fetchContentByDialect(newDialect as any);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-2">
            <img 
              src="/stage-logo.png" 
              alt="Creatives" 
              className="h-[35px] w-auto"
            />
            <h1 
              className="font-bold" 
              style={{ 
                fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
                fontSize: '1.625rem',
                color: COLORS.PRIMARY,
              }}
            >
              Creatives
            </h1>
          </div>
            
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search content..."
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className="pl-10 bg-gray-100 border-0 focus-visible:ring-gray-400"
              />
            </div>
          </div>

          {/* Dialect Dropdown */}
          <div className="flex items-center">
            <Select value={selectedLanguage} onValueChange={handleDialectChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIALECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
} 