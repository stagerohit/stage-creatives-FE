import { useEffect, useCallback } from 'react';
import { contentService } from '@/services/api';
import { useContentStore } from '@/store/useContentStore';
import type { ApiError } from '@/types/content';
import type { DialectCode } from '@/utils/constants';

export function useContent() {
  const {
    contents,
    isLoading,
    error,
    selectedLanguage,
    searchKeyword,
    isSearching,
    setContents,
    setLoading,
    setError,
    setIsSearching,
    clearError,
  } = useContentStore();

  const fetchContentByDialect = useCallback(async (dialect: DialectCode) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await contentService.getContentByDialect(dialect);
      
      if (response.items) {
        setContents(response.items);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err as ApiError;
      setError({
        message: error.message || 'An unexpected error occurred',
        status: error.status,
      });
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [setContents, setLoading, setError, clearError]);

  const searchContent = useCallback(async (keyword: string, dialect: DialectCode) => {
    try {
      setIsSearching(true);
      clearError();
      
      const response = await contentService.searchContentByDialect(keyword, dialect);
      
      if (response.items) {
        setContents(response.items);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err as ApiError;
      setError({
        message: error.message || 'An unexpected error occurred',
        status: error.status,
      });
      setContents([]);
    } finally {
      setIsSearching(false);
    }
  }, [setContents, setError, setIsSearching, clearError]);

  const refetch = useCallback(() => {
    if (searchKeyword.trim()) {
      searchContent(searchKeyword, selectedLanguage);
    } else {
      fetchContentByDialect(selectedLanguage);
    }
  }, [searchKeyword, selectedLanguage, searchContent, fetchContentByDialect]);

  // Fetch content when dialect changes
  useEffect(() => {
    if (!searchKeyword.trim()) {
      fetchContentByDialect(selectedLanguage);
    }
  }, [selectedLanguage, searchKeyword, fetchContentByDialect]);

  return {
    contents,
    isLoading: isLoading || isSearching,
    error,
    refetch,
    clearError,
    searchContent,
    fetchContentByDialect,
  };
} 