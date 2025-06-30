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
}

export interface ContentResponse {
  items: Content[];
}

export interface ApiError {
  message: string;
  status?: number;
} 