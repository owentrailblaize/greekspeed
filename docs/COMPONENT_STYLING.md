# Component Styling & Structure Guide

## Overview
This guide documents the styling patterns, component structure, and reusable patterns used throughout the Trailblaize codebase. Follow these patterns to maintain consistency and enable AI agents to reuse existing components and logic.

## Styling System

### Tailwind CSS Configuration
- **Config File**: `tailwind.config.js`
- **Global Styles**: `styles/globals.css`
- **Utility Function**: `lib/utils.ts` → `cn()` function for className merging

### Color System

#### Brand Colors (CSS Variables)
Use CSS variables for dynamic theming (chapter-specific branding):

```typescript
// ✅ Good - Uses CSS variables
className="bg-brand-primary text-white hover:bg-brand-primary-hover"

// Available brand variables:
// - bg-brand-primary
// - bg-brand-primary-hover
// - bg-brand-accent
// - bg-brand-accent-hover
// - bg-brand-accent-light
// - text-brand-text
// - bg-brand-background
// - bg-brand-secondary
```

#### Semantic Color Palette
```typescript
// Text colors
text-gray-900    // Primary text
text-gray-700    // Secondary text
text-gray-500    // Tertiary/muted text
text-gray-400    // Disabled text

// Background colors
bg-white         // Primary background
bg-gray-50       // Subtle background
bg-gray-100      // Light background
bg-slate-50      // Alternative light background

// Border colors
border-gray-200  // Default borders
border-slate-200 // Alternative borders
border-gray-300  // Stronger borders

// Accent colors (blue palette)
bg-accent-50     // Light blue background
bg-accent-100    // Lighter blue
text-accent-500  // Blue text
text-accent-700  // Darker blue text

// Status colors
bg-rose-50       // Light red (likes, errors)
text-rose-500    // Red text
bg-green-50      // Success backgrounds
text-green-600   // Success text
```

### Typography

#### Font Families
```typescript
// Default: Inter (system font stack)
font-family: Inter, ui-sans-serif, system-ui, sans-serif

// Serif: Instrument Serif (for special cases)
className="instrument-serif-regular"
className="instrument-serif-regular-italic"
```

#### Font Sizes
```typescript
// Mobile-first approach
text-xs    // 0.75rem - Small labels, timestamps
text-sm    // 0.875rem - Body text, buttons
text-base  // 1rem - Default body text
text-lg    // 1.125rem - Headings
text-xl    // 1.25rem - Large headings
text-2xl   // 1.5rem - Page titles

// Responsive sizing
text-sm sm:text-base  // Smaller on mobile, base on desktop
```

#### Font Weights
```typescript
font-normal    // 400 - Body text
font-medium    // 500 - Emphasis
font-semibold  // 600 - Headings
font-bold      // 700 - Strong emphasis
```

### Spacing System

#### Padding & Margins
```typescript
// Common spacing patterns
p-2    // 0.5rem - Tight spacing
p-3    // 0.75rem - Standard spacing
p-4    // 1rem - Comfortable spacing
p-6    // 1.5rem - Generous spacing

// Gap (for flex/grid)
gap-2   // 0.5rem
gap-3   // 0.75rem
gap-4   // 1rem
gap-6   // 1.5rem

// Margin
mt-2, mb-2, mx-2, my-2  // Consistent spacing
```

### Border Radius
```typescript
rounded      // 0.25rem - Small radius
rounded-md   // 0.375rem - Medium radius
rounded-lg   // 0.5rem - Large radius
rounded-xl   // 0.75rem - Extra large
rounded-2xl  // 1rem - Cards, modals
rounded-3xl  // 1.5rem - Large cards
rounded-full // Full circle (avatars, pills)
```

### Shadows
```typescript
shadow-sm    // Subtle shadow
shadow       // Default shadow
shadow-md    // Medium shadow
shadow-lg    // Large shadow (modals, cards)
shadow-xl    // Extra large shadow
```

## Component Structure Patterns

### Basic Component Template
```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from '@/types/component';

interface ComponentNameProps {
  // Props here
  className?: string;
}

export function ComponentName({ 
  className,
  ...props 
}: ComponentNameProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className={cn('base-classes', className)}>
      {/* Component content */}
    </div>
  );
}
```

### Component with Variants (using CVA)
```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva(
  'base-classes', // Base classes always applied
  {
    variants: {
      variant: {
        default: 'default-classes',
        primary: 'primary-classes',
        secondary: 'secondary-classes',
      },
      size: {
        sm: 'small-classes',
        md: 'medium-classes',
        lg: 'large-classes',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  className?: string;
}

export function Component({ variant, size, className }: ComponentProps) {
  return (
    <div className={cn(componentVariants({ variant, size }), className)}>
      {/* Content */}
    </div>
  );
}
```

