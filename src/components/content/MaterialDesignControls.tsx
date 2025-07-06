import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../ui/toast';

interface ControlItem {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  special?: boolean;
  danger?: boolean;
}

interface MaterialDesignControlsProps {
  selectedAsset: any | null;
  onAssetUpdate: (asset: any) => void;
  onEffectChange: (assetId: string, effects: any) => void;
  onAssetAction: (assetId: string, action: string) => void;
  onGradientToggle: () => void;
  isGradientActive: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function MaterialDesignControls({
  selectedAsset,
  onAssetUpdate,
  onEffectChange,
  onAssetAction,
  onGradientToggle,
  isGradientActive,
  canvasRef,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: MaterialDesignControlsProps) {
  const { addToast } = useToast();
  const [openSlider, setOpenSlider] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Click outside to close slider
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        setOpenSlider(null);
      }
    };

    if (openSlider) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openSlider]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo?.();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        onRedo?.();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onUndo, onRedo]);

  // Helper to apply effect changes
  const applyEffect = useCallback((effectName: string, value: any) => {
    if (!selectedAsset) {
      addToast('Please select an image first', 'error');
      return;
    }

    const currentEffects = selectedAsset.effects || {};
    const newEffects = { ...currentEffects, [effectName]: value };
    const updatedAsset = { ...selectedAsset, effects: newEffects };
    
    onAssetUpdate(updatedAsset);
  }, [selectedAsset, onAssetUpdate, addToast]);

  // Toggle slider
  const toggleSlider = useCallback((sliderId: string) => {
    if (!selectedAsset) {
      addToast('Please select an image first', 'error');
      return;
    }
    setOpenSlider(openSlider === sliderId ? null : sliderId);
  }, [openSlider, selectedAsset, addToast]);

  // Handle gradient toggle
  const handleGradientClick = useCallback(() => {
    if (!selectedAsset) {
      addToast('Please select an image first', 'error');
      return;
    }
    
    onGradientToggle();
  }, [selectedAsset, onGradientToggle, addToast]);

  // Control rows for 2-row layout
  const row1Controls = [
    // Transform & Color
    { id: 'opacity', icon: 'opacity', label: 'Opacity', hasSlider: true, min: 0, max: 100, step: 1, unit: '%', 
      value: selectedAsset?.effects?.opacity || 100, active: selectedAsset?.effects?.opacity !== undefined, special: false, danger: false, disabled: false },
    { id: 'rotation', icon: 'rotate_right', label: 'Rotate', hasSlider: true, min: 0, max: 360, step: 15, unit: '°',
      value: selectedAsset?.effects?.rotation || 0, active: selectedAsset?.effects?.rotation !== undefined && selectedAsset?.effects?.rotation !== 0, special: false, danger: false, disabled: false },
    { id: 'flipH', icon: 'flip', label: 'Flip H', hasSlider: false, active: selectedAsset?.effects?.flipHorizontal, special: false, danger: false, disabled: false },
    { id: 'flipV', icon: 'flip', label: 'Flip V', hasSlider: false, active: selectedAsset?.effects?.flipVertical, special: false, danger: false, disabled: false },
    { id: 'brightness', icon: 'brightness_6', label: 'Brightness', hasSlider: true, min: -100, max: 100, step: 5, unit: '%',
      value: selectedAsset?.effects?.brightness || 0, active: selectedAsset?.effects?.brightness !== undefined && selectedAsset?.effects?.brightness !== 0, special: false, danger: false, disabled: false },
    { id: 'contrast', icon: 'contrast', label: 'Contrast', hasSlider: true, min: -100, max: 100, step: 5, unit: '%',
      value: selectedAsset?.effects?.contrast || 0, active: selectedAsset?.effects?.contrast !== undefined && selectedAsset?.effects?.contrast !== 0, special: false, danger: false, disabled: false },
    { id: 'saturation', icon: 'palette', label: 'Saturation', hasSlider: true, min: -100, max: 100, step: 5, unit: '%',
      value: selectedAsset?.effects?.saturation || 0, active: selectedAsset?.effects?.saturation !== undefined && selectedAsset?.effects?.saturation !== 0, special: false, danger: false, disabled: false },
    { id: 'hue', icon: 'tune', label: 'Hue', hasSlider: true, min: 0, max: 360, step: 10, unit: '°',
      value: selectedAsset?.effects?.hue || 0, active: selectedAsset?.effects?.hue !== undefined && selectedAsset?.effects?.hue !== 0, special: false, danger: false, disabled: false },
    { id: 'blur', icon: 'blur_on', label: 'Blur', hasSlider: true, min: 0, max: 20, step: 1, unit: 'px',
      value: selectedAsset?.effects?.blur || 0, active: selectedAsset?.effects?.blur !== undefined && selectedAsset?.effects?.blur > 0, special: false, danger: false, disabled: false }
  ];

  const row2Controls = [
    // Filters & Effects
    { id: 'sepia', icon: 'filter_vintage', label: 'Sepia', hasSlider: true, min: 0, max: 100, step: 5, unit: '%',
      value: selectedAsset?.effects?.sepia || 0, active: selectedAsset?.effects?.sepia !== undefined && selectedAsset?.effects?.sepia > 0, special: false, danger: false, disabled: false },
    { id: 'grayscale', icon: 'filter_b_and_w', label: 'Grayscale', hasSlider: true, min: 0, max: 100, step: 5, unit: '%',
      value: selectedAsset?.effects?.grayscale || 0, active: selectedAsset?.effects?.grayscale !== undefined && selectedAsset?.effects?.grayscale > 0, special: false, danger: false, disabled: false },
    { id: 'invert', icon: 'invert_colors', label: 'Invert', hasSlider: false, active: selectedAsset?.effects?.invert, special: false, danger: false, disabled: false },
    { id: 'borderWidth', icon: 'border_style', label: 'Border', hasSlider: true, min: 0, max: 20, step: 1, unit: 'px',
      value: selectedAsset?.effects?.borderWidth || 0, active: selectedAsset?.effects?.borderWidth !== undefined && selectedAsset?.effects?.borderWidth > 0, special: false, danger: false, disabled: false },
    { id: 'borderRadius', icon: 'rounded_corner', label: 'Radius', hasSlider: true, min: 0, max: 50, step: 1, unit: 'px',
      value: selectedAsset?.effects?.borderRadius || 0, active: selectedAsset?.effects?.borderRadius !== undefined && selectedAsset?.effects?.borderRadius > 0, special: false, danger: false, disabled: false },
    { id: 'shadow', icon: 'shadow', label: 'Shadow', hasSlider: false, active: selectedAsset?.effects?.dropShadow?.enabled, special: false, danger: false, disabled: false },
    { id: 'glow', icon: 'auto_awesome', label: 'Glow', hasSlider: false, active: selectedAsset?.effects?.outerGlow?.enabled, special: false, danger: false, disabled: false },
    { id: 'gradient', icon: 'gradient', label: 'Gradient', hasSlider: false, special: true,
      active: isGradientActive || selectedAsset?.effects?.advancedGradient, 
      disabled: false, danger: false },
    { id: 'duplicate', icon: 'content_copy', label: 'Duplicate', hasSlider: false, active: false, special: false, danger: false, disabled: false },
    { id: 'delete', icon: 'delete', label: 'Delete', hasSlider: false, active: false, danger: true, special: false, disabled: false }
  ];

  // Handle control clicks
  const handleControlClick = (controlId: string, control: any) => {
    if (!selectedAsset) return;

    if (control.hasSlider) {
      toggleSlider(controlId);
    } else {
      // Handle non-slider controls
      switch (controlId) {
        case 'flipH':
          applyEffect('flipHorizontal', !selectedAsset?.effects?.flipHorizontal);
          break;
        case 'flipV':
          applyEffect('flipVertical', !selectedAsset?.effects?.flipVertical);
          break;
        case 'invert':
          applyEffect('invert', !selectedAsset?.effects?.invert);
          break;
        case 'shadow':
          applyEffect('dropShadow', { 
            ...selectedAsset?.effects?.dropShadow,
            enabled: !selectedAsset?.effects?.dropShadow?.enabled,
            x: 2, y: 2, blur: 4, color: '#000000'
          });
          break;
        case 'glow':
          applyEffect('outerGlow', {
            ...selectedAsset?.effects?.outerGlow,
            enabled: !selectedAsset?.effects?.outerGlow?.enabled,
            blur: 10, color: '#ffffff'
          });
          break;
        case 'gradient':
          handleGradientClick();
          break;
        case 'duplicate':
          onAssetAction(selectedAsset?.id || '', 'duplicate');
          break;
        case 'delete':
          onAssetAction(selectedAsset?.id || '', 'delete');
          break;
      }
    }
  };

  // Handle slider changes
  const handleSliderChange = (controlId: string, value: number) => {
    if (!selectedAsset) return;
    
    const effectName = controlId === 'flipH' ? 'flipHorizontal' : 
                      controlId === 'flipV' ? 'flipVertical' : controlId;
    applyEffect(effectName, value);
  };

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="material-icons text-gray-400 text-2xl">image</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">Select an image to edit</p>
          <p className="text-gray-400 text-xs mt-1">Choose an image from the canvas to start editing</p>
        </div>
      </div>
    );
  }

      return (
    <div className="h-full bg-white rounded-lg overflow-hidden" ref={sliderRef}>
      {/* Controls Container - Full Height */}
      <div className="h-full p-4">
        {/* Control Rows - Equal Height Distribution */}
        <div className="h-full flex flex-col justify-center space-y-6">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-2 justify-center">
              {row1Controls.map((control) => (
                <div key={control.id} className="relative">
                  <button
                    onClick={() => handleControlClick(control.id, control)}
                    disabled={!selectedAsset || control.disabled}
                    className={`
                      group relative flex flex-col items-center justify-center
                      w-16 h-16 rounded-xl transition-all duration-200 border-2
                      ${control.active 
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700 shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                      }
                      ${openSlider === control.id ? 'ring-2 ring-green-400 ring-offset-2 bg-green-50 border-green-300' : ''}
                      ${control.special ? 'ring-2 ring-purple-300 ring-offset-1' : ''}
                      ${control.danger ? 'text-red-500 hover:bg-red-50 hover:border-red-200' : ''}
                      ${control.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                    `}
                  >
                    <span className="material-icons text-lg mb-1">
                      {control.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">{control.label}</span>
                    
                    {/* Active indicator */}
                    {control.active && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                    )}
                  </button>
                  
                  {/* Enhanced Slider */}
                  {control.hasSlider && openSlider === control.id && (
                    <div className="absolute left-full top-0 ml-3 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-20 w-56">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-800">{control.label}</span>
                          <div className="px-2 py-1 bg-gray-100 rounded-md">
                            <span className="text-sm font-mono text-gray-700">
                              {control.value}{control.unit}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={control.value}
                            onChange={(e) => handleSliderChange(control.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                              [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500
                              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{control.min}{control.unit}</span>
                            <span>{control.max}{control.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-2 justify-center">
              {row2Controls.map((control) => (
                <div key={control.id} className="relative">
                  <button
                    onClick={() => handleControlClick(control.id, control)}
                    disabled={!selectedAsset || control.disabled}
                    className={`
                      group relative flex flex-col items-center justify-center
                      w-16 h-16 rounded-xl transition-all duration-200 border-2
                      ${control.active 
                        ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-700 shadow-md' 
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                      }
                      ${openSlider === control.id ? 'ring-2 ring-green-400 ring-offset-2 bg-green-50 border-green-300' : ''}
                      ${control.special ? 'ring-2 ring-purple-300 ring-offset-1 bg-gradient-to-br from-purple-50 to-pink-50' : ''}
                      ${control.danger ? 'text-red-500 hover:bg-red-50 hover:border-red-200' : ''}
                      ${control.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                    `}
                  >
                    <span className="material-icons text-lg mb-1">
                      {control.icon}
                    </span>
                    <span className="text-[10px] font-medium leading-tight">{control.label}</span>
                    
                    {/* Active indicator */}
                    {control.active && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                    )}
                    
                    {/* Special gradient indicator */}
                    {control.special && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white"></div>
                    )}
                  </button>
                  
                  {/* Enhanced Slider */}
                  {control.hasSlider && openSlider === control.id && (
                    <div className="absolute left-full top-0 ml-3 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-20 w-56">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-800">{control.label}</span>
                          <div className="px-2 py-1 bg-gray-100 rounded-md">
                            <span className="text-sm font-mono text-gray-700">
                              {control.value}{control.unit}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="range"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={control.value}
                            onChange={(e) => handleSliderChange(control.id, parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                              [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
                              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{control.min}{control.unit}</span>
                            <span>{control.max}{control.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
} 