export interface Content {
  _id?: string; // Keep for backward compatibility, but use other fields as primary
  id?: string; // Alternative ID field
  oldContentId?: number;
  title: string;
  contentType: string;
  thumbnailURL?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  dialect?: string;
  duration?: number;
  format?: string;
  language?: string;
  releaseDate?: string;
  slug?: string;
  status?: string;
  transcodingStatus?: string;
  createdBy?: string;
  updatedBy?: string;
  // Additional fields from create-content API response
  trailer_url?: string;
  content_type?: string;
  created_at?: string;
  genre?: string;
  content_id?: string;
}

export interface ContentResponse {
  items: Content[];
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface Poster {
  id: string;
  content_id: string;
  poster_url: string;
  dimension: string;
  channel?: string;
  created_at: string;
  updated_at: string;
}

export interface PosterResponse {
  items: Poster[];
}

export interface AIImage {
  _id: string;
  ai_image_id: string;
  content_id: string;
  slug: string;
  channel: string;
  use_case: string;
  input_image_urls: string[];
  image_ids: string[];
  ai_image_ids: string[];
  reference_images: {
    url: string;
    tag: string;
    _id: string;
  }[];
  prompt: string;
  ai_image_url: string;
  dimension: string;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface Copy {
  _id: string;
  copy_id: string;
  content_id: string;
  slug: string;
  text: string;
  copy: string;
  copy_prompt: string;
  channel: string;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tagline {
  _id: string;
  tagline_id: string;
  content_id: string;
  slug: string;
  text: string;
  tagline_prompt: string;
  tagline_url: string;
  channel: string;
  dimension: string;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface TitleLogo {
  _id: string;
  title_logo_id: string;
  content_id: string;
  slug: string;
  title_logo_url: string;
  channel: string;
  title_prompt: string;
  title: string;
  dimension: string;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  _id: string;
  image_id: string;
  content_id: string;
  slug: string;
  image_url: string;
  original_filename: string;
  source: string;
  dimension: string;
  file_size: number;
  created_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id: string;
  video_id: string;
  content_id: string;
  slug: string;
  original_name: string;
  video_url: string;
  duration: number;
  file_size: number;
  processing_status: string;
  screenshots_count: number;
  timestamp: number;
  created_at: string;
  createdAt: string;
  updatedAt: string;
  frame_rate: number;
  resolution: string;
}

export interface VideoResponse {
  statusCode: number;
  message: string;
  data: {
    content_id: string;
    videos: Video[];
    count: number;
  };
} 