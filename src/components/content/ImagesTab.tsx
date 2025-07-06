import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { API_BASE_URL, COLORS } from '@/utils/constants';
import type { Content, Image, ApiError } from '@/types/content';

interface ImagesTabProps {
  content: Content;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function ImagesTab({ content }: ImagesTabProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  const fetchImages = async () => {
    const contentId = getContentId();
    if (!contentId) {
      setError({ message: 'Content ID not found' });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await contentService.getImagesByContentId(contentId);
      
      console.log('Images API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Is Array:', Array.isArray(response));
      console.log('Images count:', response.length);
      
      // API returns direct array of images
      const images = Array.isArray(response) ? response : [];
      
      // Sort images by creation date (newest first)
      const sortedImages = images.sort((a: Image, b: Image) => {
        // Get creation date from either created_at or createdAt
        const dateA = a.created_at || a.createdAt;
        const dateB = b.created_at || b.createdAt;
        
        // If both have dates, sort by date (newest first)
        if (dateA && dateB) {
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        
        // If only one has a date, the one with date comes first
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        
        // If neither has a date, maintain original order
        return 0;
      });
      
      console.log('Setting images state with:', sortedImages);
      setImages(sortedImages);
    } catch (err: any) {
      console.error('Failed to fetch images:', err);
      // For now, if API fails, show empty state instead of error
      // This allows us to test the UI without requiring backend
      setImages([]);
      console.log('Setting empty images array due to API error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [content]);

  const getFullImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  };

  const formatDimension = (dimension: string) => {
    // Convert dimension string like "1920:1080" to "1920 x 1080"
    return dimension.replace(':', ' x ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    const valid: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds 10MB limit`);
      } else if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed`);
      } else {
        valid.push(file);
      }
    });
    
    return { valid, errors };
  };

  const handleFileUpload = async (files: File[]) => {
    const contentId = getContentId();
    const slug = content.slug || '';
    
    if (!contentId || !slug) {
      setUploadError('Content ID or slug not found');
      return;
    }

    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setUploadError(errors.join(', '));
      return;
    }

    if (valid.length === 0) {
      setUploadError('No valid files to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    // Initialize progress tracking
    const progressItems: UploadProgress[] = valid.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadProgress(progressItems);

    try {
      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => 
          prev.map(item => 
            item.status === 'uploading' 
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item
          )
        );
      }, 200);

      await contentService.uploadImages(valid, contentId, slug);
      
      clearInterval(progressInterval);
      
      // Mark all as successful
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, progress: 100, status: 'success' as const }))
      );
      
      // Show success message
      const fileCount = valid.length;
      const fileWord = fileCount === 1 ? 'image' : 'images';
      setUploadSuccess(`Successfully uploaded ${fileCount} ${fileWord}`);
      
      // Refresh the images list
      await fetchImages();
      
      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress([]);
        setUploadSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      
      // Mark all as failed
      setUploadProgress(prev => 
        prev.map(item => ({ 
          ...item, 
          status: 'error' as const, 
          error: err.message || 'Upload failed' 
        }))
      );
      
      setUploadError(err.message || 'Failed to upload images');
      
      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress([]);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value to allow selecting the same files again
    event.target.value = '';
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header with Loading Skeleton */}
        <div className="flex justify-end items-center">
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Grid Loading Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            Upload Images
          </Button>
        </div>

        {/* Error Alert */}
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end items-center">
        <Button 
          className="font-semibold"
          style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{item.fileName}</span>
                <span className="text-xs text-gray-500">
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'success' && '✓ Complete'}
                  {item.status === 'error' && '✗ Failed'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === 'success' ? 'bg-green-500' : 
                    item.status === 'error' ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              {item.error && (
                <p className="text-xs text-red-600 mt-1">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success Alert */}
      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {uploadSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {uploadError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-500 mb-4">Get started by uploading your first images.</p>
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            Upload Images
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image._id} className="group cursor-pointer">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
                <img
                  src={getFullImageUrl(image.image_url)}
                  alt={image.original_filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    console.error('Image load error:', image.image_url);
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExNi41NjkgMTQwIDEzMCAxMjYuNTY5IDEzMCAxMTBDMTMwIDkzLjQzMTUgMTE2LjU2OSA4MCAxMDAgODBDODMuNDMxNSA4MCA3MCA5My40MzE1IDcwIDExMEM3MCAxMjYuNTY5IDgzLjQzMTUgMTQwIDEwMCAxNDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xNjAgMTYwTDEyNS44NTcgMTI1Ljg1N0MxMjQuMjg2IDEyNC4yODYgMTIxLjcxNCAxMjQuMjg2IDEyMC4xNDMgMTI1Ljg1N0w2MCA2MCIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {formatDimension(image.dimension)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatFileSize(image.file_size)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate" title={image.original_filename}>
                  {image.original_filename}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 