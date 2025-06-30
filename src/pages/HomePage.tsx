import Header from '@/components/layout/Header';
import ContentGrid from '@/components/content/ContentGrid';
import { useContent } from '@/hooks/useContent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { contents, isLoading, error, refetch, clearError } = useContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-red-800">
                {error.message}
                {error.status && ` (${error.status})`}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearError}
                  className="text-red-600 border-red-300 hover:bg-red-100"
                >
                  Dismiss
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="text-red-600 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Content Grid */}
        <ContentGrid contents={contents} isLoading={isLoading} />
      </main>
    </div>
  );
} 