import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../ui/toast';

interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface GradientArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface AdvancedGradientConfig {
  type: 'linear' | 'radial' | 'conic';
  colorStops: ColorStop[];
  area: GradientArea | null;
  angle: number;
  size: number; // 0-200% for spread
  feather: number; // 0-100 for edge blur
  opacity: number; // 0-100
  blendMode: string;
  previewDimensions?: { width: number; height: number }; // Store actual preview dimensions
}

interface AdvancedGradientEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: AdvancedGradientConfig) => void;
  imageRef: HTMLCanvasElement | null;
  selectedAsset: any | null; // Add selected asset to get image source
  initialConfig?: AdvancedGradientConfig;
}

const defaultColorStops: ColorStop[] = [
  { id: '1', color: '#000000', position: 0 },
  { id: '2', color: 'rgba(0,0,0,0)', position: 100 }
];

const textOptimizedPresets = [
  {
    name: 'Dark Overlay',
    colorStops: [
      { id: '1', color: 'rgba(0,0,0,0.8)', position: 0 },
      { id: '2', color: 'rgba(0,0,0,0)', position: 100 }
    ]
  },
  {
    name: 'Light Overlay',
    colorStops: [
      { id: '1', color: 'rgba(255,255,255,0.8)', position: 0 },
      { id: '2', color: 'rgba(255,255,255,0)', position: 100 }
    ]
  },
  {
    name: 'Blue Gradient',
    colorStops: [
      { id: '1', color: 'rgba(0,100,200,0.7)', position: 0 },
      { id: '2', color: 'rgba(0,100,200,0)', position: 100 }
    ]
  }
];

