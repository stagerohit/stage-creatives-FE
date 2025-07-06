import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../ui/toast';

interface ColorStop {
  id: string;
  color: string;
  position: number;
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
  size: number;
  feather: number;
  opacity: number;
  blendMode: string;
  previewDimensions?: { width: number; height: number };
}

interface AdvancedGradientControlsProps {
  selectedAsset: any | null;
  onApply: (config: AdvancedGradientConfig) => void;
  onDone: () => void;
  gradientArea?: GradientArea | null;
}

const defaultColorStops: ColorStop[] = [
  { id: '1', color: '#000000', position: 0 },
  { id: '2', color: 'rgba(0,0,0,0)', position: 100 }
];

const textOptimizedPresets = [
  {
    name: 'Dark',
    colorStops: [
      { id: '1', color: 'rgba(0,0,0,0.8)', position: 0 },
      { id: '2', color: 'rgba(0,0,0,0)', position: 100 }
    ]
  },
  {
    name: 'Light',
    colorStops: [
      { id: '1', color: 'rgba(255,255,255,0.8)', position: 0 },
      { id: '2', color: 'rgba(255,255,255,0)', position: 100 }
    ]
  },
  {
    name: 'Blue',
    colorStops: [
      { id: '1', color: 'rgba(0,100,200,0.7)', position: 0 },
      { id: '2', color: 'rgba(0,100,200,0)', position: 100 }
    ]
  }
];

export default function AdvancedGradientControls({
  selectedAsset,
  onApply,
  onDone,
  gradientArea
}: AdvancedGradientControlsProps) {
  const [config, setConfig] = useState<AdvancedGradientConfig>({
    type: 'linear',
    colorStops: [...defaultColorStops],
    area: null,
    angle: 0,
    size: 100,
    feather: 0,
    opacity: 100,
    blendMode: 'normal'
  });

  // Update config when gradientArea prop changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      area: gradientArea ?? null
    }));
  }, [gradientArea]);

  const [selectedColorStop, setSelectedColorStop] = useState<string | null>(null);
  const gradientBarRef = useRef<HTMLDivElement>(null);
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

  // Generate gradient preview for the current area
  const generateGradientPreview = useCallback(() => {
    if (!selectedAsset || !config.area) return null;
    
    const previewStyle = {
      background: generateGradientCSS(),
      opacity: config.opacity / 100
    };
    
    return previewStyle;
  }, [selectedAsset, config.area, generateGradientCSS, config.opacity]);

  return (
    <div className="h-full flex flex-col space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Gradient</h4>
        <button
          onClick={onDone}
          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Gradient Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <select
          value={config.type}
          onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value as any }))}
          className="w-full text-xs p-1 border border-gray-300 rounded"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
          <option value="conic">Conic</option>
        </select>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Presets</label>
        <div className="flex flex-col gap-1">
          {textOptimizedPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-left"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color Stops Editor */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Colors</label>
        <div
          ref={gradientBarRef}
          className="relative h-6 border border-gray-300 rounded cursor-pointer"
          style={{ background: generateGradientCSS() }}
          onClick={addColorStop}
        >
          {config.colorStops.map(stop => (
            <div
              key={stop.id}
              className={`absolute w-3 h-3 border-2 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
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
          Click to add, drag to move, right-click to delete
        </p>
      </div>

      {/* Selected Color Stop Editor */}
      {selectedColorStop && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
          <input
            type="color"
            value={config.colorStops.find(s => s.id === selectedColorStop)?.color || '#000000'}
            onChange={(e) => updateColorStopColor(e.target.value)}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Gradient Area Info */}
      {config.area && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Gradient Area</label>
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-300">
            <div className="flex justify-between">
              <span>Start: {config.area.startX.toFixed(1)}%, {config.area.startY.toFixed(1)}%</span>
              <span className="text-green-600">●</span>
            </div>
            <div className="flex justify-between">
              <span>End: {config.area.endX.toFixed(1)}%, {config.area.endY.toFixed(1)}%</span>
              <span className="text-red-600">●</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Angle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
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

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
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
          <label className="block text-xs font-medium text-gray-700 mb-1">
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
        <label className="block text-xs font-medium text-gray-700 mb-1">Blend Mode</label>
        <select
          value={config.blendMode}
          onChange={(e) => setConfig(prev => ({ ...prev, blendMode: e.target.value }))}
          className="w-full text-xs p-1 border border-gray-300 rounded"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="soft-light">Soft Light</option>
          <option value="hard-light">Hard Light</option>
        </select>
      </div>

      {/* Apply Button */}
      <button
        onClick={() => {
          onApply(config);
          addToast('Gradient applied', 'success');
        }}
        className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
      >
        Apply
      </button>
    </div>
  );
} 