### Card Component Pattern
```typescript
// Standard card structure
<div className="rounded-xl border border-gray-200 bg-white shadow">
  {/* Card header */}
  <div className="p-4 border-b border-gray-100">
    <h3 className="font-semibold text-gray-900">Title</h3>
  </div>
  
  {/* Card content */}
  <div className="p-4">
    {/* Content */}
  </div>
  
  {/* Card footer (optional) */}
  <div className="p-4 border-t border-gray-100">
    {/* Footer content */}
  </div>
</div>
```

### Button Patterns
```typescript
// Use Button component from @/components/ui/button
import { Button } from '@/components/ui/button';

// Primary button
<Button variant="default" size="sm">
  Click me
</Button>

// Ghost button (minimal styling)
<Button variant="ghost" size="sm">
  Cancel
</Button>

// Outline button
<Button variant="outline" size="sm">
  Secondary Action
</Button>

// Custom styled button (when needed)
<Button
  className={cn(
    'rounded-full px-4',
    isActive && 'bg-rose-50 text-rose-500',
    !isActive && 'bg-white text-gray-500 hover:bg-rose-50'
  )}
>
  Like
</Button>
```

### Form Input Patterns
```typescript
// Standard input
<input
  type="text"
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
/>

// Textarea
<textarea
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
  rows={4}
/>

// Using shadcn/ui components (preferred)
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

<Input placeholder="Enter text" />
<Textarea placeholder="Enter text" />
```

### Modal/Dialog Patterns
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div className="p-6">
      {/* Modal content */}
    </div>
  </DialogContent>
</Dialog>
```

### Loading States
```typescript
// Loading spinner
<div className="flex items-center justify-center p-8">
  <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
</div>

// Skeleton loader
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

### Empty States
```typescript
<div className="flex flex-col items-center justify-center p-12 text-center">
  <Icon className="h-12 w-12 text-gray-400 mb-4" />
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No items found
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    Get started by creating your first item.
  </p>
  <Button>Create Item</Button>
</div>
```

### Error States
```typescript
<div className="rounded-lg border border-red-200 bg-red-50 p-4">
  <div className="flex items-center gap-2">
    <AlertCircle className="h-5 w-5 text-red-600" />
    <p className="text-sm font-medium text-red-800">
      {errorMessage}
    </p>
  </div>
</div>
```

## Responsive Design Patterns

### Mobile-First Approach
```typescript
// Always design mobile first, then add desktop styles
<div className="
  p-4           // Mobile padding
  sm:p-6        // Desktop padding
  text-sm       // Mobile text
  sm:text-base  // Desktop text
">
```

### Common Breakpoints
```typescript
// Tailwind breakpoints
sm:  640px   // Small tablets
md:  768px   // Tablets
lg:  1024px  // Small laptops
xl:  1280px  // Desktops
2xl: 1536px  // Large desktops

// Usage
className="
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
"
```

### Mobile-Specific Patterns
```typescript
// Hide on mobile, show on desktop
className="hidden sm:block"

// Show on mobile, hide on desktop
className="block sm:hidden"

// Different layouts
className="
  flex-col        // Mobile: vertical
  sm:flex-row     // Desktop: horizontal
"
```

## Reusable Component Patterns

### Avatar Component
```typescript
// Use ClickableAvatar from @/components/features/user-profile/ClickableAvatar
import { ClickableAvatar } from '@/components/features/user-profile/ClickableAvatar';

<ClickableAvatar
  userId={user.id}
  avatarUrl={user.avatar_url}
  fullName={user.full_name}
  firstName={user.first_name}
  lastName={user.last_name}
  size="sm" // "sm" | "md" | "lg"
  className="w-10 h-10"
/>
```

### User Name Component
```typescript
// Use ClickableUserName from @/components/features/user-profile/ClickableUserName
import { ClickableUserName } from '@/components/features/user-profile/ClickableUserName';

<ClickableUserName
  userId={user.id}
  fullName={user.full_name}
  className="font-semibold text-gray-900"
/>
```

### Link Preview Card
```typescript
// Use LinkPreviewCard from @/components/features/social/LinkPreviewCard
import { LinkPreviewCard } from '@/components/features/social/LinkPreviewCard';

{linkPreviews.map((preview) => (
  <LinkPreviewCard
    key={preview.url}
    preview={preview}
    className="max-w-full"
    hideImage={false} // Set to true to hide image (compact mode)
  />
))}
```