export default function AdvancedGradientEditor({
  isOpen,
  onClose,
  onApply,
  imageRef,
  selectedAsset,
  initialConfig
}: AdvancedGradientEditorProps) {
  const [config, setConfig] = useState<AdvancedGradientConfig>({
    type: 'linear',
    colorStops: initialConfig?.colorStops || [...defaultColorStops],
    area: initialConfig?.area || null,
    angle: initialConfig?.angle || 0,
    size: initialConfig?.size || 100,
    feather: initialConfig?.feather || 0,
    opacity: initialConfig?.opacity || 100,
    blendMode: initialConfig?.blendMode || 'normal'
  });

  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const [selectedColorStop, setSelectedColorStop] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const gradientBarRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Generate CSS gradient string for preview
  const generateGradientCSS = useCallback(() => {
    const sortedStops = [...config.colorStops].sort((a, b) => a.position - b.position);
    const colorString = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    
    switch (config.type) {
      case 'linear':
        return `linear-gradient(${config.angle}deg, ${colorString})`;
      case 'radial':
        return `radial-gradient(circle, ${colorString})`;
      case 'conic':
        return `conic-gradient(from ${config.angle}deg, ${colorString})`;
      default:
        return `linear-gradient(${config.angle}deg, ${colorString})`;
    }
  }, [config]);

  // Handle color stop drag on gradient bar
  const handleColorStopDrag = useCallback((e: React.MouseEvent, stopId: string) => {
    if (!gradientBarRef.current) return;
    
    const rect = gradientBarRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    
    setConfig(prev => ({
      ...prev,
      colorStops: prev.colorStops.map(stop =>
        stop.id === stopId ? { ...stop, position } : stop
      )
    }));
  }, []);

  // Add new color stop
  const addColorStop = useCallback((e: React.MouseEvent) => {
    if (!gradientBarRef.current) return;
    
    const rect = gradientBarRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    
    const newStop: ColorStop = {
      id: Date.now().toString(),
      color: '#808080',
      position: Math.max(0, Math.min(100, position))
    };
    
    setConfig(prev => ({
      ...prev,
      colorStops: [...prev.colorStops, newStop]
    }));
    
    setSelectedColorStop(newStop.id);
  }, []);

  // Delete color stop
  const deleteColorStop = useCallback((stopId: string) => {
    if (config.colorStops.length <= 2) {
      addToast('Gradient must have at least 2 color stops', 'error');
      return;
    }
    
    setConfig(prev => ({
      ...prev,
      colorStops: prev.colorStops.filter(stop => stop.id !== stopId)
    }));
    
    if (selectedColorStop === stopId) {
      setSelectedColorStop(null);
    }
  }, [config.colorStops.length, selectedColorStop, addToast]);

  // Handle canvas area selection
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasOverlayRef.current) return;
    
    const rect = canvasOverlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStart({ x, y });
    setIsDraggingArea(true);
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingArea || !dragStart || !canvasOverlayRef.current) return;
    
    const rect = canvasOverlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setConfig(prev => ({
      ...prev,
      area: {
        startX: dragStart.x,
        startY: dragStart.y,
        endX: x,
        endY: y
      }
    }));
  }, [isDraggingArea, dragStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDraggingArea(false);
    setDragStart(null);
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: typeof textOptimizedPresets[0]) => {
    setConfig(prev => ({
      ...prev,
      colorStops: preset.colorStops.map(stop => ({ ...stop, id: Date.now().toString() + Math.random() }))
    }));
  }, []);

  // Update selected color stop color
  const updateColorStopColor = useCallback((color: string) => {
    if (!selectedColorStop) return;
    
    setConfig(prev => ({
      ...prev,
      colorStops: prev.colorStops.map(stop =>
        stop.id === selectedColorStop ? { ...stop, color } : stop
      )
    }));
  }, [selectedColorStop]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Advanced Gradient Editor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Canvas Preview */}
          <div className="space-y-4">
            <h4 className="font-medium">Canvas Preview</h4>
            <div className="relative border border-gray-300 rounded-lg overflow-hidden">
              {selectedAsset ? (
                <div
                  ref={canvasOverlayRef}
                  className="relative cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  style={{ width: '100%', paddingBottom: '60%' }}
                >
                  {/* Display the actual selected image */}
                  <img
                    src={selectedAsset.src}
                    alt="Selected asset"
                    className="absolute inset-0 w-full h-full object-contain bg-gray-100"
                  />
                  
                  {/* Gradient preview overlay */}
                  {config.area && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${Math.min(config.area.startX, config.area.endX)}px`,
                        top: `${Math.min(config.area.startY, config.area.endY)}px`,
                        width: `${Math.abs(config.area.endX - config.area.startX)}px`,
                        height: `${Math.abs(config.area.endY - config.area.startY)}px`,
                        background: generateGradientCSS(),
                        opacity: config.opacity / 100,
                        border: '2px dashed #3b82f6'
                      }}
                    />
                  )}
                  
                  {/* Instruction overlay */}
                  {!config.area && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <span className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                        Click and drag to define gradient area
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" style={{ width: '100%', paddingBottom: '60%' }}>
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500">No image selected</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Text Overlay Presets */}
            <div>
              <h5 className="font-medium mb-2">Text Overlay Presets</h5>
              <div className="flex gap-2">
                {textOptimizedPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Controls */}
          <div className="space-y-4">
            {/* Gradient Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Gradient Type</label>
              <select
                value={config.type}
                onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
                <option value="conic">Conic</option>
              </select>
            </div>

            {/* Color Stops Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">Color Stops</label>
              <div
                ref={gradientBarRef}
                className="relative h-8 border border-gray-300 rounded cursor-pointer"
                style={{ background: generateGradientCSS() }}
                onClick={addColorStop}
              >
                {config.colorStops.map(stop => (
                  <div
                    key={stop.id}
                    className={`absolute w-4 h-4 border-2 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                      selectedColorStop === stop.id ? 'border-blue-500' : 'border-white'
                    }`}
                    style={{
                      left: `${stop.position}%`,
                      top: '50%',
                      backgroundColor: stop.color
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColorStop(stop.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      deleteColorStop(stop.id);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        handleColorStopDrag(moveEvent as any, stop.id);
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click to add stops, drag to reposition, right-click to delete
              </p>
            </div>

            {/* Selected Color Stop Editor */}
            {selectedColorStop && (
              <div>
                <label className="block text-sm font-medium mb-2">Selected Color</label>
                <input
                  type="color"
                  value={config.colorStops.find(s => s.id === selectedColorStop)?.color || '#000000'}
                  onChange={(e) => updateColorStopColor(e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Advanced Controls */}
            <div className="grid grid-cols-2 gap-4">
              {/* Angle */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Angle: {config.angle}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={config.angle}
                  onChange={(e) => setConfig(prev => ({ ...prev, angle: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Size/Spread */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Size: {config.size}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={config.size}
                  onChange={(e) => setConfig(prev => ({ ...prev, size: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Feather */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Feather: {config.feather}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.feather}
                  onChange={(e) => setConfig(prev => ({ ...prev, feather: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Opacity: {config.opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.opacity}
                  onChange={(e) => setConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Blend Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Blend Mode</label>
              <select
                value={config.blendMode}
                onChange={(e) => setConfig(prev => ({ ...prev, blendMode: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="soft-light">Soft Light</option>
                <option value="hard-light">Hard Light</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add preview dimensions to config before applying
                  const previewRect = canvasOverlayRef.current?.getBoundingClientRect();
                  const configWithDimensions = {
                    ...config,
                    previewDimensions: previewRect ? {
                      width: previewRect.width,
                      height: previewRect.height
                    } : { width: 400, height: 240 }
                  };
                  onApply(configWithDimensions);
                  onClose();
                  addToast('Advanced gradient applied', 'success');
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply Gradient
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 