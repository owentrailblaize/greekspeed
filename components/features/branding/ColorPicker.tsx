'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidHexColor, normalizeHexColor, generateColorShades, type ColorShades } from '@/types/branding';

interface ColorPickerProps {
  /** Current hex color value (e.g., "#FF5733") */
  value: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Optional label for the color picker */
  label?: string;
  /** Default color for reset button */
  defaultValue?: string;
  /** Additional className */
  className?: string;
}

/**
 * Preset common brand colors
 */
const PRESET_COLORS = [
  // Blues
  { name: 'Navy Blue', value: '#1E3A8A' },
  { name: 'Royal Blue', value: '#2346E0' },
  { name: 'Sky Blue', value: '#3B82F6' },
  { name: 'Ocean Blue', value: '#0066CC' },
  // Reds
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Scarlet', value: '#EF4444' },
  { name: 'Ruby Red', value: '#991B1B' },
  { name: 'Fire Red', value: '#FF5733' },
  // Greens
  { name: 'Forest Green', value: '#059669' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Mint Green', value: '#34D399' },
  { name: 'Lime Green', value: '#84CC16' },
  // Purples
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Lavender', value: '#A78BFA' },
  { name: 'Plum', value: '#9333EA' },
  // Oranges
  { name: 'Orange', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Gold', value: '#EAB308' },
  { name: 'Copper', value: '#D97706' },
  // Grays
  { name: 'Charcoal', value: '#374151' },
  { name: 'Slate', value: '#475569' },
  { name: 'Steel', value: '#64748B' },
  { name: 'Silver', value: '#94A3B8' },
] as const;

/**
 * ColorPicker Component
 * 
 * A reusable color picker component with custom popover picker,
 * hex input, preset colors, and color shades preview.
 */
export function ColorPicker({
  value,
  onChange,
  label,
  defaultValue,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shades, setShades] = useState<ColorShades | null>(null);

  // Normalize and validate current value
  const normalizedValue = value ? normalizeHexColor(value) : '';
  const isValid = normalizedValue ? isValidHexColor(normalizedValue) : false;

  // Update hex input when value changes externally
  useEffect(() => {
    setHexInput(normalizedValue);
    if (normalizedValue && isValid) {
      try {
        const generatedShades = generateColorShades(normalizedValue);
        setShades(generatedShades);
        setError(null);
      } catch (err) {
        setError('Invalid color format');
        setShades(null);
      }
    } else if (normalizedValue) {
      setError('Invalid hex color format');
      setShades(null);
    } else {
      setError(null);
      setShades(null);
    }
  }, [normalizedValue, isValid]);

  /**
   * Handle preset color selection
   */
  const handlePresetSelect = (color: string) => {
    const normalized = normalizeHexColor(color);
    setHexInput(normalized);
    onChange(normalized);
    setIsOpen(false);
  };

  /**
   * Handle hex input change
   */
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.trim();
    setHexInput(inputValue);

    // Allow empty input during typing
    if (!inputValue) {
      setError(null);
      return;
    }

    // Validate and normalize
    const normalized = normalizeHexColor(inputValue);
    
    if (isValidHexColor(normalized)) {
      setError(null);
      onChange(normalized);
    } else {
      // Show error only if user has typed a complete-looking value
      if (inputValue.length >= 3) {
        setError('Invalid hex color format');
      } else {
        setError(null);
      }
    }
  };

  /**
   * Handle hex input blur - normalize on blur
   */
  const handleHexInputBlur = () => {
    if (hexInput && isValidHexColor(hexInput)) {
      const normalized = normalizeHexColor(hexInput);
      setHexInput(normalized);
      onChange(normalized);
    } else if (hexInput && !isValidHexColor(hexInput)) {
      // Reset to current valid value if invalid
      setHexInput(normalizedValue);
      setError('Invalid hex color format');
    }
  };

  /**
   * Handle reset to default
   */
  const handleReset = () => {
    if (defaultValue) {
      const normalized = normalizeHexColor(defaultValue);
      setHexInput(normalized);
      onChange(normalized);
      setError(null);
    }
  };

  /**
   * Convert hex to RGB for display
   */
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    if (!isValidHexColor(hex)) return null;
    const hexClean = hex.replace('#', '');
    const r = parseInt(hexClean.substring(0, 2), 16);
    const g = parseInt(hexClean.substring(2, 4), 16);
    const b = parseInt(hexClean.substring(4, 6), 16);
    return { r, g, b };
  };

  const rgb = normalizedValue && isValid ? hexToRgb(normalizedValue) : null;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
      )}

      {/* Main Color Display and Input */}
      <div className="flex items-center gap-3">
        {/* Color Swatch */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative h-12 w-12 rounded-lg border-2 border-gray-300 shadow-sm',
                'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-focus focus:ring-offset-2',
                'transition-all cursor-pointer overflow-hidden',
                error && 'border-red-500'
              )}
              style={{
                backgroundColor: isValid && normalizedValue ? normalizedValue : '#E5E7EB',
              }}
              aria-label="Select color"
            >
              {isValid && normalizedValue ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {rgb && (
                    <span className="text-xs font-medium text-white drop-shadow-md">
                      {rgb.r},{rgb.g},{rgb.b}
                    </span>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-gray-400" />
                </div>
              )}
              {/* Checkerboard pattern for transparency preview */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px',
                }}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              {/* Preset Colors Grid */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                  Preset Colors
                </Label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetSelect(preset.value)}
                      className={cn(
                        'h-8 w-8 rounded border-2 transition-all',
                        'hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-focus',
                        normalizedValue === normalizeHexColor(preset.value)
                          ? 'border-gray-900 shadow-md ring-2 ring-offset-1 ring-gray-400'
                          : 'border-gray-300'
                      )}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                      aria-label={`Select ${preset.name}`}
                    >
                      {normalizedValue === normalizeHexColor(preset.value) && (
                        <Check className="h-4 w-4 text-white m-auto drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Hex Input */}
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                  Custom Color
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      #
                    </span>
                    <Input
                      type="text"
                      value={hexInput.replace('#', '').toUpperCase()}
                      onChange={handleHexInputChange}
                      onBlur={handleHexInputBlur}
                      placeholder="RRGGBB"
                      maxLength={6}
                      className={cn(
                        'pl-8 font-mono',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      )}
                    />
                  </div>
                  {/* Preview Swatch */}
                  <div
                    className={cn(
                      'h-10 w-16 rounded border-2 border-gray-300',
                      !isValid && 'opacity-50'
                    )}
                    style={{
                      backgroundColor: isValid && normalizedValue ? normalizedValue : '#E5E7EB',
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Hex Input Field (visible) */}
        <div className="flex-1">
          <Input
            type="text"
            value={normalizedValue}
            onChange={(e) => {
              const input = e.target.value;
              setHexInput(input);
              if (isValidHexColor(input)) {
                onChange(normalizeHexColor(input));
              }
            }}
            onBlur={handleHexInputBlur}
            placeholder="#RRGGBB"
            className={cn(
              'font-mono',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500'
            )}
            aria-label="Hex color input"
          />
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>

        {/* Reset Button */}
        {defaultValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-600 hover:text-gray-900"
            title={`Reset to ${normalizeHexColor(defaultValue)}`}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Color Shades Preview - Always Show */}
      {shades && isValid && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">
            Generated Shades
          </Label>
          <div className="grid grid-cols-4 gap-3">
            {/* Primary */}
            <div className="space-y-1">
              <div
                className="h-12 w-full rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: shades.primary }}
                title={`Primary: ${shades.primary}`}
              />
              <div className="text-xs text-gray-600 text-center">
                Primary
              </div>
              <div className="text-xs text-gray-500 font-mono text-center">
                {shades.primary}
              </div>
            </div>

            {/* Hover */}
            <div className="space-y-1">
              <div
                className="h-12 w-full rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: shades.hover }}
                title={`Hover: ${shades.hover}`}
              />
              <div className="text-xs text-gray-600 text-center">
                Hover
              </div>
              <div className="text-xs text-gray-500 font-mono text-center">
                {shades.hover}
              </div>
            </div>

            {/* Light */}
            <div className="space-y-1">
              <div
                className="h-12 w-full rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: shades.light }}
                title={`Light: ${shades.light}`}
              />
              <div className="text-xs text-gray-600 text-center">
                Light
              </div>
              <div className="text-xs text-gray-500 font-mono text-center">
                {shades.light}
              </div>
            </div>

            {/* Focus */}
            <div className="space-y-1">
              <div
                className="h-12 w-full rounded border border-gray-300 shadow-sm relative overflow-hidden"
                style={{ backgroundColor: shades.focus }}
                title={`Focus: ${shades.focus}`}
              >
                {/* Checkerboard pattern for opacity preview */}
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 8px 8px',
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 text-center">
                Focus
              </div>
              <div className="text-xs text-gray-500 font-mono text-center">
                {shades.focus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!shades && !error && (
        <p className="text-xs text-gray-500">
          Enter a hex color code (e.g., #FF5733) or select from presets
        </p>
      )}
    </div>
  );
}


