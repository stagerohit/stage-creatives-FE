import { create } from 'zustand';
import type { Content, ApiError } from '../types/content';
import type { DialectCode } from '../utils/constants';

interface ContentState {
  // State
  contents: Content[];
  isLoading: boolean;
  error: ApiError | null;
  selectedLanguage: DialectCode;
  searchKeyword: string;
  isSearching: boolean;
  
  // Actions
  setContents: (contents: Content[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: ApiError | null) => void;
  setSelectedLanguage: (language: DialectCode) => void;
  setSearchKeyword: (keyword: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearError: () => void;
  clearSearch: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  // Initial state - Default dialect is Bhojpuri
  contents: [],
  isLoading: false,
  error: null,
  selectedLanguage: 'bho',
  searchKeyword: '',
  isSearching: false,
  
  // Actions
  setContents: (contents) => set({ contents }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),
  setSearchKeyword: (searchKeyword) => set({ searchKeyword }),
  setIsSearching: (isSearching) => set({ isSearching }),
  clearError: () => set({ error: null }),
  clearSearch: () => set({ searchKeyword: '', isSearching: false }),
})); 