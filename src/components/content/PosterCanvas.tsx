import { useRef, useEffect, useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { API_BASE_URL } from '@/utils/constants';
import { useToast } from '@/components/ui/toast';

export interface CanvasAsset {
  id: string;
  src: string;
  type: 'ai-image' | 'title-logo' | 'tagline';
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  data: any;
}

interface PosterCanvasProps {
  onAssetsChange?: (assets: CanvasAsset[]) => void;
}

export default function PosterCanvas({ onAssetsChange }: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<CanvasAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const { addToast } = useToast();

  // Drop zone functionality
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'asset',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        // Calculate coordinates relative to canvas
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;
        
        addAssetToCanvas(item, x, y);
        addToast(`${item.type} added to canvas`, 'success');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // Load image and add to canvas
  const addAssetToCanvas = useCallback((item: any, x: number, y: number) => {
    const fullImageUrl = item.src.startsWith('http') ? item.src : `${API_BASE_URL}${item.src}`;
    
    const img = new Image();
    // Remove crossOrigin to avoid CORS issues
    // img.crossOrigin = 'anonymous';
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const maxWidth = 200;
      const maxHeight = 200;
      
      let width, height;
      if (aspectRatio > 1) {
        width = Math.min(maxWidth, img.naturalWidth);
        height = width / aspectRatio;
      } else {
        height = Math.min(maxHeight, img.naturalHeight);
        width = height * aspectRatio;
      }

      const newAsset: CanvasAsset = {
        id: `${item.id}-${Date.now()}`,
        src: fullImageUrl,
        type: item.type,
        x: Math.max(0, x - width / 2),
        y: Math.max(0, y - height / 2),
        width,
        height,
        selected: false,
        data: item.data,
      };

      setAssets(prev => {
        const updated = [...prev, newAsset];
        onAssetsChange?.(updated);
        return updated;
      });

      setLoadedImages(prev => new Map(prev.set(newAsset.id, img)));
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', fullImageUrl, error);
      addToast('Failed to load image', 'error');
    };
    
    img.src = fullImageUrl;
  }, [onAssetsChange]);

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all assets
    assets.forEach(asset => {
      const img = loadedImages.get(asset.id);
      if (img) {
        ctx.drawImage(img, asset.x, asset.y, asset.width, asset.height);
        
        // Draw selection border if selected
        if (asset.selected) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(asset.x - 1, asset.y - 1, asset.width + 2, asset.height + 2);
          
          // Draw resize handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          
          // Corner handles
          const corners = [
            { x: asset.x - handleSize/2, y: asset.y - handleSize/2 },
            { x: asset.x + asset.width - handleSize/2, y: asset.y - handleSize/2 },
            { x: asset.x - handleSize/2, y: asset.y + asset.height - handleSize/2 },
            { x: asset.x + asset.width - handleSize/2, y: asset.y + asset.height - handleSize/2 },
          ];
          
          corners.forEach(corner => {
            ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
          });
        }
      }
    });
  }, [assets, loadedImages]);

  // Handle canvas clicks
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked asset (from top to bottom)
    let clickedAsset: CanvasAsset | null = null;
    for (let i = assets.length - 1; i >= 0; i--) {
      const asset = assets[i];
      if (x >= asset.x && x <= asset.x + asset.width && 
          y >= asset.y && y <= asset.y + asset.height) {
        clickedAsset = asset;
        break;
      }
    }

    // Update selection
    setAssets(prev => {
      const updated = prev.map(asset => ({
        ...asset,
        selected: asset.id === clickedAsset?.id
      }));
      onAssetsChange?.(updated);
      return updated;
    });

    setSelectedAssetId(clickedAsset?.id || null);
  }, [assets, onAssetsChange]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const selectedAsset = assets.find(asset => asset.selected);
    if (!selectedAsset) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x >= selectedAsset.x && x <= selectedAsset.x + selectedAsset.width && 
        y >= selectedAsset.y && y <= selectedAsset.y + selectedAsset.height) {
      setIsDragging(true);
      setDragOffset({
        x: x - selectedAsset.x,
        y: y - selectedAsset.y
      });
    }
  }, [assets]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    if (!isDragging || !selectedAssetId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setAssets(prev => {
      const updated = prev.map(asset => {
        if (asset.id === selectedAssetId) {
          return {
            ...asset,
            x: Math.max(0, Math.min(canvas.width - asset.width, x - dragOffset.x)),
            y: Math.max(0, Math.min(canvas.height - asset.height, y - dragOffset.y))
          };
        }
        return asset;
      });
      onAssetsChange?.(updated);
      return updated;
    });
  }, [isDragging, selectedAssetId, dragOffset, onAssetsChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Draw canvas when assets or images change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Combine container and drop refs
  const containerDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  // Auto-resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width - 32; // Account for padding
      const height = rect.height - 32; // Account for padding
      
      canvas.width = width;
      canvas.height = height;
      
      // Redraw after resize
      drawCanvas();
    };

    resizeCanvas();
    
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [drawCanvas]);

  return (
    <div 
      ref={containerDropRef}
      className={`w-full h-full relative border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg cursor-pointer"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: 'transparent',
          pointerEvents: 'none'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Invisible overlay for canvas interactions */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: 1 }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {isOver && (
        <div 
          className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none flex items-center justify-center"
          style={{ zIndex: 2 }}
        >
          <span className="text-blue-600 font-medium text-lg">Drop image here</span>
        </div>
      )}

      {assets.length === 0 && !isOver && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <span className="text-gray-500 text-lg">Drop images here</span>
        </div>
      )}
    </div>
  );
} 