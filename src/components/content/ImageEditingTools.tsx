import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CanvasAsset } from './PosterCanvas';
import { useToast } from '../ui/toast';
import AdvancedGradientEditor from './AdvancedGradientEditor';

interface AdvancedGradientConfig {
  type: 'linear' | 'radial' | 'conic';
  colorStops: Array<{
    id: string;
    color: string;
    position: number;
  }>;
  area: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  angle: number;
  size: number;
  feather: number;
  opacity: number;
  blendMode: string;
}

interface ImageEditingToolsProps {
  selectedAsset: CanvasAsset | null;
  onAssetUpdate: (asset: CanvasAsset) => void;
  onApply: () => void;
  onCancel: () => void;
  onEffectChange: (assetId: string, effects: ImageEffects) => void;
  onAssetAction: (assetId: string, action: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface ImageEffects {
  // Transform
  opacity: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  scaleX: number;
  scaleY: number;
  
  // Color & Filter
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sepia: number;
  grayscale: number;
  invert: boolean;
  vibrance: number;
  
  // Border
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  
  // Shadow & Glow
  dropShadow: {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    enabled: boolean;
  };
  innerShadow: {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    enabled: boolean;
  };
  outerGlow: {
    blur: number;
    spread: number;
    color: string;
    enabled: boolean;
  };
  
  // Gradients
  gradient: {
    type: 'linear' | 'radial' | 'conic';
    colors: Array<{ color: string; position: number }>;
    angle: number;
    centerX: number;
    centerY: number;
    opacity: number;
    blendMode: string;
    enabled: boolean;
  };
  
  // Advanced
  mixBlendMode: string;
  backdropFilter: number;
  clipPath: string;
  advancedGradient: AdvancedGradientConfig | undefined;
}

const defaultEffects: ImageEffects = {
  opacity: 100,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  scaleX: 1,
  scaleY: 1,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: false,
  vibrance: 0,
  borderWidth: 0,
  borderColor: '#000000',
  borderRadius: 0,
  borderStyle: 'solid',
  dropShadow: {
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: '#000000',
    enabled: false,
  },
  innerShadow: {
    x: 0,
    y: 0,
    blur: 0,
    spread: 0,
    color: '#000000',
    enabled: false,
  },
  outerGlow: {
    blur: 0,
    spread: 0,
    color: '#ffffff',
    enabled: false,
  },
  gradient: {
    type: 'linear',
    colors: [
      { color: '#ff0000', position: 0 },
      { color: '#0000ff', position: 100 },
    ],
    angle: 0,
    centerX: 50,
    centerY: 50,
    opacity: 100,
    blendMode: 'normal',
    enabled: false,
  },
  mixBlendMode: 'normal',
  backdropFilter: 0,
  clipPath: 'none',
  advancedGradient: undefined,
};

export default function ImageEditingTools({
  selectedAsset,
  onAssetUpdate,
  onApply,
  onCancel,
  onEffectChange,
  onAssetAction,
  canvasRef
}: ImageEditingToolsProps) {
  const [effects, setEffects] = useState<ImageEffects>(defaultEffects);
  const [originalEffects, setOriginalEffects] = useState<ImageEffects>(defaultEffects);
  const [undoStack, setUndoStack] = useState<ImageEffects[]>([]);
  const [redoStack, setRedoStack] = useState<ImageEffects[]>([]);
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [isAdvancedGradientOpen, setIsAdvancedGradientOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { addToast } = useToast();

  // Load effects from selected asset
  useEffect(() => {
    if (selectedAsset) {
      const assetEffects = selectedAsset.effects || defaultEffects;
      setEffects(assetEffects);
      setOriginalEffects(assetEffects);
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [selectedAsset]);

  // Debounced effect update
  const updateEffects = useCallback((newEffects: ImageEffects) => {
    setEffects(newEffects);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (selectedAsset) {
        const updatedAsset = { ...selectedAsset, effects: newEffects };
        console.log('Updating asset with effects:', updatedAsset.id, newEffects);
        onAssetUpdate(updatedAsset);
      }
    }, 100); // 100ms debounce for smooth real-time updates
  }, [selectedAsset, onAssetUpdate]);

  // Add to undo stack
  const addToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev, effects]);
    setRedoStack([]);
  }, [effects]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [effects, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      updateEffects(previousState);
    }
  }, [undoStack, effects, updateEffects]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, effects]);
      setRedoStack(prev => prev.slice(1));
      updateEffects(nextState);
    }
  }, [redoStack, effects, updateEffects]);

  // Apply changes
  const handleApply = useCallback(() => {
    setOriginalEffects(effects);
    setUndoStack([]);
    setRedoStack([]);
    onApply();
    addToast('Effects applied successfully', 'success');
  }, [effects, onApply, addToast]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    updateEffects(originalEffects);
    setUndoStack([]);
    setRedoStack([]);
    onCancel();
    addToast('Changes cancelled', 'info');
  }, [originalEffects, updateEffects, onCancel, addToast]);

  // Handle advanced gradient application
  const handleAdvancedGradientApply = useCallback((config: AdvancedGradientConfig) => {
    if (!selectedAsset) return;

    const newEffects = {
      ...effects,
      advancedGradient: config
    };

    updateEffects(newEffects);
    addToast('Advanced gradient applied', 'success');
  }, [selectedAsset, effects, updateEffects, addToast]);

  // Slider component
  const Slider = ({ label, value, min, max, step = 1, unit = '', onChange, icon }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    icon?: string;
  }) => (
    <div className="flex-shrink-0 w-36 px-3 py-2 bg-gray-50 rounded-lg h-20">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
        </label>
        <span className="text-xs text-gray-500 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          addToUndoStack();
          onChange(Number(e.target.value));
        }}
        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  // Toggle button component
  const ToggleButton = ({ label, value, onChange, icon }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon?: string;
  }) => (
    <button
      onClick={() => {
        addToUndoStack();
        onChange(!value);
      }}
      className={`flex-shrink-0 w-24 h-20 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
        value
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full">
        {icon && <span className="text-xl mb-1">{icon}</span>}
        <span className="text-center leading-tight">{label}</span>
      </div>
    </button>
  );

  // Color picker component
  const ColorPicker = ({ label, value, onChange, icon }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon?: string;
  }) => (
    <div className="flex-shrink-0 w-28 px-3 py-2 bg-gray-50 rounded-lg h-20">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
        </label>
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => {
          addToUndoStack();
          onChange(e.target.value);
        }}
        className="w-full h-8 rounded border border-gray-300 cursor-pointer"
      />
    </div>
  );

  // Action button component
  const ActionButton = ({ label, onClick, icon, variant = 'default' }: {
    label: string;
    onClick: () => void;
    icon?: string;
    variant?: 'default' | 'danger' | 'success';
  }) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      danger: 'bg-red-100 text-red-700 hover:bg-red-200',
      success: 'bg-green-100 text-green-700 hover:bg-green-200',
    };

    return (
      <button
        onClick={onClick}
        className={`flex-shrink-0 w-24 h-20 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${variantClasses[variant]}`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          {icon && <span className="text-xl mb-1">{icon}</span>}
          <span className="text-center leading-tight">{label}</span>
        </div>
      </button>
    );
  };

  if (!selectedAsset) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">🎨</div>
          <p className="text-gray-500 text-sm">Select an image to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border-t border-gray-200 flex flex-col">
      {/* Header with Apply/Cancel and Undo/Redo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">Image Editor</h3>
          <div className="flex gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              ↷
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Scrollable Tools */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden tools-scroll-container p-2">
        <div className="flex items-center gap-3 h-full whitespace-nowrap">
          {/* Transform Tools */}
          <Slider
            label="Opacity"
            value={effects.opacity}
            min={0}
            max={100}
            unit="%"
            icon="🔍"
            onChange={(value) => updateEffects({ ...effects, opacity: value })}
          />
          
          <Slider
            label="Rotation"
            value={effects.rotation}
            min={-180}
            max={180}
            unit="°"
            icon="🔄"
            onChange={(value) => updateEffects({ ...effects, rotation: value })}
          />
          
          <ToggleButton
            label="Flip H"
            value={effects.flipHorizontal}
            icon="↔️"
            onChange={(value) => updateEffects({ ...effects, flipHorizontal: value })}
          />
          
          <ToggleButton
            label="Flip V"
            value={effects.flipVertical}
            icon="↕️"
            onChange={(value) => updateEffects({ ...effects, flipVertical: value })}
          />

          {/* Color & Filter Tools */}
          <Slider
            label="Brightness"
            value={effects.brightness}
            min={-100}
            max={100}
            unit="%"
            icon="☀️"
            onChange={(value) => updateEffects({ ...effects, brightness: value })}
          />
          
          <Slider
            label="Contrast"
            value={effects.contrast}
            min={-100}
            max={100}
            unit="%"
            icon="🌓"
            onChange={(value) => updateEffects({ ...effects, contrast: value })}
          />
          
          <Slider
            label="Saturation"
            value={effects.saturation}
            min={-100}
            max={100}
            unit="%"
            icon="🎨"
            onChange={(value) => updateEffects({ ...effects, saturation: value })}
          />
          
          <Slider
            label="Hue"
            value={effects.hue}
            min={0}
            max={360}
            unit="°"
            icon="🌈"
            onChange={(value) => updateEffects({ ...effects, hue: value })}
          />
          
          <Slider
            label="Blur"
            value={effects.blur}
            min={0}
            max={10}
            step={0.1}
            unit="px"
            icon="🌫️"
            onChange={(value) => updateEffects({ ...effects, blur: value })}
          />
          
          <Slider
            label="Sepia"
            value={effects.sepia}
            min={0}
            max={100}
            unit="%"
            icon="🟤"
            onChange={(value) => updateEffects({ ...effects, sepia: value })}
          />
          
          <Slider
            label="Grayscale"
            value={effects.grayscale}
            min={0}
            max={100}
            unit="%"
            icon="⚫"
            onChange={(value) => updateEffects({ ...effects, grayscale: value })}
          />
          
          <ToggleButton
            label="Invert"
            value={effects.invert}
            icon="🔄"
            onChange={(value) => updateEffects({ ...effects, invert: value })}
          />

          {/* Border Tools */}
          <Slider
            label="Border"
            value={effects.borderWidth}
            min={0}
            max={20}
            unit="px"
            icon="🔲"
            onChange={(value) => updateEffects({ ...effects, borderWidth: value })}
          />
          
          <ColorPicker
            label="Border"
            value={effects.borderColor}
            icon="🎨"
            onChange={(value) => updateEffects({ ...effects, borderColor: value })}
          />
          
          <Slider
            label="Radius"
            value={effects.borderRadius}
            min={0}
            max={50}
            unit="px"
            icon="📐"
            onChange={(value) => updateEffects({ ...effects, borderRadius: value })}
          />

          {/* Shadow Tools */}
          <ToggleButton
            label="Drop Shadow"
            value={effects.dropShadow.enabled}
            icon="🌑"
            onChange={(value) => updateEffects({ 
              ...effects, 
              dropShadow: { ...effects.dropShadow, enabled: value }
            })}
          />
          
          <ToggleButton
            label="Outer Glow"
            value={effects.outerGlow.enabled}
            icon="✨"
            onChange={(value) => updateEffects({ 
              ...effects, 
              outerGlow: { ...effects.outerGlow, enabled: value }
            })}
          />

          {/* Gradient Tools */}
          <ToggleButton
            label="Gradient"
            value={effects.gradient.enabled}
            icon="🌈"
            onChange={(value) => updateEffects({ 
              ...effects, 
              gradient: { ...effects.gradient, enabled: value }
            })}
          />
          
          <ActionButton
            label="Edit Gradient"
            onClick={() => setShowGradientEditor(true)}
            icon="🎨"
          />

          {/* Advanced Gradient Tools */}
          <ToggleButton
            label="Advanced Gradient"
            value={!!effects.advancedGradient}
            icon="🎨"
            onChange={(value) => {
              if (value) {
                setIsAdvancedGradientOpen(true);
              } else {
                setIsAdvancedGradientOpen(false);
              }
            }}
          />

          {/* Layer Tools */}
          <ActionButton
            label="To Front"
            onClick={() => {/* TODO: Implement layer management */}}
            icon="⬆️"
          />
          
          <ActionButton
            label="To Back"
            onClick={() => {/* TODO: Implement layer management */}}
            icon="⬇️"
          />
          
          <ActionButton
            label="Duplicate"
            onClick={() => {/* TODO: Implement duplication */}}
            icon="📋"
          />
        </div>
      </div>

      {/* Gradient Editor Modal */}
      {showGradientEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Gradient Editor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gradient Type
                </label>
                <select
                  value={effects.gradient.type}
                  onChange={(e) => updateEffects({
                    ...effects,
                    gradient: { ...effects.gradient, type: e.target.value as 'linear' | 'radial' | 'conic' }
                  })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                  <option value="conic">Conic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gradient Preview
                </label>
                <div
                  className="w-full h-12 rounded border border-gray-300"
                  style={{
                    background: `linear-gradient(${effects.gradient.angle}deg, ${effects.gradient.colors.map(c => `${c.color} ${c.position}%`).join(', ')})`
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {effects.gradient.opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effects.gradient.opacity}
                  onChange={(e) => updateEffects({
                    ...effects,
                    gradient: { ...effects.gradient, opacity: Number(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowGradientEditor(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Gradient Editor Modal */}
      <AdvancedGradientEditor
        isOpen={isAdvancedGradientOpen}
        onClose={() => setIsAdvancedGradientOpen(false)}
        onApply={handleAdvancedGradientApply}
        imageRef={canvasRef?.current}
        selectedAsset={selectedAsset}
        initialConfig={effects.advancedGradient}
      />
    </div>
  );
}
