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
}

export interface ApiError {
  message: string;
  status?: number;
} 