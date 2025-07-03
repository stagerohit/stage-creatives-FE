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

export const DIMENSION_OPTIONS = [
  { value: '1920:1080', label: '1920 x 1080' },
  { value: '1080:1920', label: '1080 x 1920' },
  { value: '1080:1080', label: '1080 x 1080' },
  { value: '1200:628', label: '1200 x 628' },
  { value: '1080:566', label: '1080 x 566' },
] as const;

export const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
] as const; 