'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandingTheme } from '@/types/branding';
import { DEFAULT_BRANDING_THEME } from '@/types/branding';

interface BrandingPreviewProps {
  /** Branding theme to preview */
  branding: BrandingTheme;
  /** Additional className */
  className?: string;
}

/**
 * BrandingPreview Component
 * 
 * Shows a live preview of how branding will look across the application.
 * Displays logos, colors, button styles, and navigation elements.
 */
export function BrandingPreview({ branding, className }: BrandingPreviewProps) {
  // Use provided branding or default
  const theme = useMemo(() => branding || DEFAULT_BRANDING_THEME, [branding]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-gray-600" />
          <span>Brand Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Previews */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Logos</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Primary Logo */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Primary Logo</label>
              <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200 p-4">
                {theme.primaryLogo ? (
                  <img
                    src={theme.primaryLogo}
                    alt={theme.logoAltText || 'Primary logo'}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-gray-400 text-center">
                    No primary logo
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Logo */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Secondary Logo</label>
              <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200 p-4">
                {theme.secondaryLogo ? (
                  <img
                    src={theme.secondaryLogo}
                    alt={theme.logoAltText || 'Secondary logo'}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-gray-400 text-center">
                    No secondary logo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Color Palette</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Primary Color */}
            <div className="space-y-2">
              <div
                className="h-12 w-full rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: theme.primaryColor }}
                title={`Primary: ${theme.primaryColor}`}
              />
              <div className="text-xs text-gray-600 text-center font-mono">
                {theme.primaryColor}
              </div>
              <div className="text-xs text-gray-500 text-center">Primary</div>
            </div>

            {/* Hover Color */}
            <div className="space-y-2">
              <div
                className="h-12 w-full rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: theme.primaryColorHover }}
                title={`Hover: ${theme.primaryColorHover}`}
              />
              <div className="text-xs text-gray-600 text-center font-mono">
                {theme.primaryColorHover}
              </div>
              <div className="text-xs text-gray-500 text-center">Hover</div>
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <div
                className="h-12 w-full rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: theme.accentColor }}
                title={`Accent: ${theme.accentColor}`}
              />
              <div className="text-xs text-gray-600 text-center font-mono">
                {theme.accentColor}
              </div>
              <div className="text-xs text-gray-500 text-center">Accent</div>
            </div>

            {/* Light Accent */}
            <div className="space-y-2">
              <div
                className="h-12 w-full rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: theme.accentColorLight }}
                title={`Light: ${theme.accentColorLight}`}
              />
              <div className="text-xs text-gray-600 text-center font-mono">
                {theme.accentColorLight}
              </div>
              <div className="text-xs text-gray-500 text-center">Light</div>
            </div>
          </div>
        </div>

        {/* Button Styles Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Button Styles</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              style={{
                backgroundColor: theme.primaryColor,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryColorHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.primaryColor;
              }}
            >
              Primary Button
            </Button>
            <Button
              variant="outline"
              style={{
                borderColor: theme.primaryColor,
                color: theme.primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primaryColor}1A`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Outline Button
            </Button>
            <Button
              variant="ghost"
              style={{
                color: theme.primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primaryColor}1A`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Ghost Button
            </Button>
          </div>
        </div>

        {/* Navigation Bar Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Navigation Preview</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Mock Header */}
            <div className="border-b border-gray-200 bg-white/95 p-3 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                {theme.primaryLogo ? (
                  <img
                    src={theme.primaryLogo}
                    alt={theme.logoAltText || 'Logo'}
                    className="h-8 object-contain"
                  />
                ) : (
                  <div className="h-8 w-24 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-400">
                    Logo
                  </div>
                )}
                <div className="h-6 w-px bg-gray-200" />
                {/* Nav Tabs */}
                <div className="flex items-center gap-2">
                  <div
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${theme.primaryColor}1A`,
                      color: theme.primaryColor,
                    }}
                  >
                    Overview
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-sm text-gray-600 hover:bg-gray-50">
                    Alumni
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-sm text-gray-600 hover:bg-gray-50">
                    Messages
                  </div>
                </div>
              </div>
              {/* User Icon */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: theme.primaryColor }}
              >
                U
              </div>
            </div>
          </div>
        </div>

        {/* Sample Card Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Card Preview</h3>
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Sample Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This is how content will look with your brand colors.
              </p>
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                style={{
                  backgroundColor: theme.primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primaryColorHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primaryColor;
                }}
              >
                Action Button
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

