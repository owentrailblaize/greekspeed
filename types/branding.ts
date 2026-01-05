/**
 * Branding system types and utilities
 * 
 * Defines interfaces for chapter branding configuration and provides
 * utilities for generating color shades from base colors.
 */

/**
 * Interface matching the chapter_branding database table schema
 * Represents a chapter's branding configuration including logos and colors
 */
export interface ChapterBranding {
  id: string;
  chapter_id: string;
  primary_logo_url: string | null;
  secondary_logo_url: string | null;
  logo_alt_text: string;
  primary_color: string | null;
  accent_color: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Branding theme object used throughout the application
 * Contains all color variants and logo information needed for theming
 */
export interface BrandingTheme {
  /** Primary brand color in hex format (e.g., "#1E3A8A") */
  primaryColor: string;
  /** Darker shade of primary color for hover states (10% darker) */
  primaryColorHover: string;
  /** Accent brand color in hex format (e.g., "#3B82F6") */
  accentColor: string;
  /** Lighter shade of accent color (20% lighter) */
  accentColorLight: string;
  /** Focus ring color (30% opacity of primary) */
  focusColor: string;
  /** URL to primary logo */
  primaryLogo: string | null;
  /** URL to secondary/alternate logo */
  secondaryLogo: string | null;
  /** Alt text for logos */
  logoAltText: string;
}

/**
 * Color shade variants generated from a base color
 */
export interface ColorShades {
  /** Original base color */
  primary: string;
  /** Darker shade for hover states */
  hover: string;
  /** Lighter shade for subtle accents */
  light: string;
  /** Focus ring color with opacity */
  focus: string;
}

/**
 * Default Trailblaize branding theme
 * Used as fallback when no chapter branding is configured
 */
export const DEFAULT_BRANDING_THEME: BrandingTheme = {
  primaryColor: '#2346e0',
  primaryColorHover: '#1833b5',
  accentColor: '#4568ff',
  accentColorLight: '#7090ff',
  focusColor: '#3b82f6',
  primaryLogo: '/logo.png',
  secondaryLogo: null,
  logoAltText: 'Trailblaize',
};

/**
 * Generates color shades from a base hex color
 * 
 * Creates darker (hover), lighter (accent-light), and focus variants
 * from a single base color for consistent theming.
 * 
 * @param baseColor - Hex color string (e.g., "#1E3A8A" or "1E3A8A")
 * @returns Object containing primary, hover, light, and focus color variants
 * 
 * @example
 * ```typescript
 * const shades = generateColorShades('#1E3A8A');
 * // Returns:
 * // {
 * //   primary: '#1E3A8A',
 * //   hover: '#1A3366',
 * //   light: '#4A5AA3',
 * //   focus: '#1E3A8A4D'
 * // }
 * ```
 */
export function generateColorShades(baseColor: string): ColorShades {
  // Remove # if present and validate format
  const hex = baseColor.replace('#', '').toUpperCase();
  
  // Validate hex color format (must be 6 characters)
  if (!/^[0-9A-F]{6}$/i.test(hex)) {
    console.warn(`Invalid hex color format: ${baseColor}. Using default.`);
    return generateColorShades(DEFAULT_BRANDING_THEME.primaryColor);
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Generate hover color (10% darker)
  // Multiply by 0.9 and ensure values stay within 0-255 range
  const hoverR = Math.max(0, Math.floor(r * 0.9));
  const hoverG = Math.max(0, Math.floor(g * 0.9));
  const hoverB = Math.max(0, Math.floor(b * 0.9));
  const hover = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`.toUpperCase();
  
  // Generate light color (20% lighter)
  // Add 20% of the difference between current and 255
  const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.2));
  const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.2));
  const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.2));
  const light = `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`.toUpperCase();
  
  // Generate focus color (30% opacity of primary)
  // 4D in hex = 77 in decimal = ~30% opacity
  const focus = `${baseColor.startsWith('#') ? baseColor : '#' + baseColor}4D`;
  
  return {
    primary: baseColor.startsWith('#') ? baseColor : '#' + baseColor,
    hover,
    light,
    focus,
  };
}

/**
 * Converts a ChapterBranding database record to a BrandingTheme
 * 
 * Generates color shades from the base colors and provides
 * a complete theme object ready for use in the application.
 * 
 * @param branding - ChapterBranding record from database
 * @param defaultTheme - Optional default theme to use for missing values
 * @returns BrandingTheme object with all color variants
 * 
 * @example
 * ```typescript
 * const branding = await getChapterBranding(chapterId);
 * const theme = brandingToTheme(branding);
 * // Use theme.primaryColor, theme.primaryColorHover, etc.
 * ```
 */
export function brandingToTheme(
  branding: ChapterBranding | null,
  defaultTheme: BrandingTheme = DEFAULT_BRANDING_THEME
): BrandingTheme {
  // If no branding, return default theme
  if (!branding) {
    return defaultTheme;
  }
  
  // Generate color shades from primary color
  const primaryShades = branding.primary_color
    ? generateColorShades(branding.primary_color)
    : {
        primary: defaultTheme.primaryColor,
        hover: defaultTheme.primaryColorHover,
        light: defaultTheme.accentColorLight,
        focus: defaultTheme.focusColor,
      };
  
  // Generate color shades from accent color
  const accentShades = branding.accent_color
    ? generateColorShades(branding.accent_color)
    : {
        primary: defaultTheme.accentColor,
        hover: defaultTheme.accentColor,
        light: defaultTheme.accentColorLight,
        focus: defaultTheme.focusColor,
      };
  
  return {
    primaryColor: primaryShades.primary,
    primaryColorHover: primaryShades.hover,
    accentColor: accentShades.primary,
    accentColorLight: accentShades.light,
    focusColor: primaryShades.focus,
    primaryLogo: branding.primary_logo_url || defaultTheme.primaryLogo,
    secondaryLogo: branding.secondary_logo_url || defaultTheme.secondaryLogo,
    logoAltText: branding.logo_alt_text || defaultTheme.logoAltText,
  };
}

/**
 * Validates a hex color string
 * 
 * @param color - Color string to validate
 * @returns True if color is a valid hex color, false otherwise
 * 
 * @example
 * ```typescript
 * isValidHexColor('#1E3A8A'); // true
 * isValidHexColor('1E3A8A');  // true
 * isValidHexColor('#GGG');    // false
 * ```
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  const hex = color.replace('#', '');
  return /^[0-9A-F]{6}$/i.test(hex);
}

/**
 * Normalizes a hex color string to include the # prefix
 * 
 * @param color - Color string to normalize
 * @returns Normalized color string with # prefix
 * 
 * @example
 * ```typescript
 * normalizeHexColor('1E3A8A'); // '#1E3A8A'
 * normalizeHexColor('#1E3A8A'); // '#1E3A8A'
 * ```
 */
export function normalizeHexColor(color: string): string {
  if (!color) return '';
  return color.startsWith('#') ? color.toUpperCase() : '#' + color.toUpperCase();
}

