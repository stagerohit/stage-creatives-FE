export const API_BASE_URL = 'http://localhost:3001';

export const API_ENDPOINTS = {
  ALL_CONTENT: '/all-content',
  CREATE_CONTENT: '/create-content',
  GET_CONTENT_BY_SLUG: '/content/slug',
  GET_POSTERS_BY_CONTENT: '/posters/content',
  GET_AI_IMAGES_BY_CONTENT: '/ai-images/content',
  GET_COPIES_BY_CONTENT: '/copies/content',
  GET_TAGLINES_BY_CONTENT: '/taglines/content',
  GET_TITLE_LOGOS_BY_CONTENT: '/title-logos/content',
  GET_IMAGES_BY_CONTENT: '/images/content',
  UPLOAD_IMAGES: '/images/upload',
  GET_VIDEOS_BY_CONTENT: '/videos/content',
  UPLOAD_VIDEOS: '/videos/upload',
  GENERATE_AI_IMAGE: '/ai-images/generate',
  GENERATE_TITLE_LOGO: '/title-logos/generate',
  GENERATE_TAGLINE: '/taglines/generate',
  UPLOAD_POSTER: '/posters/upload',
} as const;

export const COLORS = {
  PRIMARY: '#c12c31',
  SECONDARY: '#468a5c',
  CONTENT_BADGE: '#468a5c',
} as const;

export const DROPDOWN_OPTIONS = [
  { value: 'haryanvi', label: 'Haryanvi' },
  { value: 'rajasthani', label: 'Rajasthani' },
  { value: 'bhojpuri', label: 'Bhojpuri' },
] as const;

// TypeScript types for dimension handling
export type DimensionValue = 
  | '1168:880'
  | '1440:1080' 
  | '960:720'
  | '1080:1440'
  | '720:960'
  | '1808:768'
  | '2112:912'
  | '1680:720'
  | '1920:1080'
  | '1360:768'
  | '1280:720'
  | '1024:1024'
  | '1080:1080'
  | '720:720'
  | '1080:1920'
  | '720:1280';

export type AspectRatio = '4:3' | '3:4' | '21:9' | '16:9' | '1:1' | '9:16';

export interface DimensionOption {
  value: DimensionValue;
  label: string;
  aspectRatio: AspectRatio;
}

// Enhanced dimension options with user-friendly labels and API values
export const DIMENSION_OPTIONS: readonly DimensionOption[] = [
  // 4:3 aspect ratio
  { value: '1168:880', label: '4:3 (1168:880)', aspectRatio: '4:3' },
  { value: '1440:1080', label: '4:3 (1440:1080)', aspectRatio: '4:3' },
  { value: '960:720', label: '4:3 (960:720)', aspectRatio: '4:3' },
  
  // 3:4 aspect ratio
  { value: '1080:1440', label: '3:4 (1080:1440)', aspectRatio: '3:4' },
  { value: '720:960', label: '3:4 (720:960)', aspectRatio: '3:4' },
  
  // 21:9 aspect ratio
  { value: '1808:768', label: '21:9 (1808:768)', aspectRatio: '21:9' },
  { value: '2112:912', label: '21:9 (2112:912)', aspectRatio: '21:9' },
  { value: '1680:720', label: '21:9 (1680:720)', aspectRatio: '21:9' },
  
  // 16:9 aspect ratio
  { value: '1920:1080', label: '16:9 (1920:1080)', aspectRatio: '16:9' },
  { value: '1360:768', label: '16:9 (1360:768)', aspectRatio: '16:9' },
  { value: '1280:720', label: '16:9 (1280:720)', aspectRatio: '16:9' },
  
  // 1:1 aspect ratio
  { value: '1024:1024', label: '1:1 (1024:1024)', aspectRatio: '1:1' },
  { value: '1080:1080', label: '1:1 (1080:1080)', aspectRatio: '1:1' },
  { value: '720:720', label: '1:1 (720:720)', aspectRatio: '1:1' },
  
  // 9:16 aspect ratio
  { value: '1080:1920', label: '9:16 (1080:1920)', aspectRatio: '9:16' },
  { value: '720:1280', label: '9:16 (720:1280)', aspectRatio: '9:16' },
] as const;

// Utility functions for dimension handling
export const getDimensionLabel = (value: DimensionValue): string => {
  const option = DIMENSION_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
};

export const getDimensionValue = (label: string): DimensionValue | undefined => {
  const option = DIMENSION_OPTIONS.find(opt => opt.label === label);
  return option?.value;
};

export const getDimensionsByAspectRatio = (aspectRatio: AspectRatio): readonly DimensionOption[] => {
  return DIMENSION_OPTIONS.filter(opt => opt.aspectRatio === aspectRatio);
};

export const getUniqueAspectRatios = (): AspectRatio[] => {
  const ratios = DIMENSION_OPTIONS.map(opt => opt.aspectRatio);
  return [...new Set(ratios)];
};

export const isValidDimensionValue = (value: string): value is DimensionValue => {
  return DIMENSION_OPTIONS.some(opt => opt.value === value);
};

export const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
] as const;

export const USE_CASE_OPTIONS = [
  { value: 'social_media_organic', label: 'Social Media Organic' },
] as const; 