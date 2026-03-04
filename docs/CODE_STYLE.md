# Code Style Guide

## TypeScript

### Type Definitions
```typescript
// ✅ Good - Explicit interface
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad - Using any
function processUser(user: any) { }
```

### Function Signatures
```typescript
// ✅ Good - Explicit return type
async function fetchUser(id: string): Promise<UserProfile | null> {
  // ...
}

// ✅ Good - Arrow function with type
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

## React Components

### Component Structure
```typescript
'use client';

import { useState } from 'react';
import type { ComponentProps } from '@/types/component';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // Hooks
  const [isLoading, setIsLoading] = useState(false);
  
  // Handlers
  const handleClick = () => {
    setIsLoading(true);
    onClick();
  };
  
  // Render
  return (
    <button
      onClick={handleClick}
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500'
      )}
    >
      {label}
    </button>
  );
}
```

### Naming Conventions
- Components: PascalCase (`PostCard.tsx`)
- Props interfaces: `ComponentNameProps`
- Hooks: camelCase starting with `use` (`usePosts`)
- Functions: camelCase (`fetchUserData`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

## File Organization

### Import Order
```typescript
// 1. React/Next.js imports
import { useState } from 'react';
import { NextRequest } from 'next/server';

// 2. Third-party imports
import { format } from 'date-fns';

// 3. Internal imports (absolute paths)
import { Button } from '@/components/ui/button';
import { usePosts } from '@/lib/hooks/usePosts';

// 4. Type imports
import type { Post } from '@/types/posts';

// 5. Relative imports
import './styles.css';
```

## Styling

### Tailwind Classes
```typescript
// ✅ Good - Using cn() utility
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  variant === 'primary' && 'primary-classes'
)}>

// ❌ Bad - Inline styles
<div style={{ color: 'red' }}>

// ❌ Bad - String concatenation
<div className={'base ' + (condition ? 'conditional' : '')}>
```

## Error Handling

### API Routes
```typescript
export async function POST(request: NextRequest) {
  try {
    // Validation
    const body = await request.json();
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Processing
    const result = await processData(body);
    
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Components
```typescript
const { data, error, isLoading } = useQuery();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataDisplay data={data} />;
```

## Comments

### When to Comment
- Complex business logic
- Non-obvious code decisions
- Workarounds or hacks
- Public API functions

### Comment Style
```typescript
/**
 * Fetches link previews for URLs in content.
 * Limits to first 3 URLs to avoid performance issues.
 * 
 * @param content - Text content that may contain URLs
 * @returns Array of link preview results
 */
async function fetchLinkPreviews(content: string): Promise<LinkPreview[]> {
  // Extract URLs using regex
  const urls = extractUrls(content);
  
  // Limit to prevent performance issues
  const urlsToProcess = urls.slice(0, 3);
  
  // ... rest of implementation
}
```
