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
  effects?: any; // ImageEffects from ImageEditingTools
}

interface PosterCanvasProps {
  assets?: CanvasAsset[];
  onAssetsChange?: (assets: CanvasAsset[]) => void;
}

export default function PosterCanvas({ assets: externalAssets = [], onAssetsChange }: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<CanvasAsset[]>([]);

  // Sync internal assets with external assets prop
  useEffect(() => {
    setAssets(externalAssets);
  }, [externalAssets]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialAssetState, setInitialAssetState] = useState<CanvasAsset | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string>('default');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, assetId: string } | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const { addToast } = useToast();

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedAsset = assets.find(asset => asset.selected);
        if (selectedAsset) {
          setAssets(prev => {
            const updated = prev.filter(asset => asset.id !== selectedAsset.id);
            onAssetsChange?.(updated);
            return updated;
          });
          setLoadedImages(prev => {
            const newMap = new Map(prev);
            newMap.delete(selectedAsset.id);
            return newMap;
          });
          setSelectedAssetId(null);
          addToast('Image removed from canvas', 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assets, onAssetsChange, addToast]);

  // Handle clicks outside context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Helper function to detect resize handle clicks
  const getResizeHandle = useCallback((asset: CanvasAsset, x: number, y: number) => {
    const handleSize = 8;
    const handles = [
      { type: 'tl', x: asset.x - handleSize/2, y: asset.y - handleSize/2 },
      { type: 'tr', x: asset.x + asset.width - handleSize/2, y: asset.y - handleSize/2 },
      { type: 'bl', x: asset.x - handleSize/2, y: asset.y + asset.height - handleSize/2 },
      { type: 'br', x: asset.x + asset.width - handleSize/2, y: asset.y + asset.height - handleSize/2 },
    ];

    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && 
          y >= handle.y && y <= handle.y + handleSize) {
        return handle.type as 'tl' | 'tr' | 'bl' | 'br';
      }
    }
    return null;
  }, []);

  // Helper function to get cursor style based on resize handle
  const getCursorStyle = useCallback((handle: 'tl' | 'tr' | 'bl' | 'br' | null) => {
    if (!handle) return 'default';
    switch (handle) {
      case 'tl':
      case 'br':
        return 'nw-resize';
      case 'tr':
      case 'bl':
        return 'ne-resize';
      default:
        return 'default';
    }
  }, []);

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
        ctx.save(); // Save current context state
        
        // Apply effects if present
        if (asset.effects) {
          const effects = asset.effects;
          console.log('Applying effects to asset:', asset.id, effects);
          
          // Apply transformations
          const centerX = asset.x + asset.width / 2;
          const centerY = asset.y + asset.height / 2;
          
          // Move to center for rotation
          ctx.translate(centerX, centerY);
          
          // Apply rotation
          if (effects.rotation) {
            ctx.rotate((effects.rotation * Math.PI) / 180);
          }
          
          // Apply flip
          ctx.scale(
            effects.flipHorizontal ? -1 : 1,
            effects.flipVertical ? -1 : 1
          );
          
          // Apply opacity
          if (effects.opacity !== undefined) {
            ctx.globalAlpha = effects.opacity / 100;
          }
          
          // Apply filters using CSS filter string
          const filters = [];
          if (effects.brightness !== 0) filters.push(`brightness(${100 + effects.brightness}%)`);
          if (effects.contrast !== 0) filters.push(`contrast(${100 + effects.contrast}%)`);
          if (effects.saturation !== 0) filters.push(`saturate(${100 + effects.saturation}%)`);
          if (effects.hue !== 0) filters.push(`hue-rotate(${effects.hue}deg)`);
          if (effects.blur > 0) filters.push(`blur(${effects.blur}px)`);
          if (effects.sepia > 0) filters.push(`sepia(${effects.sepia}%)`);
          if (effects.grayscale > 0) filters.push(`grayscale(${effects.grayscale}%)`);
          if (effects.invert) filters.push(`invert(100%)`);
          
          if (filters.length > 0) {
            ctx.filter = filters.join(' ');
          }
          
          // Draw image centered at origin (due to translation)
          ctx.drawImage(img, -asset.width / 2, -asset.height / 2, asset.width, asset.height);
          
          // Draw gradient overlay if enabled
          if (effects.gradient?.enabled && effects.gradient.opacity > 0) {
            const gradient = ctx.createLinearGradient(
              -asset.width / 2,
              -asset.height / 2,
              asset.width / 2,
              asset.height / 2
            );
            effects.gradient.colors.forEach((colorStop: any) => {
              gradient.addColorStop(colorStop.position / 100, colorStop.color);
            });
            
            ctx.globalAlpha = (effects.gradient.opacity / 100) * (effects.opacity / 100);
            ctx.fillStyle = gradient;
            ctx.fillRect(-asset.width / 2, -asset.height / 2, asset.width, asset.height);
          }

          // Draw advanced gradient overlay if enabled
          if (effects.advancedGradient) {
            const advGrad = effects.advancedGradient;
            console.log('Applying advanced gradient:', advGrad);
            
            // Create gradient based on type
            let gradient: CanvasGradient;
            
            if (advGrad.type === 'linear') {
              if (advGrad.area) {
                // Scale coordinates from preview area to actual asset dimensions
                const previewWidth = advGrad.previewDimensions?.width || 400;
                const previewHeight = advGrad.previewDimensions?.height || 240;
                
                const scaleX = asset.width / previewWidth;
                const scaleY = asset.height / previewHeight;
                
                const startX = (advGrad.area.startX * scaleX) - asset.width / 2;
                const startY = (advGrad.area.startY * scaleY) - asset.height / 2;
                const endX = (advGrad.area.endX * scaleX) - asset.width / 2;
                const endY = (advGrad.area.endY * scaleY) - asset.height / 2;
                
                gradient = ctx.createLinearGradient(startX, startY, endX, endY);
              } else {
                // Default to full image
                gradient = ctx.createLinearGradient(-asset.width / 2, -asset.height / 2, asset.width / 2, asset.height / 2);
              }
            } else if (advGrad.type === 'radial') {
              if (advGrad.area) {
                const previewWidth = advGrad.previewDimensions?.width || 400;
                const previewHeight = advGrad.previewDimensions?.height || 240;
                
                const scaleX = asset.width / previewWidth;
                const scaleY = asset.height / previewHeight;
                
                const centerX = ((advGrad.area.startX + advGrad.area.endX) / 2 * scaleX) - asset.width / 2;
                const centerY = ((advGrad.area.startY + advGrad.area.endY) / 2 * scaleY) - asset.height / 2;
                const radius = Math.sqrt(
                  Math.pow((advGrad.area.endX - advGrad.area.startX) * scaleX, 2) + 
                  Math.pow((advGrad.area.endY - advGrad.area.startY) * scaleY, 2)
                ) / 2;
                
                gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
              } else {
                gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(asset.width, asset.height) / 2);
              }
            } else {
              // Conic gradient fallback to linear
              gradient = ctx.createLinearGradient(-asset.width / 2, -asset.height / 2, asset.width / 2, asset.height / 2);
            }
            
            // Add color stops
            const sortedStops = [...advGrad.colorStops].sort((a, b) => a.position - b.position);
            sortedStops.forEach(stop => {
              gradient.addColorStop(stop.position / 100, stop.color);
            });
            
            // Apply gradient with opacity and blend mode
            ctx.globalAlpha = (advGrad.opacity / 100) * (effects.opacity / 100);
            ctx.globalCompositeOperation = advGrad.blendMode as GlobalCompositeOperation;
            ctx.fillStyle = gradient;
            
            // Apply gradient to specified area or full image
            if (advGrad.area) {
              const previewWidth = advGrad.previewDimensions?.width || 400;
              const previewHeight = advGrad.previewDimensions?.height || 240;
              
              const scaleX = asset.width / previewWidth;
              const scaleY = asset.height / previewHeight;
              
              const gradX = (advGrad.area.startX * scaleX) - asset.width / 2;
              const gradY = (advGrad.area.startY * scaleY) - asset.height / 2;
              const gradW = Math.abs(advGrad.area.endX - advGrad.area.startX) * scaleX;
              const gradH = Math.abs(advGrad.area.endY - advGrad.area.startY) * scaleY;
              
              ctx.fillRect(gradX, gradY, gradW, gradH);
            } else {
              ctx.fillRect(-asset.width / 2, -asset.height / 2, asset.width, asset.height);
            }
            
            // Reset composite operation
            ctx.globalCompositeOperation = 'source-over';
          }
          
          // Draw border if enabled
          if (effects.borderWidth > 0) {
            ctx.globalAlpha = effects.opacity / 100;
            ctx.strokeStyle = effects.borderColor;
            ctx.lineWidth = effects.borderWidth;
            ctx.strokeRect(-asset.width / 2, -asset.height / 2, asset.width, asset.height);
          }
          
        } else {
          // No effects, draw normally
          ctx.drawImage(img, asset.x, asset.y, asset.width, asset.height);
        }
        
        ctx.restore(); // Restore context state
        
        // Draw selection border if selected (always on top, no effects)
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

          // Draw delete hint
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = '12px Arial';
          const hintText = 'Press Delete to remove';
          const textWidth = ctx.measureText(hintText).width;
          const hintX = asset.x + asset.width - textWidth - 5;
          const hintY = asset.y - 10;
          
          if (hintY > 12) { // Only show if there's space above
            ctx.fillText(hintText, hintX, hintY);
          }
        }
      }
    });
  }, [assets, loadedImages]);

  // Handle canvas clicks
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Hide context menu on any click
    setContextMenu(null);

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

  // Handle right-click for context menu
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked asset
    let clickedAsset: CanvasAsset | null = null;
    for (let i = assets.length - 1; i >= 0; i--) {
      const asset = assets[i];
      if (x >= asset.x && x <= asset.x + asset.width && 
          y >= asset.y && y <= asset.y + asset.height) {
        clickedAsset = asset;
        break;
      }
    }

    if (clickedAsset) {
      // Show context menu at mouse position
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        assetId: clickedAsset.id
      });
      
      // Select the asset
      setAssets(prev => {
        const updated = prev.map(asset => ({
          ...asset,
          selected: asset.id === clickedAsset?.id
        }));
        onAssetsChange?.(updated);
        return updated;
      });
      setSelectedAssetId(clickedAsset.id);
    }
  }, [assets, onAssetsChange]);

  // Handle delete from context menu
  const handleDeleteAsset = useCallback((assetId: string) => {
    setAssets(prev => {
      const updated = prev.filter(asset => asset.id !== assetId);
      onAssetsChange?.(updated);
      return updated;
    });
    setLoadedImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(assetId);
      return newMap;
    });
    setSelectedAssetId(null);
    setContextMenu(null);
    addToast('Image removed from canvas', 'success');
  }, [onAssetsChange, addToast]);

  // Handle mouse down for dragging and resizing
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const selectedAsset = assets.find(asset => asset.selected);
    if (!selectedAsset) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on a resize handle
    const handle = getResizeHandle(selectedAsset, x, y);
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setInitialAssetState({ ...selectedAsset });
      setDragOffset({ x, y });
    } else if (x >= selectedAsset.x && x <= selectedAsset.x + selectedAsset.width && 
               y >= selectedAsset.y && y <= selectedAsset.y + selectedAsset.height) {
      // Clicking on asset body - start dragging
      setIsDragging(true);
      setDragOffset({
        x: x - selectedAsset.x,
        y: y - selectedAsset.y
      });
    }
  }, [assets, getResizeHandle]);

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement | HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update cursor based on what's being hovered over
    if (!isDragging && !isResizing) {
      const selectedAsset = assets.find(asset => asset.selected);
      if (selectedAsset) {
        const handle = getResizeHandle(selectedAsset, x, y);
        if (handle) {
          setCurrentCursor(getCursorStyle(handle));
        } else if (x >= selectedAsset.x && x <= selectedAsset.x + selectedAsset.width && 
                   y >= selectedAsset.y && y <= selectedAsset.y + selectedAsset.height) {
          setCurrentCursor('move');
        } else {
          setCurrentCursor('default');
        }
      } else {
        setCurrentCursor('default');
      }
    }

    if (!selectedAssetId || (!isDragging && !isResizing)) return;

    if (isDragging) {
      // Handle dragging
      setAssets(prev => {
        const updated = prev.map(asset => {
          if (asset.id === selectedAssetId) {
            const displayWidth = canvas.offsetWidth;
            const displayHeight = canvas.offsetHeight;
            return {
              ...asset,
              x: Math.max(0, Math.min(displayWidth - asset.width, x - dragOffset.x)),
              y: Math.max(0, Math.min(displayHeight - asset.height, y - dragOffset.y))
            };
          }
          return asset;
        });
        onAssetsChange?.(updated);
        return updated;
      });
    } else if (isResizing && resizeHandle && initialAssetState) {
      // Handle resizing with aspect ratio preservation
      const dx = x - dragOffset.x;
      const dy = y - dragOffset.y;
      
      setAssets(prev => {
        const updated = prev.map(asset => {
          if (asset.id === selectedAssetId) {
            let newAsset = { ...asset };
            const minSize = 20; // Minimum size for assets
            
            // Calculate scale factor based on mouse movement
            let scaleFactor: number;
            let newWidth: number, newHeight: number;
            
            switch (resizeHandle) {
              case 'tl': // Top-left
                // Use the average of horizontal and vertical movement for more natural resize
                scaleFactor = 1 - (Math.abs(dx) + Math.abs(dy)) / (initialAssetState.width + initialAssetState.height);
                scaleFactor = Math.max(minSize / Math.max(initialAssetState.width, initialAssetState.height), scaleFactor);
                newWidth = initialAssetState.width * scaleFactor;
                newHeight = initialAssetState.height * scaleFactor;
                newAsset.width = newWidth;
                newAsset.height = newHeight;
                newAsset.x = initialAssetState.x + (initialAssetState.width - newWidth);
                newAsset.y = initialAssetState.y + (initialAssetState.height - newHeight);
                break;
              case 'tr': // Top-right
                scaleFactor = 1 + (dx - dy) / (initialAssetState.width + initialAssetState.height);
                scaleFactor = Math.max(minSize / Math.max(initialAssetState.width, initialAssetState.height), scaleFactor);
                newWidth = initialAssetState.width * scaleFactor;
                newHeight = initialAssetState.height * scaleFactor;
                newAsset.width = newWidth;
                newAsset.height = newHeight;
                newAsset.x = initialAssetState.x;
                newAsset.y = initialAssetState.y + (initialAssetState.height - newHeight);
                break;
              case 'bl': // Bottom-left
                scaleFactor = 1 + (-dx + dy) / (initialAssetState.width + initialAssetState.height);
                scaleFactor = Math.max(minSize / Math.max(initialAssetState.width, initialAssetState.height), scaleFactor);
                newWidth = initialAssetState.width * scaleFactor;
                newHeight = initialAssetState.height * scaleFactor;
                newAsset.width = newWidth;
                newAsset.height = newHeight;
                newAsset.x = initialAssetState.x + (initialAssetState.width - newWidth);
                newAsset.y = initialAssetState.y;
                break;
              case 'br': // Bottom-right
                scaleFactor = 1 + (dx + dy) / (initialAssetState.width + initialAssetState.height);
                scaleFactor = Math.max(minSize / Math.max(initialAssetState.width, initialAssetState.height), scaleFactor);
                newWidth = initialAssetState.width * scaleFactor;
                newHeight = initialAssetState.height * scaleFactor;
                newAsset.width = newWidth;
                newAsset.height = newHeight;
                newAsset.x = initialAssetState.x;
                newAsset.y = initialAssetState.y;
                break;
            }
            
            // Ensure asset stays within canvas bounds
            const displayWidth = canvas.offsetWidth;
            const displayHeight = canvas.offsetHeight;
            newAsset.x = Math.max(0, Math.min(displayWidth - newAsset.width, newAsset.x));
            newAsset.y = Math.max(0, Math.min(displayHeight - newAsset.height, newAsset.y));
            
            return newAsset;
          }
          return asset;
        });
        onAssetsChange?.(updated);
        return updated;
      });
    }
  }, [isDragging, isResizing, selectedAssetId, dragOffset, resizeHandle, initialAssetState, onAssetsChange, assets, getResizeHandle, getCursorStyle]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setInitialAssetState(null);
    setCurrentCursor('default');
  }, []);

  // Draw canvas when assets or images change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Combine container and drop refs
  const containerDropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  // Auto-resize canvas to fit container with proper DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const displayWidth = rect.width - 32; // Account for padding
      const displayHeight = rect.height - 32; // Account for padding
      
      // Get device pixel ratio for high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Set actual canvas size (in pixels)
      canvas.width = displayWidth * devicePixelRatio;
      canvas.height = displayHeight * devicePixelRatio;
      
      // Set display size (CSS pixels)
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      // Scale the drawing context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio);
      }
      
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
        className="rounded-lg cursor-pointer"
        style={{
          display: 'block',
          backgroundColor: 'transparent',
          pointerEvents: 'none'
        }}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Invisible overlay for canvas interactions */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: 1, cursor: currentCursor }}
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
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

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDeleteAsset(contextMenu.assetId)}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            🗑️ Delete Image
          </button>
        </div>
      )}
    </div>
  );
} 