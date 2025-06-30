import { Card, CardContent } from '@/components/ui/card';
import { COLORS } from '@/utils/constants';
import { useNavigate } from 'react-router-dom';
import type { Content } from '@/types/content';

interface ContentCardProps {
  content: Content;
  onClick?: () => void;
}

export default function ContentCard({ content, onClick }: ContentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (content.slug) {
      navigate(`/content-detail/${content.slug}`);
    }
  };
  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-gray-200 transition-transform hover:scale-105"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          {content.thumbnailURL ? (
            <img
              src={content.thumbnailURL}
              alt={content.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200">
              <div className="text-gray-400 text-sm">No Image</div>
            </div>
          )}
        </div>
        
        {/* Content Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 
              className="font-medium text-gray-900 line-clamp-2 flex-1"
              style={{ 
                fontFamily: 'Roboto, sans-serif',
                fontSize: '15px'
              }}
            >
              {content.title}
            </h3>
            
            <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                 style={{ 
                   backgroundColor: COLORS.CONTENT_BADGE + '20',
                   color: COLORS.CONTENT_BADGE
                 }}>
              {content.contentType}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 