### Image Grid Pattern
```typescript
// Single image
<div className="relative w-full overflow-hidden rounded-2xl aspect-[4/3]">
  <Image
    src={imageUrl}
    alt="Description"
    fill
    className="object-cover"
    sizes="(max-width: 640px) 100vw, 700px"
  />
</div>

// Multiple images (horizontal scroll)
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
  {images.map((url, index) => (
    <div
      key={index}
      className="relative shrink-0 w-32 h-32 rounded-xl overflow-hidden"
    >
      <Image
        src={url}
        alt={`Image ${index + 1}`}
        fill
        className="object-cover"
        sizes="128px"
      />
    </div>
  ))}
</div>
```

## Utility Classes

### Text Utilities
```typescript
// Text truncation
line-clamp-2  // Clamp to 2 lines
line-clamp-3  // Clamp to 3 lines
truncate      // Single line truncation

// Text alignment
text-left
text-center
text-right

// Text decoration
underline
no-underline
```

### Layout Utilities
```typescript
// Flexbox
flex
flex-col
flex-row
items-center
justify-between
gap-4

// Grid
grid
grid-cols-1
grid-cols-2
grid-cols-3
gap-4

// Spacing
space-y-4     // Vertical spacing between children
space-x-4     // Horizontal spacing between children
```

### Scrollbar Utilities
```typescript
// Custom scrollbar (defined in globals.css)
scrollbar-thin              // Thin scrollbar
scrollbar-hide              // Hide scrollbar
scrollbar-thumb-slate-300   // Thumb color
scrollbar-track-transparent // Track color
```

## Common Class Combinations

### Card Container
```typescript
className="rounded-xl border border-gray-200 bg-white shadow p-4"
```

### Button (Primary)
```typescript
className="rounded-full bg-brand-primary text-white px-4 py-2 hover:bg-brand-primary-hover transition-colors"
```

### Button (Ghost)
```typescript
className="rounded-full bg-white text-gray-500 px-4 py-2 hover:bg-gray-100 transition-colors"
```

### Input Field
```typescript
className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:outline-none"
```

### Modal Container
```typescript
className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
```

### Modal Content
```typescript
className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4"
```

## Component Organization

### File Structure
```
components/
├── ui/                    # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── input.tsx
├── features/              # Feature-specific components
│   ├── social/
│   │   ├── PostCard.tsx
│   │   ├── CommentModal.tsx
│   │   └── LinkPreviewCard.tsx
│   └── alumni/
│       └── AlumniCard.tsx
└── shared/               # Shared components
    └── LoadingSpinner.tsx
```

### Import Order
```typescript
// 1. React/Next.js
import { useState } from 'react';
import Image from 'next/image';

// 2. Third-party
import { format } from 'date-fns';
import { Heart } from 'lucide-react';

// 3. Internal (absolute paths)
import { Button } from '@/components/ui/button';
import { usePosts } from '@/lib/hooks/usePosts';

// 4. Types
import type { Post } from '@/types/posts';

// 5. Relative imports
import './styles.css';
```

## Best Practices

### ✅ DO
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Maintain consistent spacing (p-4, gap-4, etc.)
- Use brand CSS variables for theming
- Reuse existing UI components
- Add proper TypeScript types
- Handle loading and error states

### ❌ DON'T
- Don't use inline styles (`style={{}}`)
- Don't hardcode colors (use Tailwind classes or CSS variables)
- Don't create duplicate components (check `components/ui/` first)
- Don't mix spacing systems (stick to Tailwind scale)
- Don't forget mobile responsiveness
- Don't ignore accessibility (keyboard navigation, ARIA labels)
- Don't use arbitrary values unless necessary (`w-[123px]`)

## Examples

### Complete Component Example
```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import type { Post } from '@/types/posts';

interface LikeButtonProps {
  post: Post;
  onLike: (postId: string) => void;
  className?: string;
}

export function LikeButton({ post, onLike, className }: LikeButtonProps) {
  const [isLiking, setIsLiking] = useState(false);

  const handleClick = async () => {
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLiking}
      className={cn(
        'rounded-full px-4 transition-colors',
        post.is_liked
          ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
          : 'bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-500',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 mr-2',
          post.is_liked && 'fill-current'
        )}
      />
      <span className="text-sm">{post.likes_count}</span>
    </Button>
  );
}
```

## Reference Files

### Styling Configuration
- `tailwind.config.js` - Tailwind configuration
- `styles/globals.css` - Global styles and CSS variables
- `lib/utils.ts` - `cn()` utility function

### Component Examples
- `components/ui/button.tsx` - Button component with variants
- `components/features/social/PostCard.tsx` - Complex component example
- `components/features/social/CommentModal.tsx` - Modal example
- `components/features/social/LinkPreviewCard.tsx` - Card component example

### UI Components (shadcn/ui)
- Check `components/ui/` directory for available base components
- All components follow shadcn/ui patterns
- Use these as building blocks for feature components
