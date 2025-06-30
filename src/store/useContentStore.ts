import { create } from 'zustand';
import type { Content, ApiError } from '../types/content';

interface ContentState {
  // State
  contents: Content[];
  isLoading: boolean;
  error: ApiError | null;
  selectedLanguage: string;
  
  // Actions
  setContents: (contents: Content[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  setSelectedLanguage: (language: string) => void;
  clearError: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  // Initial state
  contents: [],
  isLoading: false,
  error: null,
  selectedLanguage: 'haryanvi',
  
  // Actions
  setContents: (contents) => set({ contents }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),
  clearError: () => set({ error: null }),
})); 