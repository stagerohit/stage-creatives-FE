import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contentService } from '@/services/api';
import { API_BASE_URL, COLORS } from '@/utils/constants';
import type { Content, Video } from '@/types/content';

interface VideosTabProps {
  content: Content;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function VideosTab({ content }: VideosTabProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get content ID from content object
  const getContentId = () => {
    return content.content_id || content.id || content._id || content.oldContentId?.toString() || '';
  };

  const fetchVideos = async () => {
    const contentId = getContentId();
    if (!contentId) {
      console.log('No content ID found, showing empty state');
      setVideos([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('Fetching videos for content ID:', contentId);
      const response = await contentService.getVideosByContentId(contentId);
      
      console.log('Videos API Response:', response);
      
      // Ensure response is an array
      const videos: Video[] = Array.isArray(response) ? response : [];
      
      // Sort videos by creation date (newest first - descending order)
      const sortedVideos = videos.sort((a: Video, b: Video) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setVideos(sortedVideos);
    } catch (err: any) {
      console.error('Failed to fetch videos:', err);
      // Always show empty state instead of breaking the app
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [content]);

  const getFullVideoUrl = (videoUrl: string) => {
    if (videoUrl.startsWith('http')) {
      return videoUrl;
    }
    return `${API_BASE_URL}${videoUrl}`;
  };

  const formatDuration = (duration: number) => {
    // Duration is in milliseconds, convert to minutes:seconds
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const validateFile = (file: File): { valid: boolean, error?: string } => {
    const maxSize = 100 * 1024 * 1024; // 100MB for videos
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/avi',
      'video/mov',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv'
    ];
    
    if (file.size > maxSize) {
      return { valid: false, error: `${file.name}: File size exceeds 100MB limit` };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `${file.name}: Invalid file type. Only MP4, WebM, AVI, MOV formats are allowed` };
    }
    
    return { valid: true };
  };

  const handleFileUpload = async (file: File) => {
    const contentId = getContentId();
    const slug = content.slug || '';
    
    if (!contentId || !slug) {
      setUploadError('Content ID or slug not found');
      return;
    }

    const validation = validateFile(file);
    
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    // Initialize progress tracking
    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading' as const,
    };
    setUploadProgress(progressItem);

    try {
      // Simulate progress (since we don't have real progress from the API)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => 
          prev && prev.status === 'uploading' 
            ? { ...prev, progress: Math.min(prev.progress + 5, 90) }
            : prev
        );
      }, 500);

      await contentService.uploadVideo(file, contentId, slug);
      
      clearInterval(progressInterval);
      
      // Mark as successful
      setUploadProgress(prev => 
        prev ? { ...prev, progress: 100, status: 'success' as const } : null
      );
      
      // Show success message
      setUploadSuccess(`Successfully uploaded video: ${file.name}`);
      
      // Refresh the videos list
      await fetchVideos();
      
      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(null);
        setUploadSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      console.error('Upload failed:', err);
      
      // Mark as failed
      setUploadProgress(prev => 
        prev ? { 
          ...prev, 
          status: 'error' as const, 
          error: err.message || 'Upload failed' 
        } : null
      );
      
      setUploadError(err.message || 'Failed to upload video');
      
      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const getProcessingStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
          {[...Array(6)].map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-end items-center">
        <Button 
          className="font-semibold"
          style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/avi,video/mov,video/quicktime,video/x-msvideo,video/x-ms-wmv"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="space-y-2">
          <div className="border rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{uploadProgress.fileName}</span>
              <span className="text-xs text-gray-500">
                {uploadProgress.status === 'uploading' && `${uploadProgress.progress}%`}
                {uploadProgress.status === 'success' && '✓ Complete'}
                {uploadProgress.status === 'error' && '✗ Failed'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  uploadProgress.status === 'success' ? 'bg-green-500' : 
                  uploadProgress.status === 'error' ? 'bg-red-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress.progress}%` }}
              ></div>
            </div>
            {uploadProgress.error && (
              <p className="text-xs text-red-600 mt-1">{uploadProgress.error}</p>
            )}
          </div>
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

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500 mb-4">Get started by uploading your first video.</p>
          <Button 
            className="font-semibold"
            style={{ backgroundColor: COLORS.SECONDARY, color: 'white' }}
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            Upload Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => {
            // Defensive programming: ensure video has required fields
            const videoId = video._id || video.video_id || Math.random().toString();
            const videoUrl = video.video_url || '';
            const filename = video.original_name || 'Unknown';
            const duration = video.duration || 0;
            const processingStatus = video.processing_status || 'unknown';
            
            return (
              <div key={videoId} className="group cursor-pointer">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 mb-3 relative">
                  {processingStatus === 'completed' ? (
                    <video
                      src={getFullVideoUrl(videoUrl)}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      onError={() => {
                        console.error('Video load error:', videoUrl);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-gray-500">Processing...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      {formatDuration(duration)}
                    </span>
                    {getProcessingStatusBadge(processingStatus)}
                  </div>
                  <p className="text-sm text-gray-700 truncate" title={filename}>
                    {filename}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 