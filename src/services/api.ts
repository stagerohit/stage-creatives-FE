import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { ContentResponse, Content } from '../types/content';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper function to get content ID
const getContentId = (content: Content): string => {
  return content._id || content.id || content.oldContentId?.toString() || content.slug || '';
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
};

export default api; 