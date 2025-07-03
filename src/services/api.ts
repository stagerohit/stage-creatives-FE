import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { ContentResponse, Content, Poster, AIImage, Copy, Tagline, TitleLogo, Image, Video, VideoResponse } from '../types/content';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper function to get content ID
const getContentId = (content: Content): string => {
  return content.content_id || content._id || content.id || content.oldContentId?.toString() || '';
};

export const contentService = {
  getAllContent: async (): Promise<ContentResponse> => {
    try {
      const response = await api.get<ContentResponse>(API_ENDPOINTS.ALL_CONTENT);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  createContent: async (slug: string): Promise<Content> => {
    try {
      const response = await api.post<Content>(API_ENDPOINTS.CREATE_CONTENT, { slug });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle "already exists" case
        if (error.response?.data?.message?.includes('already exists')) {
          throw {
            message: 'CONTENT_EXISTS',
            status: error.response?.status,
            data: error.response?.data,
          };
        }
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  fetchContentBySlug: async (slug: string): Promise<Content> => {
    try {
      const response = await api.get<Content>(`${API_ENDPOINTS.GET_CONTENT_BY_SLUG}/${slug}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getContentById: async (id: string): Promise<{ success: boolean; data: Content | null; message?: string }> => {
    try {
      // First get all content, then find the specific item
      // This is a temporary solution - ideally the backend should have a specific endpoint for single content
      const response = await contentService.getAllContent();
      
      const content = response.items.find((item) => {
        const itemId = getContentId(item);
        return itemId === id;
      });
      
      return {
        success: true,
        data: content || null,
        message: content ? 'Content found' : 'Content not found',
      };
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getPostersByContentId: async (contentId: string): Promise<Poster[]> => {
    try {
      const response = await api.get<Poster[]>(`${API_ENDPOINTS.GET_POSTERS_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getAIImagesByContentId: async (contentId: string): Promise<AIImage[]> => {
    try {
      const response = await api.get<AIImage[]>(`${API_ENDPOINTS.GET_AI_IMAGES_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getCopiesByContentId: async (contentId: string): Promise<Copy[]> => {
    try {
      const response = await api.get<Copy[]>(`${API_ENDPOINTS.GET_COPIES_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getTaglinesByContentId: async (contentId: string): Promise<Tagline[]> => {
    try {
      const response = await api.get<Tagline[]>(`${API_ENDPOINTS.GET_TAGLINES_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getTitleLogosByContentId: async (contentId: string): Promise<TitleLogo[]> => {
    try {
      const response = await api.get<TitleLogo[]>(`${API_ENDPOINTS.GET_TITLE_LOGOS_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getImagesByContentId: async (contentId: string): Promise<Image[]> => {
    try {
      const response = await api.get<Image[]>(`${API_ENDPOINTS.GET_IMAGES_BY_CONTENT}/${contentId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  uploadImages: async (files: File[], contentId: string, slug: string): Promise<Image[]> => {
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file) => {
        formData.append('images', file);
      });
      
      // Add content_id and slug
      formData.append('content_id', contentId);
      formData.append('slug', slug);
      
      const response = await api.post<Image[]>(API_ENDPOINTS.UPLOAD_IMAGES, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  getVideosByContentId: async (contentId: string): Promise<Video[]> => {
    try {
      const response = await api.get<VideoResponse>(`${API_ENDPOINTS.GET_VIDEOS_BY_CONTENT}/${contentId}`);
      return response.data.data.videos;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  uploadVideo: async (file: File, contentId: string, slug: string): Promise<Video> => {
    try {
      const formData = new FormData();
      
      // Add file to form data
      formData.append('video', file);
      
      // Add content_id and slug
      formData.append('content_id', contentId);
      formData.append('slug', slug);
      
      const response = await api.post<Video>(API_ENDPOINTS.UPLOAD_VIDEOS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };
      }
      throw { message: 'An unexpected error occurred' };
    }
  },
};

export default api; 