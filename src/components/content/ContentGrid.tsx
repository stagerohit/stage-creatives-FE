import ContentCard from './ContentCard';
import type { Content } from '@/types/content';

interface ContentGridProps {
  contents: Content[];
  isLoading?: boolean;
}

// Helper function to get content ID for keys
const getContentId = (content: Content): string => {
  return content._id || content.id || content.oldContentId?.toString() || content.slug || '';
};

export default function ContentGrid({ contents, isLoading }: ContentGridProps) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-gray-400 text-lg mb-2">No content found</div>
        <div className="text-gray-500 text-sm">Try adjusting your search or filters</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contents.map((content) => {
        const contentId = getContentId(content);
        return (
        <ContentCard
            key={contentId || Math.random()} // Fallback to random key if no ID
          content={content}
        />
        );
      })}
    </div>
  );
} 