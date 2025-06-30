import { useEffect } from 'react';
import { contentService } from '@/services/api';
import { useContentStore } from '@/store/useContentStore';
import type { ApiError } from '@/types/content';

export function useContent() {
  const {
    contents,
    isLoading,
    error,
    setContents,
    setLoading,
    setError,
    clearError,
  } = useContentStore();

  const fetchContent = async () => {
    try {
      setLoading(true);
      clearError();
      
      const response = await contentService.getAllContent();
      
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
  };

  const refetch = () => {
    fetchContent();
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    contents,
    isLoading,
    error,
    refetch,
    clearError,
  };
} 