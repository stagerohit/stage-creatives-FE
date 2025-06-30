export const API_BASE_URL = 'http://localhost:3001';

export const API_ENDPOINTS = {
  ALL_CONTENT: '/all-content',
} as const;

export const COLORS = {
  PRIMARY: '#c12c31',
  CONTENT_BADGE: '#468a5c',
} as const;

export const DROPDOWN_OPTIONS = [
  { value: 'haryanvi', label: 'Haryanvi' },
  { value: 'rajasthani', label: 'Rajasthani' },
  { value: 'bhojpuri', label: 'Bhojpuri' },
] as const; 